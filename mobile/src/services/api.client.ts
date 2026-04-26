import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { ApiError } from '../types';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = error.response?.data?.error ?? {
      code: 'NETWORK_ERROR',
      message: 'Something went wrong. Please try again.',
    };
    return Promise.reject(apiError);
  },
);
