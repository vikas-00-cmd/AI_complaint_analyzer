import os
import json
import re
import logging
from typing import TypedDict, List, Optional, Dict, Any

from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("agents")

LLM_MODEL = "llama-3.1-8b-instant"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

_PLACEHOLDER_KEYS = {"", "your_groq_api_key_here", "[your_api_key]"}

llm = None
if GROQ_API_KEY and GROQ_API_KEY not in _PLACEHOLDER_KEYS:
    try:
        llm = ChatGroq(model=LLM_MODEL, temperature=0, max_tokens=2000)
        logger.info("Groq LLM initialized with model %s", LLM_MODEL)
    except Exception as e:
        logger.warning("Failed to initialize Groq LLM: %s", e)
else:
    logger.warning(
        "GROQ_API_KEY not set — using fallback mock data in nodes. "
        "Set your real key in backend/.env (https://console.groq.com)"
    )


# ---------------------------------------------------------------------------
# State definition
# ---------------------------------------------------------------------------
class ComplaintExtractionState(TypedDict):
    input_text: str
    input_type: str            # "new_complaint" | "correction" | "document"
    extracted_data: Dict[str, Any]
    risk_assessment: str
    complaint_category: str
    severity: str
    priority: str
    status: str
    next_action: str
    messages: List[Any]
    workflow_trace: List[str]  # tracks which nodes executed
    completeness_score: int
    total_fields: int
    missing_fields: List[str]
    is_complete: bool


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
EXTRACTION_PROMPT = """You are a pharmaceutical Quality Management System (QMS) AI assistant.
Your task is to extract ALL complaint details from the input text and return a SINGLE valid JSON object.

You MUST extract and return ALL of these fields — never skip any:
- complaint_source: The source of complaint (e.g., "Pharmacy", "Hospital", "Email", "Phone", "Web")
- customer_name: The customer name mentioned (e.g., "Apollo Pharmacy", "Pfizer", "Cipla")
- product_name: The product name (e.g., "Amoxicillin Capsules", "Metformin Hydrochloride API")
- product_strength: The strength or grade (e.g., "500 mg", "IP/BP")
- batch_number: The batch or lot number (e.g., "B-2026-0045", "AMX240602")
- manufacturing_date: Manufacturing date if mentioned
- expiry_date: Expiry date if mentioned
- affected_quantity: Quantity affected (e.g., "12 capsules", "500 kg")
- complaint_date: The date the complaint was received or filed (e.g., "July 15, 2026", "2026-07-15")
- complaint_category: Classify the complaint type (e.g., "Product Defect - Discoloration", "Foreign Matter Contamination", "Packaging Defect", "Labeling Error")
- description: A clear structured summary of the complaint

IMPORTANT RULES:
1. Return ONLY a valid JSON object — no markdown, no explanation, no extra text
2. If a field is not mentioned in the text, use an empty string ""
3. Every field listed above MUST appear in your JSON response
4. The JSON must be parseable by Python json.loads()

Example output format:
{"complaint_source": "Pharmacy", "customer_name": "Apollo Pharmacy", "product_name": "Amoxicillin Capsules", "product_strength": "500 mg", "batch_number": "AMX240602", "manufacturing_date": "March 2026", "expiry_date": "February 2028", "affected_quantity": "12 capsules", "complaint_date": "July 15, 2026", "complaint_category": "Product Defect - Discoloration", "description": "Customer reported discoloration"}"""

RISK_ASSESSMENT_PROMPT = """You are a pharmaceutical Quality Management System (QMS) AI agent.
Based on the extracted complaint details, generate:
1. A risk assessment (2-3 sentences)
2. Severity (Minor, Moderate, Major, Critical)
3. Priority (Low, Medium, High)
4. Suggested next action

For discoloration complaints: Severity=Major, Priority=High
For foreign matter contamination: Severity=Critical, Priority=High

Return ONLY valid JSON with keys: risk_assessment, severity, priority, next_action"""

CORRECTION_PROMPT = """You are a pharmaceutical QMS AI assistant.
The user wants to make corrections to extracted complaint fields. Parse the correction request
and extract the field name and new value. Return ONLY JSON with the format:
{"field": "batch_number", "value": "NEW_VALUE"} or {"field": "affected_quantity", "value": "NEW_VALUE"}

Only extract one field per request. If the user mentions multiple fields, pick the first one."""




# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------
def parse_json_response(text: str) -> Dict[str, Any]:
    text = text.strip()
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
    text = text.replace("'", '"')
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
    return {}


def _empty_extracted_data() -> Dict[str, Any]:
    return {
        "complaint_source": "",
        "customer_name": "",
        "product_name": "",
        "product_strength": "",
        "batch_number": "",
        "manufacturing_date": "",
        "expiry_date": "",
        "affected_quantity": "",
        "complaint_date": "",
        "complaint_category": "",
        "description": "",
    }


def _mock_extracted_data() -> Dict[str, Any]:
    return {
        "complaint_source": "Pharmacy",
        "customer_name": "Apollo Pharmacy",
        "product_name": "Amoxicillin Capsules",
        "product_strength": "500 mg",
        "batch_number": "AMX240602",
        "affected_quantity": "12 capsules",
        "manufacturing_date": "March 2026",
        "expiry_date": "February 2028",
        "complaint_category": "Product Defect - Discoloration",
        "description": "Apollo Pharmacy reported 12 discolored capsules in a sealed bottle. Requesting investigation and replacement.",
    }


def _mock_risk_data() -> Dict[str, Any]:
    return {
        "risk_assessment": "Potential moisture ingress or primary packaging seal failure leading to capsule discoloration.",
        "severity": "Major",
        "priority": "High",
        "next_action": "Route to QA Investigation & Issue Replacement",
    }


def _mock_correction(input_text: str, current_data: Dict[str, Any]) -> Dict[str, Any]:
    updated = dict(current_data)
    input_lower = input_text.lower()
    highlighted: List[str] = []

    if "batch number is" in input_lower:
        parts = input_text.split("batch number is")
        if len(parts) > 1:
            batch = parts[1].split(" and")[0].split("\n")[0].strip()
            updated["batch_number"] = batch
            highlighted.append("batch_number")

    if "quantity is" in input_lower:
        parts = input_text.split("quantity is")
        if len(parts) > 1:
            qty = parts[1].split(" and")[0].split("\n")[0].strip()
            updated["affected_quantity"] = qty
            highlighted.append("affected_quantity")

    if "product name is" in input_lower or "product is" in input_lower:
        for keyword in ["product name is", "product is"]:
            if keyword in input_lower:
                parts = input_text.split(keyword)
                if len(parts) > 1:
                    pname = parts[1].split(" and")[0].split("\n")[0].strip()
                    updated["product_name"] = pname
                    highlighted.append("product_name")
                    break

    return {"updated_data": updated, "highlighted_fields": highlighted}


# ---------------------------------------------------------------------------
# LangGraph nodes
# ---------------------------------------------------------------------------
def route_decision(state: ComplaintExtractionState) -> ComplaintExtractionState:
    """Classify the incoming input as new_complaint, correction, or document."""
    text = state["input_text"].lower().strip()
    trace = list(state.get("workflow_trace", []))

    correction_patterns = [
        "the batch number is",
        "batch number should be",
        "change batch number",
        "update batch number",
        "the quantity is",
        "quantity should be",
        "change quantity",
        "update quantity",
        "the product name is",
        "product name should be",
        "change product name",
        "update product name",
        "the customer is",
        "customer should be",
        "change customer",
        "update customer",
        "actually the",
        "correct the",
        "correction:",
    ]

    is_correction = any(p in text for p in correction_patterns)

    if is_correction:
        state["input_type"] = "correction"
    elif text.startswith("http") or text.endswith(".pdf") or text.endswith(".docx"):
        state["input_type"] = "document"
    else:
        state["input_type"] = "new_complaint"

    trace.append(f"route_decision → {state['input_type']}")
    state["workflow_trace"] = trace
    logger.info("Route decision: %s", state["input_type"])
    return state


def extract_complaint(state: ComplaintExtractionState) -> ComplaintExtractionState:
    """Extract structured complaint data using LLM or fallback mock."""
    trace = list(state.get("workflow_trace", []))
    logger.info("Node: extract_complaint")

    if llm:
        messages = [
            SystemMessage(content=EXTRACTION_PROMPT),
            HumanMessage(content=state["input_text"]),
        ]
        response = llm.invoke(messages)
        logger.info("RAW LLM RESPONSE: %s", response.content)
        extracted = parse_json_response(response.content)
        logger.info("PARSED EXTRACTION: %s", extracted)
        state["messages"] = state.get("messages", []) + [
            HumanMessage(content=state["input_text"]),
            response,
        ]
        data = _empty_extracted_data()
        data.update(extracted)
        state["extracted_data"] = data
        logger.info("LLM extraction result: %s", list(data.keys()))
    else:
        state["extracted_data"] = _mock_extracted_data()
        state["messages"] = state.get("messages", []) + [
            HumanMessage(content=state["input_text"]),
            AIMessage(content="Fallback mock extraction (no API key)."),
        ]
        logger.info("Fallback mock extraction used")

    trace.append("extract_complaint")
    state["workflow_trace"] = trace
    return state


REQUIRED_FIELDS = [
        "complaint_source", "customer_name", "product_name",
        "batch_number", "product_strength", "affected_quantity",
        "complaint_category", "description",
]


def check_completeness(state: ComplaintExtractionState) -> ComplaintExtractionState:
    trace = list(state.get("workflow_trace", []))
    logger.info("Node: check_completeness")

    data = state.get("extracted_data", {})
    missing_fields = []
    filled_count = 0

    for field in REQUIRED_FIELDS:
        val = data.get(field)
        if val and val != "" and val != "Awaiting AI extraction...":
            filled_count += 1
        else:
            missing_fields.append(field)

    state["completeness_score"] = filled_count
    state["total_fields"] = len(REQUIRED_FIELDS)
    state["missing_fields"] = missing_fields
    state["is_complete"] = len(missing_fields) == 0

    if missing_fields:
        state["status"] = "Needs Review"
        logger.info("Completeness: %d/%d — Missing: %s", filled_count, len(REQUIRED_FIELDS), missing_fields)
    else:
        state["status"] = "Ready to Commit"
        logger.info("Completeness: %d/%d — All fields present", filled_count, len(REQUIRED_FIELDS))

    trace.append("check_completeness")
    state["workflow_trace"] = trace
    return state


def assess_risk(state: ComplaintExtractionState) -> ComplaintExtractionState:
    """Assess severity, priority, and next action using LLM or fallback."""
    trace = list(state.get("workflow_trace", []))
    logger.info("Node: assess_risk")

    extraction = state.get("extracted_data", {})

    if llm:
        prompt_input = (
            f"Customer complaint details:\n"
            f"- Source: {extraction.get('complaint_source', 'N/A')}\n"
            f"- Product: {extraction.get('product_name', 'N/A')} {extraction.get('product_strength', 'N/A')}\n"
            f"- Batch: {extraction.get('batch_number', 'N/A')}\n"
            f"- Quantity: {extraction.get('affected_quantity', 'N/A')}\n"
            f"- Description: {extraction.get('description', 'N/A')}\n"
            f"- Category: {extraction.get('complaint_category', 'N/A')}"
        )
        messages = [
            SystemMessage(content=RISK_ASSESSMENT_PROMPT),
            HumanMessage(content=prompt_input),
        ]
        response = llm.invoke(messages)
        risk = parse_json_response(response.content)
        state["messages"] = state.get("messages", []) + [response]
        logger.info("LLM risk result: %s", risk)
    else:
        risk = _mock_risk_data()
        state["messages"] = state.get("messages", []) + [
            AIMessage(content="Fallback mock risk assessment (no API key).")
        ]
        logger.info("Fallback mock risk assessment used")

    state["severity"] = risk.get("severity", "Major")
    state["priority"] = risk.get("priority", "High")
    state["risk_assessment"] = risk.get("risk_assessment", "Pending risk assessment.")
    state["next_action"] = risk.get("next_action", "Route to QA investigation")
    state["complaint_category"] = extraction.get("complaint_category", "Pending Classification")
    state["status"] = "Ready to Commit"

    trace.append("assess_risk")
    state["workflow_trace"] = trace
    return state





def apply_corrections(state: ComplaintExtractionState) -> ComplaintExtractionState:
    """Apply user corrections to previously extracted data."""
    trace = list(state.get("workflow_trace", []))
    logger.info("Node: apply_corrections")

    if llm:
        messages = [
            SystemMessage(content=CORRECTION_PROMPT),
            HumanMessage(content=state["input_text"]),
        ]
        response = llm.invoke(messages)
        correction = parse_json_response(response.content)
        state["messages"] = state.get("messages", []) + [
            HumanMessage(content=state["input_text"]),
            response,
        ]

        if correction.get("field") and correction.get("value"):
            field = correction["field"]
            value = correction["value"]
            state["extracted_data"][field] = value
            state["messages"].append(AIMessage(content=f"Updated {field} to {value}."))
            logger.info("LLM correction: %s → %s", field, value)
        else:
            state["messages"].append(AIMessage(content="Could not parse correction."))
            logger.warning("LLM correction parse failed")
    else:
        mock = _mock_correction(state["input_text"], state.get("extracted_data", {}))
        state["extracted_data"] = mock["updated_data"]
        state["messages"] = state.get("messages", []) + [
            HumanMessage(content=state["input_text"]),
            AIMessage(content=f"Fallback correction applied (no API key). Highlighted: {mock['highlighted_fields']}"),
        ]
        logger.info("Fallback correction used: %s", mock["highlighted_fields"])

    state["status"] = "Ready to Commit"

    trace.append("apply_corrections")
    state["workflow_trace"] = trace
    return state


# ---------------------------------------------------------------------------
# Routing functions (conditional edges)
# ---------------------------------------------------------------------------
def request_clarification(state: ComplaintExtractionState) -> ComplaintExtractionState:
    """Prompt user for missing fields."""
    trace = list(state.get("workflow_trace", []))
    logger.info("Node: request_clarification")

    missing = state.get("missing_fields", [])
    if missing:
        msg = f"Please provide the following missing information: {', '.join(missing)}. "
        msg += "You can reply with corrections like 'The batch number is B-2026-0099'."
        state["messages"] = state.get("messages", []) + [
            AIMessage(content=msg)
        ]
        state["status"] = "Needs Review"

    trace.append("request_clarification")
    state["workflow_trace"] = trace
    return state


def route_after_decision(state: ComplaintExtractionState) -> str:
    t = state.get("input_type", "new_complaint")
    if t == "correction":
        return "apply_corrections"
    if t == "document":
        return "extract_from_document"
    return "extract_complaint"


def route_after_extraction(state: ComplaintExtractionState) -> str:
    """Route to completeness checker after extraction."""
    return "check_completeness"


def route_after_completeness(state: ComplaintExtractionState) -> str:
    """Decide next step after completeness check."""
    if state.get("is_complete", False):
        return "assess_risk"
    return "request_clarification"


# ---------------------------------------------------------------------------
# Build the LangGraph workflow
# ---------------------------------------------------------------------------
def build_workflow() -> StateGraph:
    workflow = StateGraph(ComplaintExtractionState)

    workflow.add_node("route_decision", route_decision)
    workflow.add_node("extract_complaint", extract_complaint)
    workflow.add_node("extract_from_document", extract_complaint)
    workflow.add_node("check_completeness", check_completeness)
    workflow.add_node("request_clarification", request_clarification)
    workflow.add_node("assess_risk", assess_risk)
    workflow.add_node("apply_corrections", apply_corrections)

    workflow.set_entry_point("route_decision")

    workflow.add_conditional_edges(
        "route_decision",
        route_after_decision,
        {
            "extract_complaint": "extract_complaint",
            "extract_from_document": "extract_from_document",
            "apply_corrections": "apply_corrections",
        },
    )

    workflow.add_edge("extract_complaint", "check_completeness")
    workflow.add_edge("extract_from_document", "check_completeness")

    workflow.add_conditional_edges(
        "check_completeness",
        route_after_completeness,
        {
            "assess_risk": "assess_risk",
            "request_clarification": "request_clarification",
        },
    )

    workflow.add_edge("request_clarification", END)
    workflow.add_edge("assess_risk", END)
    workflow.add_edge("apply_corrections", END)

    return workflow


# ---------------------------------------------------------------------------
# Public API — always builds and compiles the workflow
# ---------------------------------------------------------------------------
async def process_complaint(input_text: str) -> Dict[str, Any]:
    logger.info("=== process_complaint called ===")

    workflow = build_workflow()
    app = workflow.compile()

    initial_state: ComplaintExtractionState = {
        "input_text": input_text,
        "input_type": "new_complaint",
        "extracted_data": {},
        "risk_assessment": "",
        "complaint_category": "",
        "severity": "",
        "priority": "",
        "status": "Pending Triage",
        "next_action": "",
        "messages": [],
        "workflow_trace": [],
        "completeness_score": 0,
        "total_fields": 0,
        "missing_fields": [],
        "is_complete": False,
    }

    result = await app.ainvoke(initial_state)

    logger.info("Workflow trace: %s", result.get("workflow_trace", []))

    return {
        "extracted_data": result.get("extracted_data", {}),
        "risk_assessment": result.get("risk_assessment", ""),
        "severity": result.get("severity", ""),
        "priority": result.get("priority", ""),
        "complaint_category": result.get("complaint_category", ""),
        "status": result.get("status", "Ready to Commit"),
        "next_action": result.get("next_action", ""),
        "workflow_trace": result.get("workflow_trace", []),
        "completeness_score": result.get("completeness_score", 0),
        "total_fields": result.get("total_fields", 8),
        "missing_fields": result.get("missing_fields", []),
        "is_complete": result.get("is_complete", True),
    }


async def apply_correction(input_text: str, current_data: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("=== apply_correction called ===")

    workflow = build_workflow()
    app = workflow.compile()

    initial_state: ComplaintExtractionState = {
        "input_text": input_text,
        "input_type": "correction",
        "extracted_data": dict(current_data),
        "risk_assessment": "",
        "complaint_category": "",
        "severity": "",
        "priority": "",
        "status": "Ready to Commit",
        "next_action": "",
        "messages": [],
        "workflow_trace": [],
        "completeness_score": 0,
        "total_fields": 0,
        "missing_fields": [],
        "is_complete": False,
    }

    result = await app.ainvoke(initial_state)

    logger.info("Workflow trace: %s", result.get("workflow_trace", []))

    return {
        "extracted_data": result.get("extracted_data", {}),
        "message": "Correction applied successfully.",
        "highlighted_fields": [
            k for k in result.get("extracted_data", {})
            if result.get("extracted_data", {}).get(k) != current_data.get(k)
        ],
        "workflow_trace": result.get("workflow_trace", []),
    }
