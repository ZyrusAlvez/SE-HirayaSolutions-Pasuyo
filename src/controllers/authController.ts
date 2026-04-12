import * as authModel from '../models/authModel';

type AuthResult = {
  success: boolean;
  error: string;
  role?: string;
};

export const login = async (email: string, password: string): Promise<AuthResult> => {
  if (!email || !password) return { success: false, error: 'Please fill in all fields' };

  try {
    const { data, error } = await authModel.signInWithPassword(email, password);
    if (error || !data.user) return { success: false, error: 'Invalid email or password' };

    const { data: profile } = await authModel.getUserRole(data.user.id);
    return { success: true, error: '', role: profile?.role };
  } catch {
    return { success: false, error: 'Login failed' };
  }
};

export const signup = async (
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> => {
  if (!name || !email || !password) return { success: false, error: 'Please fill in all fields' };
  if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };

  try {
    const { data, error } = await authModel.signUp(email, password, name);
    if (error || !data.user) return { success: false, error: 'Signup failed' };
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Signup failed' };
  }
};

export const loginWithGoogle = async (): Promise<AuthResult> => {
  try {
    await authModel.signInWithGoogle();
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Google login failed' };
  }
};

export const logout = async (): Promise<AuthResult> => {
  try {
    const { error } = await authModel.signOut();
    if (error) return { success: false, error: 'Logout failed' };
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Logout failed' };
  }
};
