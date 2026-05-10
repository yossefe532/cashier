import { fetchReceiptArchive } from '../catalog/coreDataService'

export const refreshReceiptArchiveItems = async (apiRequest) => {
  const data = await fetchReceiptArchive(apiRequest)
  return Array.isArray(data) ? data : []
}

export const archiveReceiptPayload = async ({ apiRequest, payload }) => {
  return apiRequest('/receipt-archive', {
    method: 'POST',
    body: JSON.stringify({
      transaction_code: payload.id,
      receipt_type: payload.receiptType || 'sale',
      staff_name: payload.staffName,
      payload,
    }),
  })
}
