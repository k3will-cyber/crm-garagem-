import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertCircle, AlertTriangle, Info, ShoppingCart, ThumbsUp, ThumbsDown } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_DURATION = 5000;
const MAX_TOASTS = 5;

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  new_part_request: ShoppingCart,
  part_request_updated: ThumbsUp,
  part_request_decided: ThumbsUp,
};

const colorMap = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning',
  info: 'toast-info',
  new_part_request: 'toast-info',
  part_request_updated: 'toast-success',
  part_request_decided: 'toast-info',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      title: options.title || '',
      duration: options.duration || TOAST_DURATION,
    };

    setToasts((prev) => {
      const updated = [...prev, toast];
      return updated.slice(-MAX_TOASTS);
    });

    if (toast.duration > 0) {
      timersRef.current[id] = setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, [removeToast]);

  const clearToasts = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    setToasts([]);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearToasts }}>
      {children}

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type] || Bell;
          return (
            <div key={toast.id} className={`toast ${colorMap[toast.type] || 'toast-info'}`}>
              <div className="toast-icon">
                <Icon size={20} />
              </div>
              <div className="toast-content">
                {toast.title && <div className="toast-title">{toast.title}</div>}
                <div className="toast-message">{toast.message}</div>
              </div>
              <button className="toast-close" onClick={() => removeToast(toast.id)}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
