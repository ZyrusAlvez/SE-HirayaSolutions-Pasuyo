import * as authModel from '../models/authModel';

const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character';
  return null;
};

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
  const pwError = validatePassword(password);
  if (pwError) return { success: false, error: pwError };

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

export const getSession = () => authModel.getSession();

export const onAuthStateChange = (callback: Parameters<typeof authModel.onAuthStateChange>[0]) =>
  authModel.onAuthStateChange(callback);

export const getUserActiveAndRole = (userId: string) => authModel.getUserActiveAndRole(userId);

export const sendResetCode = async (email: string): Promise<AuthResult> => {
  try {
    const { data: exists, error: rpcError } = await authModel.checkEmailExists(email);
    if (rpcError || !exists) return { success: false, error: 'No account found with that email' };
    const { error } = await authModel.resetPasswordForEmail(email);
    if (error) return { success: false, error: 'Failed to send reset email' };
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Failed to send reset email' };
  }
};

export const verifyResetCode = async (email: string, token: string): Promise<AuthResult> => {
  try {
    const { error } = await authModel.verifyOtp(email, token);
    if (error) return { success: false, error: 'Invalid OTP' };
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Invalid OTP' };
  }
};

export const updatePassword = async (password: string, confirmPassword: string): Promise<AuthResult> => {
  if (!password || !confirmPassword) return { success: false, error: 'Please fill in all fields' };
  if (password !== confirmPassword) return { success: false, error: 'Passwords do not match' };
  const pwError = validatePassword(password);
  if (pwError) return { success: false, error: pwError };
  try {
    const { error } = await authModel.updatePassword(password);
    if (error) {
      await authModel.signOut();
      const msg = error.message.toLowerCase().includes('same') || (error as any).status === 422
        ? 'New password must be different from your current password'
        : 'Failed to update password';
      return { success: false, error: msg };
    }
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Failed to update password' };
  }
};
