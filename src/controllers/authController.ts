import * as authModel from '../models/authModel';

export const passwordChecks = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters', error: 'Password must be at least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Has uppercase letter (A-Z)', error: 'Password must contain an uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Has lowercase letter (a-z)', error: 'Password must contain a lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Has a number (0-9)', error: 'Password must contain a number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Has special character (!@#$)', error: 'Password must contain a special character' },
];

const validatePassword = (password: string): string | null => {
  const failed = passwordChecks.find(c => !c.test(password));
  return failed ? failed.error : null;
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
