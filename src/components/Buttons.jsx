const variants = {
  primary: 'border-brand bg-brand text-white hover:border-brand-hover hover:bg-brand-hover shadow-[0_4px_12px_-6px_#3478f6]',
  secondary: 'border-line bg-white text-brand hover:border-brand/40 hover:bg-selected/40',
  quiet: 'border-transparent bg-transparent text-muted hover:bg-selected hover:text-brand',
};

export function Button({ variant = 'primary', icon: Icon, children, className = '', ...props }) {
  return (
    <button type="button" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border px-5 py-2.5 text-sm font-medium transition disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon size={18} strokeWidth={1.8} aria-hidden="true" />}
      {children}
    </button>
  );
}


export function IconButton({ label, icon: Icon, className = '', ...props }) {
  return (
    <button type="button" aria-label={label} title={label} className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-brand transition hover:border-brand/40 hover:bg-selected focus-visible:bg-selected ${className}`} {...props}>
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}
