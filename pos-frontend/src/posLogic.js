export function computeWalletSplit(balance, amount) {
  const credit = Math.max(Number(balance) || 0, 0)
  const due = Math.max(Number(amount) || 0, 0)
  const walletUsed = Math.min(credit, due)
  return { walletUsed, cashDue: due - walletUsed }
}

export function validateBookDraft({ title, barcode, sellingPrice, costPrice, stock, isArriving }) {
  if (!title) return 'اسم الكتاب مطلوب'
  if (Number(sellingPrice) < 0 || Number(costPrice) < 0 || Number(stock) < 0) return 'لا يمكن إدخال قيم سالبة للسعر أو المخزون'
  if (!isArriving) {
    if (!barcode) return 'الباركود مطلوب (إلا لو الكتاب "قيد الوصول")'
    if (!sellingPrice || Number(sellingPrice) <= 0) return 'سعر البيع مطلوب ويجب أن يكون أكبر من 0'
  }
  return null
}

