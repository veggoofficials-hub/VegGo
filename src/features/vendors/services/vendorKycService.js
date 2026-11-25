import apiClient from "../../../api/axiosInstance";
import { VENDOR_ENDPOINTS } from "../../../constants/endpoints.constants";
import {
  buildBlockBody,
  buildUnblockBody,
} from "../../accounts/services/accountModerationService";

export const getVendors = async (params = {}) => {
  const response = await apiClient.get(
    VENDOR_ENDPOINTS.BASE,
    {
      params,
    }
  );

  return response.data;
};

export const exportVendorsPdf = async (params = {}) => {
  const response = await apiClient.get(
    VENDOR_ENDPOINTS.EXPORT_PDF,
    {
      params,
      responseType: "blob",
    }
  );

  return response.data;
};

export const getPendingVendorKyc = async (page = 0, size = 20) => {
  const response = await apiClient.get(
    VENDOR_ENDPOINTS.KYC_PENDING,
    {
      params: {
        page,
        size,
      },
    }
  );

  return response.data;
};

export const getVendorKycDetail = async (vendorShopId) => {
  const response = await apiClient.get(
    VENDOR_ENDPOINTS.KYC_DETAIL(vendorShopId)
  );

  return response.data;
};

export const approveVendorKyc = async (vendorShopId) => {
  const response = await apiClient.put(
    VENDOR_ENDPOINTS.KYC_APPROVE(vendorShopId)
  );

  return response.data;
};

export const rejectVendorKyc = async (
  vendorShopId,
  reason = "Document unclear"
) => {
  const response = await apiClient.put(
    VENDOR_ENDPOINTS.KYC_REJECT(vendorShopId),
    null,
    {
      params: {
        reason,
      },
    }
  );

  return response.data;
};

// Block / unblock use the vendor's USER id (ownerUserId), not the shop id.
export const blockVendor = async (vendorUserId, { reason, holdPayouts = false } = {}) => {
  const response = await apiClient.put(
    VENDOR_ENDPOINTS.BLOCK(vendorUserId),
    buildBlockBody({ reason, holdPayouts })
  );

  return response.data;
};

export const unblockVendor = async (vendorUserId, { note } = {}) => {
  const response = await apiClient.put(
    VENDOR_ENDPOINTS.UNBLOCK(vendorUserId),
    buildUnblockBody({ note })
  );

  return response.data;
};
