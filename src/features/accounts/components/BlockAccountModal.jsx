import { useState } from 'react';
import { AlertCircle, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { BLOCK_REASON_MAX } from '../services/accountModerationService';
import { getApiErrorMessage, isStaleRowError } from '../../../utils/apiError';

/**
 * Block modal for Customer / Vendor / Delivery (Frontend Guide §6.2).
 *
 * Props
 *  - isOpen
 *  - account:   { name, phone? }   (display only)
 *  - roleLabel: "customer" | "vendor" | "delivery partner"
 *  - onClose()
 *  - onConfirm({ reason, holdPayouts }) -> Promise (throw to show an inline error)
 *  - onStale()  called when the server says the row is out of date
 *               (USER_NOT_FOUND / ACCOUNT_ALREADY_BLOCKED) so the list can reload
 */
function BlockForm({ account, roleLabel, onClose, onConfirm, onStale }) {
  const [reason, setReason] = useState('');
  const [holdPayouts, setHoldPayouts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setError('');
      await onConfirm({ reason: trimmed, holdPayouts });
    } catch (err) {
      setError(getApiErrorMessage(err, `Failed to block ${roleLabel}.`));
      if (isStaleRowError(err)) onStale?.();
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-account-title"
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
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div className="min-w-0">
            <h3 id="block-account-title" className="text-lg font-black text-slate-900 tracking-tight capitalize">
              Block {roleLabel}
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate" title={account?.name}>
              {account?.name || '-'}
              {account?.phone ? ` • ${account.phone}` : ''}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl p-3">
          The person will see this reason. They can still log in and finish work
          already in progress, but can&rsquo;t start new work.
        </p>

        <div className="mt-4">
          <label htmlFor="block-reason" className="block text-xs font-bold text-slate-800 mb-1.5">
            Reason <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="block-reason"
            rows={4}
            value={reason}
            maxLength={BLOCK_REASON_MAX}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            placeholder="e.g. Repeated fake COD orders"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none disabled:opacity-60"
          />
          <div className="mt-1 text-right text-[10px] font-bold text-slate-400">
            {reason.length}/{BLOCK_REASON_MAX}
          </div>
        </div>

        <label className="mt-2 flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            checked={holdPayouts}
            onChange={(e) => setHoldPayouts(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 h-4 w-4 accent-rose-600"
          />
          <span className="text-xs">
            <span className="block font-bold text-slate-800">Hold payouts</span>
            <span className="block text-slate-500 font-medium mt-0.5 leading-relaxed">
              They can&rsquo;t create new payout requests while blocked. Payouts
              already in progress continue; earnings still arrive. Most relevant
              for vendors and delivery partners.
            </span>
          </span>
        </label>

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
            disabled={!canSubmit}
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-600/15 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {submitting && <RefreshCw size={14} className="animate-spin" />}
            {submitting ? 'Blocking...' : 'Block account'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BlockAccountModal({ isOpen, ...rest }) {
  if (!isOpen) return null;
  // Mounting the form fresh each time resets reason / checkbox / error.
  return <BlockForm {...rest} />;
}
