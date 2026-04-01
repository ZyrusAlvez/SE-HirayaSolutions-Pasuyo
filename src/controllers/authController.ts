import * as authModel from '../models/authModel';

type AuthResult = {
  success: boolean;
  error?: string;
  role?: string;
};

export const login = async (email: string, password: string): Promise<AuthResult> => {
  if (!email || !password) return { success: false, error: 'Please fill in all fields' };

  const { data, error } = await authModel.signInWithPassword(email, password);
  if (error || !data.user) return { success: false, error: 'Invalid email or password' };

  const { data: profile } = await authModel.getUserRole(data.user.id);
  return { success: true, role: profile?.role };
};

export const signup = async (
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> => {
  if (!name || !email || !password) return { success: false, error: 'Please fill in all fields' };

  if (password.length < 6)
    return { success: false, error: 'Password must be at least 6 characters' };

  const { data, error } = await authModel.signUp(email, password, name);
  if (error || !data.user) return { success: false, error: 'Invalid email or password' };

  return { success: true };
};

export const googleAuth = async (): Promise<AuthResult> => {
  try {
    await authModel.signInWithGoogle();
    return { success: true };
  } catch {
    return { success: false, error: 'Google login failed' };
  }
};
