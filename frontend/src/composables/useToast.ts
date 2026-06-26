import { reactive } from 'vue';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  show: boolean;
  type: ToastType;
  message: string;
}

const toast = reactive<ToastState>({
  show: false,
  type: 'success',
  message: '',
});

export function useToast() {
  function showToast(type: ToastType, message: string) {
    toast.type = type;
    toast.message = message;
    toast.show = true;
    setTimeout(() => {
      toast.show = false;
    }, 3000);
  }

  function success(message: string) {
    showToast('success', message);
  }

  function error(message: string) {
    showToast('error', message);
  }

  function info(message: string) {
    showToast('info', message);
  }

  function warning(message: string) {
    showToast('warning', message);
  }

  return {
    toast,
    showToast,
    success,
    error,
    info,
    warning,
  };
}
