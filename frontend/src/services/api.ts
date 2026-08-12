import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message;
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export interface ComplaintPayload {
  complaint_source: string;
  customer_name: string;
  product_name: string;
  product_strength: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  affected_quantity: string;
  complaint_category: string;
  complaint_date: string;
  description: string;
  severity: string;
  priority: string;
  risk_assessment: string;
  status: string;
}

export const createComplaint = async (data: ComplaintPayload) => {
  const response = await api.post('/complaints/', data);
  return response.data;
};

export const getComplaints = async () => {
  const response = await api.get('/complaints/');
  return response.data;
};

export const getComplaint = async (id: number) => {
  const response = await api.get(`/complaints/${id}`);
  return response.data;
};

export const updateComplaint = async (id: number, data: Partial<ComplaintPayload>) => {
  const response = await api.put(`/complaints/${id}`, data);
  return response.data;
};

export const getBatches = async () => {
  const response = await api.get('/batches/');
  return response.data;
};

export const getBatch = async (batchNumber: string) => {
  const response = await api.get(`/batches/${batchNumber}`);
  return response.data;
};

export const getCustomers = async () => {
  const response = await api.get('/customers/');
  return response.data;
};

export const getProducts = async () => {
  const response = await api.get('/products/');
  return response.data;
};

export const processComplaint = async (inputText: string, inputType: string = 'text') => {
  const response = await api.post('/ai/process', {
    input_text: inputText,
    input_type: inputType,
  });
  return response.data;
};

export const applyCorrection = async (inputText: string, currentData: Record<string, any>) => {
  const response = await api.post('/ai/correction', {
    input_text: inputText,
    current_data: currentData,
  });
  return response.data;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/ai/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return response.data;
};

export default api;
