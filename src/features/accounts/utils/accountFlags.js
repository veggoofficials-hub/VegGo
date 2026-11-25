/**
 * Shared helpers for the account-state fields added to the admin
 * customer / vendor / delivery lists (Frontend Guide §6.2 and §6.4).
 */

export const ROLE_LABELS = Object.freeze({
  CUSTOMER: 'Customer',
  VENDOR: 'Vendor',
  DELIVERY: 'Delivery',
});

export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateOnly = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Reads the block / returning-user fields off a raw list row.
 * `isBlocked` on the server serialises as `blocked`, so both spellings
 * are accepted. `blockedAt` is only set while a block is in force.
 */
export const readAccountFlags = (item = {}) => {
  const blockedAt = item?.blockedAt || null;
  const blocked = Boolean(
    item?.blocked === true ||
    item?.isBlocked === true ||
    item?.accountState === 'BLOCKED' ||
    item?.accountState === 'Blocked' ||
    item?.accountState === 'SUSPENDED' ||
    blockedAt
  );

  const previousDeletionCount = Number(item?.previousDeletionCount) || 0;

  return {
    blocked,
    blockedReason: item?.blockedReason || null,
    blockedAt,
    payoutsOnHold: Boolean(item?.payoutsOnHold),
    previouslyDeleted: Boolean(item?.previouslyDeleted),
    previousDeletionCount,
    lastDeletedAt: item?.lastDeletedAt || null,
  };
};
