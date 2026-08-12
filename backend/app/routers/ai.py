from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Dict, Any, List
import io

from agents import process_complaint, apply_correction

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


class ProcessingRequest(BaseModel):
    input_text: str
    input_type: str = "text"


class CorrectionRequest(BaseModel):
    input_text: str
    current_data: Dict[str, Any]


def extract_text_from_pdf(file_bytes: bytes) -> str:
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except ImportError:
        raise HTTPException(status_code=500, detail="python-docx not installed. Cannot process DOCX files.")


@router.post("/process")
async def process_complaint_endpoint(request: ProcessingRequest):
    try:
        result = await process_complaint(request.input_text)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()

        if len(file_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

        filename = file.filename or ""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if ext == "pdf":
            extracted_text = extract_text_from_pdf(file_bytes)
        elif ext == "docx":
            extracted_text = extract_text_from_docx(file_bytes)
        elif ext in ("txt", "eml"):
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any text from the document.")

        result = await process_complaint(extracted_text)
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/correction")
async def apply_correction_endpoint(request: CorrectionRequest):
    try:
        result = await apply_correction(request.input_text, request.current_data)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def ai_health():
    from agents import llm
    return {
        "status": "ok",
        "llm_configured": llm is not None,
        "framework": "LangGraph",
    }
