import { describe, expect, it } from 'vitest'
import { computeWalletSplit, validateBookDraft } from './posLogic'

describe('computeWalletSplit', () => {
  it('uses wallet credit up to due amount', () => {
    expect(computeWalletSplit(50, 120)).toEqual({ walletUsed: 50, cashDue: 70 })
  })

  it('does not use negative balance as credit', () => {
    expect(computeWalletSplit(-20, 100)).toEqual({ walletUsed: 0, cashDue: 100 })
  })

  it('handles zero/invalid values safely', () => {
    expect(computeWalletSplit(undefined, undefined)).toEqual({ walletUsed: 0, cashDue: 0 })
  })
})

describe('validateBookDraft', () => {
  it('allows missing fields for arriving books', () => {
    const err = validateBookDraft({
      title: 'كتاب قادم',
      barcode: '',
      sellingPrice: '',
      costPrice: '',
      stock: '',
      isArriving: true,
    })
    expect(err).toBeNull()
  })

  it('requires barcode and sellingPrice for non-arriving books', () => {
    const err = validateBookDraft({
      title: 'كتاب',
      barcode: '',
      sellingPrice: 0,
      costPrice: 0,
      stock: 0,
      isArriving: false,
    })
    expect(err).toBeTruthy()
  })
})

