import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface UIState {
  isProcessing: boolean;
  progress: number;
  processingStatus: string;
  chatMessages: Message[];
  isUploading: boolean;
  uploadedFiles: File[];
  messageCounter: number;
}

const initialState: UIState = {
  isProcessing: false,
  progress: 0,
  processingStatus: '',
  chatMessages: [
    {
      id: 0,
      sender: 'ai',
      text: 'Ready to process new complaints. You can paste the raw email from the customer, or upload a PDF of the complaint report. I will extract the data and run the initial risk assessment.',
      timestamp: new Date().toISOString(),
    },
  ],
  isUploading: false,
  uploadedFiles: [],
  messageCounter: 1,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setProcessing: (state, action: PayloadAction<{ progress: number; status: string; isProcessing?: boolean }>) => {
      state.isProcessing = action.payload.isProcessing ?? true;
      state.progress = action.payload.progress;
      state.processingStatus = action.payload.status;
    },
    stopProcessing: (state) => {
      state.isProcessing = false;
      state.progress = 0;
      state.processingStatus = '';
    },
    addMessage: (state, action: PayloadAction<{ sender: 'user' | 'ai'; text: string }>) => {
      state.chatMessages.push({
        id: state.messageCounter++,
        sender: action.payload.sender,
        text: action.payload.text,
        timestamp: new Date().toISOString(),
      });
    },
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload;
    },
    addFile: (state, action: PayloadAction<File>) => {
      state.uploadedFiles.push(action.payload);
    },
    resetChat: (state) => {
      state.chatMessages = [
        {
          id: 0,
          sender: 'ai',
          text: 'Ready to process new complaints. You can paste the raw email from the customer, or upload a PDF of the complaint report. I will extract the data and run the initial risk assessment.',
          timestamp: new Date().toISOString(),
        },
      ];
      state.messageCounter = 1;
    },
  },
});

export const {
  setProcessing,
  stopProcessing,
  addMessage,
  setUploading,
  addFile,
  resetChat,
} = uiSlice.actions;

export default uiSlice.reducer;