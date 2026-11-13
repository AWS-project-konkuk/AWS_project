import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
});
