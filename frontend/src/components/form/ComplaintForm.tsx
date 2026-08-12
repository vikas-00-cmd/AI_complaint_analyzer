import React, { useState, useRef } from 'react';
import { updateField, resetForm, ComplaintFieldName } from '../../store/slices/complaintSlice';
import { createComplaint, ComplaintPayload } from '../../services/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    margin: '0 0 4px',
    fontSize: '24px',
    fontWeight: 700,
    color: '#333',
  },
  subtitle: {
    margin: '0 0 12px',
    fontSize: '14px',
    color: '#666',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  statusBadgeReady: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  section: {
    marginBottom: '24px',
    borderBottom: '1px solid #e8e8e8',
    paddingBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#444',
  },
  fieldRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '16px',
    marginBottom: '16px',
  },
  fieldHalf: {
    flex: 1,
    minWidth: 0,
  },
  fieldFull: {
    width: '100%',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  inputWithIcon: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    paddingRight: '36px',
  },
  inputHighlighted: {
    border: '2px solid #28a745',
    backgroundColor: '#f8fff9',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: '80px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
  },
  dateContainer: {
    position: 'relative' as const,
    width: '100%',
  },
  dateIcon: {
    position: 'absolute' as const,
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
    cursor: 'pointer',
    zIndex: 2,
  },
  hiddenDatePicker: {
    position: 'absolute' as const,
    opacity: 0,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    cursor: 'pointer',
    zIndex: 3,
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white',
    fontSize: '15px',
    padding: '14px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  footer: {
    display: 'flex',
    gap: '16px',
    paddingTop: '20px',
    borderTop: '1px solid #e8e8e8',
    justifyContent: 'space-between',
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  resetButton: {
    backgroundColor: '#ffffff',
    color: '#555',
    border: '1px solid #d9d9d9',
  },
  commitButton: {
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '15px',
    padding: '14px 32px',
  },
  saveSuccess: {
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: '#d4edda',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#155724',
  },
  saveError: {
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: '#f8d7da',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#721c24',
  },
};

const ComplaintForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.complaint);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const mfgDateRef = useRef<HTMLInputElement>(null);
  const expDateRef = useRef<HTMLInputElement>(null);
  const compDateRef = useRef<HTMLInputElement>(null);

  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    ref.current?.showPicker?.();
    ref.current?.focus();
  };

  const handleFieldChange = (field: ComplaintFieldName, value: string) => {
    dispatch(updateField({ field, value }));
  };

  const handleReset = () => {
    dispatch(resetForm());
    setSaveMessage('');
    setIsError(false);
  };

  const handleCommitToQMS = async () => {
    if (!state.customerName || !state.productName || !state.batchNumber) {
      setSaveMessage('Please fill in required fields: Customer Name, Product Name, Batch Number.');
      setIsError(true);
      return;
    }

    setIsSaving(true);
    setSaveMessage('');
    setIsError(false);

    const payload: ComplaintPayload = {
      complaint_source: state.complaintSource,
      customer_name: state.customerName,
      product_name: state.productName,
      product_strength: state.productStrength,
      batch_number: state.batchNumber,
      manufacturing_date: state.manufacturingDate,
      expiry_date: state.expiryDate,
      affected_quantity: state.affectedQuantity,
      complaint_category: state.complaintCategory,
      complaint_date: state.complaintDate,
      description: state.description,
      severity: state.severity,
      priority: state.priority,
      risk_assessment: state.riskAssessment,
      status: state.status === 'Ready to Commit' ? 'Committed' : state.status,
    };

    try {
      await createComplaint(payload);
      setSaveMessage('Complaint successfully committed to QMS Ledger!');
      setIsError(false);
      dispatch(updateField({ field: 'status', value: 'Committed' }));
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveMessage('Error: Could not connect to backend. Check if FastAPI is running.');
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const severityOptions = ['Minor', 'Moderate', 'Major', 'Critical'];
  const priorityOptions = ['Low', 'Medium', 'High'];
  const isReady = state.status === 'Ready to Commit';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Log Customer Complaint</h2>
        <p style={styles.subtitle}>API &amp; FDF Quality Assurance Module</p>
        <span style={isReady ? styles.statusBadgeReady : styles.statusBadge}>
          [{state.status}]
        </span>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>1. ORIGIN &amp; CUSTOMER DETAILS</h3>
        <div style={styles.fieldRow}>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="complaintSource">Complaint Source</label>
            <input id="complaintSource" style={styles.input} type="text" value={state.complaintSource} onChange={(e) => handleFieldChange('complaintSource', e.target.value)} placeholder="Awaiting AI extraction..." />
          </div>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="customerName">Customer Name</label>
            <input id="customerName" style={styles.input} type="text" value={state.customerName} onChange={(e) => handleFieldChange('customerName', e.target.value)} placeholder="Awaiting AI extraction..." />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>2. PRODUCT &amp; BATCH IDENTIFICATION</h3>
        <div style={styles.fieldRow}>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="productName">Product Name</label>
            <input id="productName" style={{ ...styles.input, ...(state.highlightedFields.includes('productName') ? styles.inputHighlighted : {}) }} type="text" value={state.productName} onChange={(e) => handleFieldChange('productName', e.target.value)} placeholder="Awaiting AI extraction..." />
          </div>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="productStrength">Product Strength/Grade</label>
            <input id="productStrength" style={{ ...styles.input, ...(state.highlightedFields.includes('productStrength') ? styles.inputHighlighted : {}) }} type="text" value={state.productStrength} onChange={(e) => handleFieldChange('productStrength', e.target.value)} placeholder="Awaiting AI extraction..." />
          </div>
        </div>

        <div style={styles.fieldRow}>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="batchNumber">Batch/Lot Number</label>
            <input id="batchNumber" style={{ ...styles.input, ...(state.highlightedFields.includes('batchNumber') ? styles.inputHighlighted : {}) }} type="text" value={state.batchNumber} onChange={(e) => handleFieldChange('batchNumber', e.target.value)} placeholder="Awaiting AI extraction..." />
          </div>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="affectedQuantity">Affected Quantity</label>
            <input id="affectedQuantity" style={{ ...styles.input, ...(state.highlightedFields.includes('affectedQuantity') ? styles.inputHighlighted : {}) }} type="text" value={state.affectedQuantity} onChange={(e) => handleFieldChange('affectedQuantity', e.target.value)} placeholder="Awaiting AI extraction..." />
          </div>
        </div>

        <div style={styles.fieldRow}>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="manufacturingDate">Manufacturing Date</label>
            <div style={styles.dateContainer}>
              <input
                id="manufacturingDate"
                style={styles.inputWithIcon}
                type="text"
                readOnly
                value={state.manufacturingDate || ''}
                placeholder="Awaiting AI extraction..."
              />
              <input
                ref={mfgDateRef}
                type="date"
                style={styles.hiddenDatePicker}
                value={state.manufacturingDate}
                onChange={(e) => handleFieldChange('manufacturingDate', e.target.value)}
              />
              <span style={styles.dateIcon} onClick={() => openDatePicker(mfgDateRef)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                </svg>
              </span>
            </div>
          </div>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="expiryDate">Expiry Date</label>
            <div style={styles.dateContainer}>
              <input
                id="expiryDate"
                style={styles.inputWithIcon}
                type="text"
                readOnly
                value={state.expiryDate || ''}
                placeholder="Awaiting AI extraction..."
              />
              <input
                ref={expDateRef}
                type="date"
                style={styles.hiddenDatePicker}
                value={state.expiryDate}
                onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
              />
              <span style={styles.dateIcon} onClick={() => openDatePicker(expDateRef)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>3. COMPLAINT DETAILS</h3>
        <div style={styles.fieldRow}>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="complaintCategory">Complaint Category</label>
            <input id="complaintCategory" style={styles.input} type="text" value={state.complaintCategory} onChange={(e) => handleFieldChange('complaintCategory', e.target.value)} placeholder="Awaiting AI extraction..." />
          </div>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="complaintDate">Complaint Date</label>
            <div style={styles.dateContainer}>
              <input
                id="complaintDate"
                style={styles.inputWithIcon}
                type="text"
                readOnly
                value={state.complaintDate || ''}
                placeholder="Awaiting AI extraction..."
              />
              <input
                ref={compDateRef}
                type="date"
                style={styles.hiddenDatePicker}
                value={state.complaintDate}
                onChange={(e) => handleFieldChange('complaintDate', e.target.value)}
              />
              <span style={styles.dateIcon} onClick={() => openDatePicker(compDateRef)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div style={styles.fieldRow}>
          <div style={styles.fieldFull}>
            <label style={styles.label} htmlFor="description">Detailed Complaint Description</label>
            <textarea id="description" style={styles.textarea} value={state.description} onChange={(e) => handleFieldChange('description', e.target.value)} placeholder="Awaiting AI extraction..." />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>4. INITIAL ASSESSMENT &amp; PRIORITY</h3>
        <div style={styles.fieldRow}>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="severity">Initial Severity</label>
            <select id="severity" style={styles.select} value={state.severity} onChange={(e) => handleFieldChange('severity', e.target.value)}>
              <option value="">Select severity...</option>
              {severityOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div style={styles.fieldHalf}>
            <label style={styles.label} htmlFor="priority">Priority</label>
            <select id="priority" style={styles.select} value={state.priority} onChange={(e) => handleFieldChange('priority', e.target.value)}>
              <option value="">Select priority...</option>
              {priorityOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        <div style={styles.fieldRow}>
          <div style={styles.fieldFull}>
            <label style={styles.label} htmlFor="riskAssessment">AI Risk Assessment</label>
            <textarea id="riskAssessment" style={styles.textarea} value={state.riskAssessment} onChange={(e) => handleFieldChange('riskAssessment', e.target.value)} placeholder="AI will generate risk assessment..." />
          </div>
        </div>
      </div>


      <div style={styles.footer}>
        <button style={{ ...styles.button, ...styles.resetButton }} onClick={handleReset} disabled={isSaving}>Reset Form</button>
        <button style={{ ...styles.button, ...styles.saveButton }} onClick={handleCommitToQMS} disabled={isSaving}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          {isSaving ? 'Saving...' : 'Save Complaint'}
        </button>
      </div>

      {saveMessage && (
        <div style={isError ? styles.saveError : styles.saveSuccess}>{saveMessage}</div>
      )}
    </div>
  );
};

export default ComplaintForm;
