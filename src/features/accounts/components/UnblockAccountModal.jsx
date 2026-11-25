import { useState } from 'react';
import { AlertCircle, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { UNBLOCK_NOTE_MAX } from '../services/accountModerationService';
import { getApiErrorMessage, isStaleRowError } from '../../../utils/apiError';

/**
 * Unblock modal (Frontend Guide §6.2). The note is optional and is shown
 * to the person in their "account unblocked" notification.
 *
 * Props
 *  - isOpen
 *  - account:   { name, phone?, blockedReason? }
 *  - roleLabel: "customer" | "vendor" | "delivery partner"
 *  - onClose()
 *  - onConfirm({ note }) -> Promise (throw to show an inline error)
 *  - onStale()
 */
function UnblockForm({ account, roleLabel, onClose, onConfirm, onStale }) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const needsManualOnline = roleLabel !== 'customer';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      setError('');
      await onConfirm({ note: note.trim() });
    } catch (err) {
      setError(getApiErrorMessage(err, `Failed to unblock ${roleLabel}.`));
      if (isStaleRowError(err)) onStale?.();
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unblock-account-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-100 relative"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer disabled:opacity-40"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="min-w-0">
            <h3 id="unblock-account-title" className="text-lg font-black text-slate-900 tracking-tight capitalize">
              Unblock {roleLabel}
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate" title={account?.name}>
              {account?.name || '-'}
              {account?.phone ? ` • ${account.phone}` : ''}
            </p>
          </div>
        </div>

        {account?.blockedReason && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-rose-500">
              Current block reason
            </span>
            <span className="block mt-0.5 font-semibold text-rose-900 break-words">
              {account.blockedReason}
            </span>
          </div>
        )}

        <p className="mt-4 text-xs leading-relaxed text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl p-3">
          {needsManualOnline
            ? 'Access is restored, but they are NOT put back online automatically. They must go online themselves.'
            : 'Access is restored. The customer can place orders again immediately.'}
        </p>

        <div className="mt-4">
          <label htmlFor="unblock-note" className="block text-xs font-bold text-slate-800 mb-1.5">
            Note <span className="text-slate-400 font-semibold">(optional)</span>
          </label>
          <textarea
            id="unblock-note"
            rows={3}
            value={note}
            maxLength={UNBLOCK_NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            placeholder="e.g. Resolved after complaint #42"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none disabled:opacity-60"
          />
          <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span>Shown to the person in their notification.</span>
            <span>{note.length}/{UNBLOCK_NOTE_MAX}</span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2"
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm rounded-2xl border border-slate-100 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/15 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {submitting && <RefreshCw size={14} className="animate-spin" />}
            {submitting ? 'Unblocking...' : 'Unblock account'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function UnblockAccountModal({ isOpen, ...rest }) {
  if (!isOpen) return null;
  return <UnblockForm {...rest} />;
}
