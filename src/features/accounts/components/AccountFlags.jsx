import { Link } from 'react-router-dom';
import { RotateCcw, ShieldAlert, ShieldCheck, UserX, Wallet } from 'lucide-react';
import { ROUTES } from '../../../constants/routes.constants';
import { formatDateOnly, formatDateTime } from '../utils/accountFlags';

/**
 * "Returning user" badge (Frontend Guide §6.4).
 * Shown when previouslyDeleted is true. Links to the Deleted accounts
 * screen filtered by the phone (and role, since a block / deletion is
 * per phone + role).
 */
export function ReturningUserBadge({ account, role, phone, className = '' }) {
  if (!account?.previouslyDeleted) return null;

  const count = account.previousDeletionCount || 1;
  const tooltip = `Deleted their account on ${formatDateOnly(account.lastDeletedAt)} (${count}×)`;
  const base =
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 ' +
    className;

  const content = (
    <>
      <RotateCcw size={10} />
      Returning user
    </>
  );

  const searchPhone = phone && phone !== '-' ? phone : '';
  if (!searchPhone) {
    return (
      <span className={base} title={tooltip}>
        {content}
      </span>
    );
  }

  const params = new URLSearchParams({ search: searchPhone });
  if (role) params.set('role', role);

  return (
    <Link
      to={`${ROUTES.DELETED_ACCOUNTS}?${params.toString()}`}
      title={`${tooltip} — view in Deleted accounts`}
      className={`${base} hover:bg-sky-100 transition-colors`}
      onClick={(event) => event.stopPropagation()}
    >
      {content}
    </Link>
  );
}

const blockedTooltip = (account) => {
  const parts = [];
  if (account?.blockedReason) parts.push(`Reason: ${account.blockedReason}`);
  if (account?.blockedAt) parts.push(`Since ${formatDateTime(account.blockedAt)}`);
  if (account?.payoutsOnHold) parts.push('Payouts on hold');
  return parts.join(' • ') || 'Account is blocked';
};

/** Red "Blocked" pill; tooltip carries reason / since / payouts hold. */
export function BlockedBadge({ account, className = '' }) {
  if (!account?.blocked) return null;

  return (
    <span
      title={blockedTooltip(account)}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
    >
      <ShieldAlert size={10} />
      Blocked
    </span>
  );
}

export function PayoutsHoldBadge({ account, className = '' }) {
  if (!account?.blocked || !account?.payoutsOnHold) return null;

  return (
    <span
      title="New payout requests are on hold for this block"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
    >
      <Wallet size={10} />
      Payouts on hold
    </span>
  );
}

/** One-line truncated current block reason (row detail). */
export function BlockedReasonLine({ account, className = '' }) {
  if (!account?.blocked || !account?.blockedReason) return null;

  return (
    <p
      className={`text-[11px] font-medium text-rose-700 truncate max-w-[220px] ${className}`}
      title={account.blockedReason}
    >
      Reason: {account.blockedReason}
    </p>
  );
}

/** Compact Block / Unblock button used in table rows and mobile cards. */
export function BlockToggleButton({
  blocked,
  onClick,
  disabled = false,
  fullWidth = false,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={blocked ? 'Unblock this account' : 'Block this account'}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        fullWidth ? 'w-full py-2.5' : ''
      } ${
        blocked
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
          : 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-600 hover:text-white hover:border-amber-600'
      } ${className}`}
    >
      {blocked ? <ShieldCheck size={13} /> : <UserX size={13} />}
      {blocked ? 'Unblock' : 'Block'}
    </button>
  );
}
