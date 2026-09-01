import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
            info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
          };

          const borderColors = {
            success: 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
            error: 'border-rose-200 bg-rose-50/90 text-rose-900',
            warning: 'border-amber-200 bg-amber-50/90 text-amber-900',
            info: 'border-blue-200 bg-blue-50/90 text-blue-900',
          };

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg backdrop-blur-md flex items-start gap-3 ${borderColors[toast.type]}`}
            >
              {icons[toast.type]}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold">{toast.title}</h4>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>
                {toast.action && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        toast.action?.onClick();
                        dismissToast(toast.id);
                      }}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white/90 dark:bg-slate-900/90 text-indigo-700 dark:text-indigo-300 shadow-2xs hover:bg-white transition cursor-pointer border border-indigo-200/60"
                    >
                      {toast.action.label}
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
