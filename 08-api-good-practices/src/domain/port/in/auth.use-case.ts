export const AUTH_USE_CASE = 'AUTH_USE_CASE';

export interface AuthOutput {
  token: string;
  user: { id: string; name: string; email: string };
}

export interface AuthUseCase {
  register(name: string, email: string, password: string): Promise<AuthOutput>;
  login(email: string, password: string): Promise<AuthOutput>;
}
