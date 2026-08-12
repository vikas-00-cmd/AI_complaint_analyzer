import { configureStore } from '@reduxjs/toolkit';
import complaintReducer from './slices/complaintSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;