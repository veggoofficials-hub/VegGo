/**
 * Helpers for reading VegGo API error responses.
 * Envelope: { success:false, message, errorCode?, timestamp }
 * The server writes `message` for end users, so show it as-is.
 */

const FALLBACK_MESSAGES = Object.freeze({
  BLOCK_REASON_REQUIRED: 'A reason is required (maximum 500 characters).',
  USER_ROLE_MISMATCH: 'This account belongs to a different role. Please refresh the list and try again.',
  USER_NOT_FOUND: 'This account no longer exists. The list has been refreshed.',
  ACCOUNT_ALREADY_BLOCKED: 'This account is already blocked. The list has been refreshed.',
  ACCOUNT_NOT_BLOCKED: 'This account is not blocked. The list has been refreshed.',
  INVALID_ROLE_FILTER: 'Invalid role filter.',
  INVALID_STATUS_FILTER: 'Invalid status filter.',
  INVALID_ACTION_FILTER: 'Invalid action filter.',
  DELETED_ACCOUNT_NOT_FOUND: 'This deleted-account record could not be found.',
});

// Errors that mean the row on screen is out of date and should be reloaded.
const STALE_ROW_CODES = Object.freeze([
  'USER_NOT_FOUND',
  'ACCOUNT_ALREADY_BLOCKED',
  'ACCOUNT_NOT_BLOCKED',
]);

export const getApiErrorCode = (error) =>
  error?.response?.data?.errorCode || null;

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;
  const code = data?.errorCode;

  return (
    data?.message ||
    (code && FALLBACK_MESSAGES[code]) ||
    data?.error ||
    error?.message ||
    fallback
  );
};

export const isStaleRowError = (error) =>
  STALE_ROW_CODES.includes(getApiErrorCode(error));
