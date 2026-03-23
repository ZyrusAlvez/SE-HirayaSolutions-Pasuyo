import { Platform } from 'react-native';

type Preset = 'done' | 'error' | 'none';

interface ToastOptions {
  title: string;
  preset?: Preset;
}

export function toast({ title, preset = 'none' }: ToastOptions) {
  if (Platform.OS === 'web') {
    const { toast: sonnerToast } = require('sonner');
    if (preset === 'error') sonnerToast.error(title);
    else if (preset === 'done') sonnerToast.success(title);
    else sonnerToast(title);
  } else {
    const { toast: burntToast } = require('burnt');
    burntToast({ title, preset });
  }
}
