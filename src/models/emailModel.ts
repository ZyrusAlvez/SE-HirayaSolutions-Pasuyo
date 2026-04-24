import { supabase } from '@/utils/supabase';

interface SendEmailParams {
  to: string;
  subject: string;
  template: 'errand-accepted' | 'errand-cancelled';
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
