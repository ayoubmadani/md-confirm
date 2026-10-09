import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  outline: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

export function Button({ variant = 'primary', loading, disabled, className = '', children, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ title, icon: Icon, action, className = '', children }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
            {Icon && <Icon size={16} className="text-indigo-600" />}{title}
          </h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50';

// className الإضافي يُدمج مع التصميم الأساسي بدل أن يستبدله
export const Input = ({ className = '', ...props }) => <input className={`${inputCls} ${className}`} {...props} />;
export const Textarea = ({ className = '', ...props }) => <textarea className={`${inputCls} ${className}`} rows={3} {...props} />;
export const Select = ({ className = '', children, ...props }) => <select className={`${inputCls} ${className}`} {...props}>{children}</select>;

export function Spinner({ label = 'جاري التحميل...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
      <Loader2 size={28} className="animate-spin text-indigo-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Badge({ className = '', children }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${className}`}>{children}</span>;
}
