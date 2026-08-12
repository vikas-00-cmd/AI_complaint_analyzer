import React, { useState, useCallback, useRef, useEffect } from 'react';
import { addMessage, setProcessing } from '../../store/slices/uiSlice';
import { updateField } from '../../store/slices/complaintSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { processComplaint, applyCorrection, uploadFile } from '../../services/api';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
  },
  uploadSection: {
    padding: '16px 20px',
    borderBottom: '1px solid #e0e0e0',
  },
  dropZone: {
    border: '2px dashed #ccc',
    borderRadius: '12px',
    padding: '24px 16px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    transition: 'border-color 0.2s, background-color 0.2s',
  },
  dropZoneActive: {
    borderColor: '#007bff',
    backgroundColor: '#f0f7ff',
  },
  dropZoneIcon: {
    marginBottom: '8px',
    color: '#999',
  },
  dropZoneText: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '4px',
  },
  dropZoneBold: {
    color: '#007bff',
    fontWeight: 600,
    cursor: 'pointer',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '12px 0',
    color: '#999',
    fontSize: '13px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    padding: '0 12px',
  },
  pasteButton: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  supportNotice: {
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: '#e8f4fd',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#0c5460',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
  },
  chatContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: '12px 16px',
    borderRadius: '18px',
    fontSize: '14px',
    lineHeight: 1.4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    color: 'white',
    borderBottomRightRadius: '5px',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    color: '#333',
    borderBottomLeftRadius: '5px',
  },
  aiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  aiIcon: {
    width: '24px',
    height: '24px',
    backgroundColor: '#007bff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
  },
  inputArea: {
    padding: '16px 20px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
  },
  sendButton: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  attachButton: {
    padding: '12px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  fileBanner: {
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#e8f4fd',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#0c5460',
    textAlign: 'center' as const,
  },
  footer: {
    padding: '8px 20px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#999',
    borderTop: '1px solid #e0e0e0',
  },
};

const AICopilot: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const dispatch = useAppDispatch();
  const { chatMessages, isProcessing, progress, processingStatus } = useAppSelector((state) => state.ui);
  const complaintState = useAppSelector((state) => state.complaint);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const populateFormData = useCallback((data: any) => {
    dispatch(updateField({ field: 'complaintSource', value: data.complaint_source || '' }));
    dispatch(updateField({ field: 'customerName', value: data.customer_name || '' }));
    dispatch(updateField({ field: 'productName', value: data.product_name || '' }));
    dispatch(updateField({ field: 'productStrength', value: data.product_strength || '' }));
    dispatch(updateField({ field: 'batchNumber', value: data.batch_number || '' }));
    dispatch(updateField({ field: 'affectedQuantity', value: data.affected_quantity || '' }));
    dispatch(updateField({ field: 'manufacturingDate', value: data.manufacturing_date || '' }));
    dispatch(updateField({ field: 'expiryDate', value: data.expiry_date || '' }));
    dispatch(updateField({ field: 'complaintCategory', value: data.complaint_category || data.category || '' }));
    dispatch(updateField({ field: 'complaintDate', value: data.complaint_date || '' }));
    dispatch(updateField({ field: 'severity', value: '' }));
    dispatch(updateField({ field: 'priority', value: '' }));
    dispatch(updateField({ field: 'riskAssessment', value: '' }));
    dispatch(updateField({ field: 'description', value: data.description || '' }));
  }, [dispatch]);

  const processFile = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      dispatch(addMessage({ sender: 'ai', text: 'File is too large. Maximum size is 10MB.' }));
      return;
    }

    const allowedExtensions = ['.pdf', '.docx', '.txt', '.eml'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      dispatch(addMessage({ sender: 'ai', text: 'Unsupported file type. Please upload PDF, DOCX, TXT, or EML files.' }));
      return;
    }

    const fileName = file.name;
    dispatch(setProcessing({ progress: 10, status: 'Extracting text from document...' }));
    dispatch(addMessage({ sender: 'user', text: `[Document: ${fileName}]` }));

    try {
      dispatch(setProcessing({ progress: 40, status: 'Processing document with LangGraph agent...' }));
      const result = await uploadFile(file);

      if (!result.success) {
        throw new Error(result.detail || 'Failed to process document');
      }

      const data = result.data?.extracted_data || {};
      populateFormData(data);

      dispatch(updateField({ field: 'severity', value: result.data?.severity || '' }));
      dispatch(updateField({ field: 'priority', value: result.data?.priority || '' }));
      dispatch(updateField({ field: 'riskAssessment', value: result.data?.risk_assessment || '' }));
      dispatch(updateField({ field: 'status', value: 'Ready to Commit' }));
      if (data.description) {
        dispatch(updateField({ field: 'description', value: data.description }));
      }

      const workflowTrace = result.data?.workflow_trace || [];
      dispatch(addMessage({
        sender: 'ai',
        text: `Document analysis complete. Text extracted from "${fileName}" and complaint details parsed successfully.\n\nWorkflow: ${workflowTrace.join(' → ')}`
      }));
      dispatch(setProcessing({ progress: 100, status: '', isProcessing: false }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error.message || 'Failed to process document.';
      dispatch(addMessage({ sender: 'ai', text: 'Error: ' + errorMessage }));
      dispatch(setProcessing({ progress: 100, status: '', isProcessing: false }));
    }
  }, [dispatch, populateFormData]);

  const handlePasteText = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setInputValue(text.trim());
      } else {
        dispatch(addMessage({ sender: 'ai', text: 'Clipboard is empty. Please copy a complaint email or text first, then try again.' }));
      }
    } catch {
      dispatch(addMessage({ sender: 'ai', text: 'Unable to access clipboard. Please paste the complaint text manually into the input field.' }));
    }
  }, [dispatch]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const userInput = inputValue;
    dispatch(addMessage({ sender: 'user', text: userInput }));
    dispatch(setProcessing({ progress: 10, status: 'Analyzing document content and extracting key details...' }));

    try {
      let result;
      const inputLower = userInput.toLowerCase();
      const correctionPatterns = [
        'the batch number is', 'batch number should be', 'change batch number', 'update batch number',
        'the quantity is', 'quantity should be', 'change quantity', 'update quantity',
        'the product name is', 'product name should be', 'change product name', 'update product name',
        'the customer is', 'customer should be', 'change customer', 'update customer',
        'actually the', 'correct the', 'correction:',
      ];
      const isCorrection = correctionPatterns.some(p => inputLower.includes(p));

      if (isCorrection) {
        const currentData = {
          complaint_source: complaintState.complaintSource,
          customer_name: complaintState.customerName,
          product_name: complaintState.productName,
          product_strength: complaintState.productStrength,
          batch_number: complaintState.batchNumber,
          manufacturing_date: complaintState.manufacturingDate,
          expiry_date: complaintState.expiryDate,
          affected_quantity: complaintState.affectedQuantity,
          complaint_category: complaintState.complaintCategory,
          description: complaintState.description,
        };

        dispatch(setProcessing({ progress: 50, status: 'Processing correction...' }));
        result = await applyCorrection(userInput, currentData);

        const fieldMap: Record<string, string> = {
          complaint_source: 'complaintSource',
          customer_name: 'customerName',
          product_name: 'productName',
          product_strength: 'productStrength',
          batch_number: 'batchNumber',
          manufacturing_date: 'manufacturingDate',
          expiry_date: 'expiryDate',
          affected_quantity: 'affectedQuantity',
          complaint_category: 'complaintCategory',
          description: 'description',
        };

        if (result.data?.extracted_data) {
          const updated = result.data.extracted_data;
          Object.entries(updated).forEach(([key, value]) => {
            const fieldName = fieldMap[key];
            if (fieldName && value !== undefined) {
              dispatch(updateField({ field: fieldName as any, value: String(value) }));
            }
          });

          if (result.data.highlighted_fields?.length) {
            const highlightedNames = result.data.highlighted_fields.map((f: string) => fieldMap[f] || f);
            highlightedNames.forEach((name: string) => {
              dispatch({ type: 'complaint/highlightField', payload: name });
            });
          }
        }

        dispatch(addMessage({ sender: 'ai', text: result.data?.message || "Correction applied." }));
      } else {
        dispatch(setProcessing({ progress: 30, status: 'Extracting data via NLP...' }));
        result = await processComplaint(userInput);

        const data = result.data?.extracted_data || {};
        populateFormData(data);

        dispatch(setProcessing({
          progress: 70,
          status: 'Running risk assessment...'
        }));

        const severity = result.data?.severity || '';
        const priority = result.data?.priority || '';
        const riskAssessment = result.data?.risk_assessment || '';
        const nextAction = result.data?.next_action || '';

        dispatch(updateField({ field: 'severity', value: severity }));
        dispatch(updateField({ field: 'priority', value: priority }));
        dispatch(updateField({ field: 'riskAssessment', value: riskAssessment }));
        dispatch(updateField({ field: 'status', value: 'Ready to Commit' }));

        const workflowTrace = result.data?.workflow_trace || [];
        const aiMessage = result.data?.extracted_data
          ? `Complaint parsed successfully. I have extracted ${result.data.completeness_score || 0}/${result.data.total_fields || 8} fields.`
          : "I have processed your request. Please provide specific complaint details or upload a document.";

        dispatch(addMessage({ sender: 'ai', text: aiMessage }));

        if (result.data?.missing_fields && result.data.missing_fields.length > 0) {
          dispatch(addMessage({
            sender: 'ai',
            text: `⚠️ Missing fields: ${result.data.missing_fields.join(', ')}. Please provide these details.`
          }));
        }

        if (result.data?.is_complete === false && result.data?.status === 'Needs Review') {
          dispatch(updateField({ field: 'status', value: 'Needs Review' }));
        } else if (result.data?.is_complete !== false) {
          dispatch(updateField({ field: 'status', value: 'Ready to Commit' }));
        }

        if (nextAction) {
          dispatch(addMessage({ sender: 'ai', text: `Suggested action: ${nextAction}` }));
        }
      }

      dispatch(setProcessing({ progress: 100, status: '', isProcessing: false }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error.message || 'An error occurred while processing your request.';
      dispatch(addMessage({ sender: 'ai', text: 'Error: ' + errorMessage }));
      dispatch(setProcessing({ progress: 100, status: '', isProcessing: false }));
    }

    setInputValue('');
  }, [dispatch, inputValue, complaintState, populateFormData]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFile(files[0]);
    e.target.value = '';
  }, [processFile]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>AIVOA Copilot</h3>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Drop complaint files or paste text below.</p>
      </div>

      <div style={styles.uploadSection}>
        <div
          ref={dropZoneRef}
          style={{ ...styles.dropZone, ...(isDragOver ? styles.dropZoneActive : {}) }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={styles.dropZoneIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
              <path d="M12 12v9"></path>
              <path d="m16 16-4-4-4 4"></path>
            </svg>
          </div>
          <div style={styles.dropZoneText}>
            <span style={styles.dropZoneBold}>Drag & drop complaint document here</span> or <span style={styles.dropZoneBold}>click to browse</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          accept=".pdf,.docx,.txt,.eml"
        />

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>OR</span>
          <div style={styles.dividerLine} />
        </div>

        <button style={styles.pasteButton} onClick={handlePasteText}>
          📄 Paste Complaint Text / Email
        </button>

        <div style={styles.supportNotice}>
          <span>ℹ️</span>
          <span><strong>Supported formats:</strong> PDF, DOCX, TXT, EML &nbsp;|&nbsp; <strong>Max file size:</strong> 10MB</span>
        </div>
      </div>

      <div style={styles.chatContainer}>
        {chatMessages.map((msg) => (
          <div key={msg.id}>
            <div style={{
              ...styles.messageBubble,
              ...(msg.sender === 'user' ? styles.userBubble : styles.aiBubble)
            }}>
              {msg.sender === 'ai' && (
                <div style={styles.aiHeader}>
                  <div style={styles.aiIcon}>AI</div>
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div style={{ ...styles.messageBubble, ...styles.aiBubble }}>
            <div style={styles.aiHeader}>
              <div style={styles.aiIcon}>AI</div>
            </div>
            {processingStatus}
            <div style={{ width: '100%', height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: progress + '%', height: '100%', backgroundColor: '#007bff', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={styles.inputArea}>
        <div style={styles.inputContainer}>
          <label style={styles.attachButton} htmlFor="file-upload-bottom" aria-label="Attach file">📎</label>
          <input id="file-upload-bottom" type="file" style={{ display: 'none' }} onChange={handleFileUpload} accept=".pdf,.docx,.txt,.eml" />
          <input
            style={styles.input}
            type="text"
            placeholder="Ask me anything about this complaint..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button style={styles.sendButton} onClick={handleSendMessage} aria-label="Send message">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
            Send
          </button>
        </div>
      </div>

      <div style={styles.footer}>
        POWERED BY LANGGRAPH | AI responses may contain errors. Please verify information.
      </div>
    </div>
  );
};

export default AICopilot;
