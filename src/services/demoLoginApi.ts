import axios from 'axios';
import { http } from './http';
import { isDemoUser } from './demoSession';
import type { DemoLoginResponse } from '../types/demoLogin';

export async function loginByEmail(email: string): Promise<DemoLoginResponse> {
  const { data } = await http.post<unknown>('/demo/login', { email });
  if (!isDemoUser(data)) throw new Error('Invalid login response.');
  return data;
}
export function loginErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Unable to connect to the server. Please try again.';
    if (error.response.status === 404) return 'No account found for this email.';
    if (error.response.status === 409) return 'Multiple accounts use this email. Please contact your community administrator.';
    if (error.response.status === 400) return 'Enter a valid email address.';
  }
  return 'Something went wrong. Please try again.';
}
