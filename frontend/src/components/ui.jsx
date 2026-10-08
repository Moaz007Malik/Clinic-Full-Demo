export function Button({ children, tone = 'solid', className = '', ...props }) {
  const tones = {
    solid: 'bg-moss text-white hover:brightness-110',
    ghost: 'border border-line bg-white text-ink hover:bg-sand',
    copper: 'bg-copper text-white hover:brightness-110',
    danger: 'bg-red-800 text-white'
  };
  return (
    <button className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${tones[tone]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-mute">{label}</span>
      {children}
    </label>
  );
}

export const control = 'w-full rounded-2xl border border-line bg-white px-3 py-2.5 outline-none ring-moss/30 focus:ring-4';

export function Badge({ children, tone = 'sand' }) {
  const tones = {
    sand: 'bg-sand text-ink',
    moss: 'bg-moss/12 text-moss',
    copper: 'bg-copper/12 text-copper',
    red: 'bg-red-100 text-red-800'
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tones[tone] || tones.sand}`}>{children}</span>;
}

export function statusTone(status) {
  if (['paid', 'approved', 'completed', 'active', 'present', 'normal'].includes(status)) return 'moss';
  if (['cancelled', 'rejected', 'no_show', 'suspended', 'severe', 'high', 'low', 'absent'].includes(status)) return 'red';
  if (['partial', 'pending', 'trial', 'trialing', 'queued', 'waiting', 'urgent'].includes(status)) return 'copper';
  return 'sand';
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-3xl bg-paper p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <button className="text-mute" onClick={onClose} type="button">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="rounded-3xl border border-dashed border-line px-6 py-12 text-center text-mute">{children}</div>;
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-line bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="font-display text-xl">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
