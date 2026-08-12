import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ComplaintState {
  complaintSource: string;
  customerName: string;
  productName: string;
  productStrength: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  affectedQuantity: string;
  complaintCategory: string;
  complaintDate: string;
  description: string;
  severity: string;
  priority: string;
  riskAssessment: string;
  status: string;
  complaintType: string;
  originatingSite: string;
  impactedNPM: string;
  highlightedFields: string[];
}

export type ComplaintFieldName = Exclude<keyof ComplaintState, 'highlightedFields'>;

const initialState: ComplaintState = {
  complaintSource: '',
  customerName: '',
  productName: '',
  productStrength: '',
  batchNumber: '',
  manufacturingDate: '',
  expiryDate: '',
  affectedQuantity: '',
  complaintCategory: '',
  complaintDate: '',
  description: '',
  severity: '',
  priority: '',
  riskAssessment: '',
  status: 'Pending Triage',
  complaintType: '',
  originatingSite: '',
  impactedNPM: '',
  highlightedFields: [],
};

const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    updateField: (state, action: PayloadAction<{ field: ComplaintFieldName; value: string }>) => {
      const { field, value } = action.payload;
      state[field] = value;
      if (state.highlightedFields.includes(field)) {
        state.highlightedFields = state.highlightedFields.filter(f => f !== field);
      }
    },
    highlightField: (state, action: PayloadAction<string>) => {
      if (!state.highlightedFields.includes(action.payload)) {
        state.highlightedFields.push(action.payload);
      }
    },
    removeHighlight: (state, action: PayloadAction<string>) => {
      state.highlightedFields = state.highlightedFields.filter(f => f !== action.payload);
    },
    resetForm: () => initialState,
    setComplaintData: (state, action: PayloadAction<Partial<ComplaintState>>) => {
      const { highlightedFields: _, ...data } = action.payload;
      Object.assign(state, data);
      state.status = action.payload.status || 'Ready to Commit';
      state.highlightedFields = [];
    },
    setHighlightedFields: (state, action: PayloadAction<string[]>) => {
      state.highlightedFields = action.payload;
    },
  },
});

export const {
  updateField,
  highlightField,
  removeHighlight,
  resetForm,
  setComplaintData,
  setHighlightedFields,
} = complaintSlice.actions;

export default complaintSlice.reducer;
