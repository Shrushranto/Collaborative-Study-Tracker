let listeners = [];
let toastId = 0;

export const toast = {
  success: (msg) => emit('success', msg),
  error: (msg) => emit('error', msg),
  info: (msg) => emit('info', msg),
  
  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }
};

function emit(type, message) {
  const id = ++toastId;
  const newToast = { id, type, message };
  listeners.forEach((l) => l(newToast));
}
