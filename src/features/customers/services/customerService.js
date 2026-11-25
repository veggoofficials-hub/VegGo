import apiClient from '../../../api/axiosInstance';
import { CUSTOMER_ENDPOINTS } from '../../../constants/endpoints.constants';
import {
  buildBlockBody,
  buildUnblockBody,
} from '../../accounts/services/accountModerationService';

export const getCustomerStats = async () => {
  const response = await apiClient.get(
    CUSTOMER_ENDPOINTS.STATS
  );

  return response.data;
};

export const getCustomers = async (params = {}) => {
  try {
    const response = await apiClient.get(
      CUSTOMER_ENDPOINTS.BASE,
      {
        params,
      }
    );

    return response.data;
  } catch (err) {
    if (CUSTOMER_ENDPOINTS.LEGACY_BASE && err?.response?.status === 404) {
      const fallback = await apiClient.get(
        CUSTOMER_ENDPOINTS.LEGACY_BASE,
        {
          params,
        }
      );
      return fallback.data;
    }
    throw err;
  }
};

export const searchCustomers = async (search, params = {}) => {
  return getCustomers({ search, ...params });
};

export const exportCustomersPdf = async (params = {}) => {
  const response = await apiClient.get(
    CUSTOMER_ENDPOINTS.EXPORT_PDF,
    {
      params,
      responseType: 'blob',
    }
  );

  return response.data;
};

export const getCustomerDetails = async (customerUserId) => {
  const response = await apiClient.get(
    CUSTOMER_ENDPOINTS.DETAILS(customerUserId)
  );

  return response.data;
};

// NOTE: admin delete was REMOVED (Frontend Guide §6.1). Accounts are only
// deleted by their owners, so there is intentionally no deleteCustomer here.

// Block requires a JSON body: { reason (required, max 500), holdPayouts? }
export const blockCustomer = async (customerUserId, { reason, holdPayouts = false } = {}) => {
  const response = await apiClient.put(
    CUSTOMER_ENDPOINTS.BLOCK(customerUserId),
    buildBlockBody({ reason, holdPayouts })
  );

  return response.data;
};

// Unblock body is optional: { note? } (shown to the customer)
export const unblockCustomer = async (customerUserId, { note } = {}) => {
  const response = await apiClient.put(
    CUSTOMER_ENDPOINTS.UNBLOCK(customerUserId),
    buildUnblockBody({ note })
  );

  return response.data;
};

export const getModerationStats = async () => {
  const response = await apiClient.get(
    CUSTOMER_ENDPOINTS.MODERATION_STATS
  );

  return response.data;
};

export const getModerationCustomers = async (params = {}) => {
  const response = await apiClient.get(
    CUSTOMER_ENDPOINTS.MODERATION_LIST,
    {
      params,
    }
  );

  return response.data;
};

export const searchModerationCustomers = async (search, params = {}) => {
  const response = await apiClient.get(
    CUSTOMER_ENDPOINTS.MODERATION_LIST,
    {
      params: {
        search,
        ...params,
      },
    }
  );

  return response.data;
};