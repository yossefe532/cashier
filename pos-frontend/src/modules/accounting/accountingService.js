import { fetchAccountingData } from '../catalog/coreDataService'

export const refreshAccountingSnapshot = async (apiRequest) => {
  const { finance, supplies } = await fetchAccountingData(apiRequest)
  return {
    finance: finance || null,
    supplies: Array.isArray(supplies) ? supplies : [],
  }
}

export const createSupplyRecord = async ({
  apiRequest,
  bookId,
  quantity,
  unitCost,
  paidAmount,
  supplierName,
  staffName,
}) => {
  return apiRequest('/supplies', {
    method: 'POST',
    body: JSON.stringify({
      book_id: bookId,
      quantity,
      unit_cost: unitCost,
      paid_amount: paidAmount,
      supplier_name: supplierName || null,
      staff_name: staffName,
    }),
  })
}
