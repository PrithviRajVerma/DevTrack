import { apiClient } from './client';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/auth';

export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logoutUser(): Promise<{ message: string }> {
  return apiClient<{ message: string }>('/auth/logout', {
    method: 'POST',
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>('/users/me', {
    method: 'GET',
  });
}
