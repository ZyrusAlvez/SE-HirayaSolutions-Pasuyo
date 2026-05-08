import { supabase } from '@/utils/supabase';

interface SendEmailParams {
  to: string;
  subject: string;
  template: 'errand-accepted' | 'errand-cancelled' | 'errand-marked-done' | 'account-restored' | 'account-suspended' | 'errand-deleted' | 'verification-approved' | 'verification-rejected' | 'payment-approved' | 'payment-rejected';
  data: Record<string, string>;
}

export const sendEmail = async ({ to, subject, template, data }: SendEmailParams) => {
  const { error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, template, data },
  });
  if (error) console.warn('Email send failed:', error.message);
  return { error };
};

export const sendErrandAcceptedEmail = async (posterId: string, errandInfo: { title: string; description: string; budget?: number }, acceptorId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        userId: posterId,
        template: 'errand-accepted',
        subject: 'Your errand has been accepted!',
        data: {
          errand_title: errandInfo.title,
          errand_description: errandInfo.description,
          errand_budget: errandInfo.budget != null ? `\u20b1${errandInfo.budget.toLocaleString()}` : '',
          chat_url: `https://pasuyo.xyz/chat?userId=${acceptorId}`,
        },
      },
    });
    if (error) console.warn('Errand accepted email failed:', error.message);
    else console.log('Email sent:', data);
  } catch (e: any) {
    console.warn('Email invoke error:', e.message);
  }
};

export const sendErrandCancelledEmail = async (
  posterId: string,
  errandInfo: { title: string; description?: string; budget?: number },
  cancellerName: string,
  reason: string,
  errandId: string,
) => {
  try {
    const body = {
      userId: posterId,
      template: 'errand-cancelled',
      subject: 'Your errand has been cancelled',
      data: {
        errand_title: errandInfo.title,
        errand_description: errandInfo.description ?? '',
        errand_budget: errandInfo.budget != null ? `\u20b1${errandInfo.budget.toLocaleString()}` : '',
        canceller_name: cancellerName,
        cancel_reason: reason,
        errand_url: `https://pasuyo.xyz/errand/${errandId}`,
      },
    };
    console.log('sendErrandCancelledEmail body:', JSON.stringify(body));
    const { data, error } = await supabase.functions.invoke('send-email', { body });
    if (error) console.warn('Errand cancelled email failed:', error.message, error);
    else console.log('Errand cancelled email sent:', data);
  } catch (e: any) {
    console.warn('Email invoke error:', e.message);
  }
};

export const sendAccountSuspendedEmail = async (userId: string, reason: string) => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        userId,
        template: 'account-suspended',
        subject: 'Your account has been suspended',
        data: { suspend_reason: reason },
      },
    });
    if (error) console.warn('Account suspended email failed:', error.message);
  } catch (e: any) {
    console.warn('Email invoke error:', e.message);
  }
};

export const sendAccountRestoredEmail = async (userId: string) => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        userId,
        template: 'account-restored',
        subject: 'Your account has been restored',
        data: {},
      },
    });
    if (error) console.warn('Account restored email failed:', error.message);
  } catch (e: any) {
    console.warn('Email invoke error:', e.message);
  }
};

export const sendErrandDeletedEmail = async (
  userId: string,
  errandInfo: { title: string; description?: string; budget?: number },
  reason: string,
) => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        userId,
        template: 'errand-deleted',
        subject: 'Your errand has been removed by an admin',
        data: {
          errand_title: errandInfo.title,
          errand_description: errandInfo.description ?? '',
          errand_budget: errandInfo.budget != null ? `\u20b1${errandInfo.budget.toLocaleString()}` : '',
          delete_reason: reason,
        },
      },
    });
    if (error) console.warn('Errand deleted email failed:', error.message);
  } catch (e: any) {
    console.warn('Email invoke error:', e.message);
  }
};

export const sendVerificationEmail = async (userId: string, approved: boolean, reason?: string) => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        userId,
        template: approved ? 'verification-approved' : 'verification-rejected',
        subject: approved ? 'Your verification has been approved' : 'Your verification has been rejected',
        data: { reject_reason: reason ?? '' },
      },
    });
    if (error) console.warn('Verification email failed:', error.message);
  } catch (e: any) {
    console.warn('Email invoke error:', e.message);
  }
};

export const sendPaymentStatusEmail = async (userId: string, approved: boolean, amount: number, reason?: string) => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        userId,
        template: approved ? 'payment-approved' : 'payment-rejected',
        subject: approved ? 'Your payment has been approved' : 'Your payment has been rejected',
        data: {
          payment_amount: `\u20b1${amount.toLocaleString()}`,
          reject_reason: reason ?? '',
        },
      },
    });
    if (error) console.warn('Payment status email failed:', error.message);
  } catch (e: any) {
    console.warn('Email invoke error:', e.message);
  }
};

export const sendErrandMarkedDoneEmail = async (
  posterId: string,
  errandInfo: { title: string; description?: string; budget?: number },
  runnerName: string,
  runnerId: string,
) => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        userId: posterId,
        template: 'errand-marked-done',
        subject: 'Your errand has been marked as done',
        data: {
          errand_title: errandInfo.title,
          errand_description: errandInfo.description ?? '',
          errand_budget: errandInfo.budget != null ? `\u20b1${errandInfo.budget.toLocaleString()}` : '',
          runner_name: runnerName,
          chat_url: `https://pasuyo.xyz/chat?userId=${runnerId}`,
        },
      },
    });
    if (error) console.warn('Errand marked done email failed:', error.message);
  } catch (e: any) {
    console.warn('Email invoke error:', e.message);
  }
};
