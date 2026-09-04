import axios from 'axios';
import type { ApiResponse, FieldError } from '../types/moveRequest';
import { getCurrentDemoUser } from './demoSession';

export const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 75_000 });
http.interceptors.request.use((config) => {
  // A demo identity is not a credential; server-side scope checks remain required.
  const user = getCurrentDemoUser();
  if (user) config.headers.set(user.userType === 'RESIDENT' ? 'X-Resident-Id' : 'X-Admin-Id', user.id);
  return config;
});

export async function getData<T>(path: string, params?: object): Promise<T> {
  return (await http.get<ApiResponse<T>>(path, { params })).data.data;
}

export function isMissingAssessment(error: unknown): boolean {
  return axios.isAxiosError<{ errors?: FieldError[] }>(error) && error.response?.status === 404
    && error.response.data.errors?.some((item) => item.field === 'assessment') === true;
}

export function apiErrors(error: unknown): FieldError[] {
  if (axios.isAxiosError<{ errors?: FieldError[] }>(error)) {
    const errors = error.response?.data?.errors;
    if (Array.isArray(errors) && errors.length && errors.every((item) => item && typeof item.field === 'string' && typeof item.message === 'string')) return errors;
    if (!error.response) return [{ field: 'request', message: 'Could not reach the server. Check your connection and retry. If you were saving, refresh to check whether it completed.' }];
    return [{ field: 'request', message: `The request failed (${error.response.status}). Please try again.` }];
  }
  return [{ field: 'request', message: error instanceof Error ? error.message : 'Something went wrong. Please try again.' }];
}
