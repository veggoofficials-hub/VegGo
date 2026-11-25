import apiClient from '../../../api/axiosInstance';
import { ACCOUNT_ENDPOINTS } from '../../../constants/endpoints.constants';

export const BLOCK_REASON_MAX = 500;
export const UNBLOCK_NOTE_MAX = 500;

/**
 * Block body (Frontend Guide §6.2).
 * `reason` is REQUIRED (non-blank, max 500) and is shown to the person.
 * `holdPayouts` defaults to false.
 */
export const buildBlockBody = ({ reason, holdPayouts = false } = {}) => {
  const cleanReason = String(reason ?? '').trim();

  if (!cleanReason) {
    const error = new Error('A reason is required to block an account.');
    error.response = {
      data: { errorCode: 'BLOCK_REASON_REQUIRED', message: 'A reason is required to block an account.' },
    };
    throw error;
  }

  return {
    reason: cleanReason.slice(0, BLOCK_REASON_MAX),
    holdPayouts: Boolean(holdPayouts),
  };
};

/**
 * Unblock body is optional. `note` (max 500) is shown to the person in
 * their "account unblocked" notification.
 */
export const buildUnblockBody = ({ note } = {}) => {
  const cleanNote = String(note ?? '').trim();
  return cleanNote ? { note: cleanNote.slice(0, UNBLOCK_NOTE_MAX) } : {};
};

/**
 * Block history: GET /api/admin/blocks
 * params: role (CUSTOMER|VENDOR|DELIVERY), action (BLOCK|UNBLOCK),
 *         search (phone / name / reason), currentOnly, page, size
 */
export const getBlockHistory = async (params = {}) => {
  const response = await apiClient.get(ACCOUNT_ENDPOINTS.BLOCK_HISTORY, {
    params: { page: 0, size: 20, ...params },
  });
  return response.data;
};

/**
 * Deleted-accounts archive (read-only): GET /api/admin/deleted-accounts
 * params: role, status (IN_WINDOW|REACTIVATED|PURGED|RETURNED_AS_NEW),
 *         search (phone / name / e-mail), page, size
 */
export const getDeletedAccounts = async (params = {}) => {
  const response = await apiClient.get(ACCOUNT_ENDPOINTS.DELETED_ACCOUNTS, {
    params: { page: 0, size: 20, ...params },
  });
  return response.data;
};

// `archiveId` is the archive row id, NOT the user id.
export const getDeletedAccountById = async (archiveId) => {
  const response = await apiClient.get(
    ACCOUNT_ENDPOINTS.DELETED_ACCOUNT_BY_ID(archiveId)
  );
  return response.data;
};
