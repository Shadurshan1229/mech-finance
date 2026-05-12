import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  getMonthRange,
  getMonthLabel,
  computeAccountBalance,
  computeCCOutstanding,
  computeGoalCurrent,
  computeGoalProgress,
  computeBudgetRemaining,
  normalizeToMonthly,
  computeNetWorth,
} from '../utils'

describe('formatCurrency', () => {
  it('formats whole numbers with 2 decimal places', () => {
    expect(formatCurrency(12500)).toBe('LKR 12,500.00')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('LKR 0.00')
  })

  it('formats amounts with decimals', () => {
    expect(formatCurrency(1234.5)).toBe('LKR 1,234.50')
  })

  it('formats large amounts with commas', () => {
    expect(formatCurrency(1000000)).toBe('LKR 1,000,000.00')
  })
})

describe('getMonthRange', () => {
  it('returns first and last day of May 2026', () => {
    const result = getMonthRange(new Date('2026-05-15'))
    expect(result.start).toBe('2026-05-01')
    expect(result.end).toBe('2026-05-31')
  })

  it('handles February in a leap year', () => {
    const result = getMonthRange(new Date('2024-02-10'))
    expect(result.start).toBe('2024-02-01')
    expect(result.end).toBe('2024-02-29')
  })

  it('handles February in a non-leap year', () => {
    const result = getMonthRange(new Date('2025-02-10'))
    expect(result.start).toBe('2025-02-01')
    expect(result.end).toBe('2025-02-28')
  })
})

describe('getMonthLabel', () => {
  it('returns full month name and year', () => {
    expect(getMonthLabel(new Date('2026-05-10'))).toBe('May 2026')
  })

  it('returns correct label for January', () => {
    expect(getMonthLabel(new Date('2026-01-01'))).toBe('January 2026')
  })
})

describe('computeAccountBalance', () => {
  it('computes balance correctly with all values', () => {
    expect(
      computeAccountBalance({
        initialAmount: 50000,
        income:        10000,
        expense:        5000,
        transferIn:     2000,
        transferOut:    1000,
      })
    ).toBe(56000)
  })

  it('returns initial amount when no transactions', () => {
    expect(
      computeAccountBalance({
        initialAmount: 10000,
        income:        0,
        expense:       0,
        transferIn:    0,
        transferOut:   0,
      })
    ).toBe(10000)
  })

  it('can produce negative balance', () => {
    expect(
      computeAccountBalance({
        initialAmount: 1000,
        income:        0,
        expense:       2000,
        transferIn:    0,
        transferOut:   0,
      })
    ).toBe(-1000)
  })
})

describe('computeCCOutstanding', () => {
  it('subtracts payments from expenses', () => {
    expect(
      computeCCOutstanding({ totalExpenses: 15000, totalPayments: 5000 })
    ).toBe(10000)
  })

  it('returns zero when fully paid', () => {
    expect(
      computeCCOutstanding({ totalExpenses: 5000, totalPayments: 5000 })
    ).toBe(0)
  })
})

describe('computeGoalCurrent', () => {
  it('adds transfers to initial amount', () => {
    expect(
      computeGoalCurrent({ initialAmount: 5000, totalTransfers: 3000 })
    ).toBe(8000)
  })
})

describe('computeGoalProgress', () => {
  it('calculates percentage correctly', () => {
    expect(computeGoalProgress(50, 100)).toBe(50)
  })

  it('caps at 100%', () => {
    expect(computeGoalProgress(150, 100)).toBe(100)
  })

  it('returns 0 for zero target', () => {
    expect(computeGoalProgress(50, 0)).toBe(0)
  })

  it('returns 0 for negative target', () => {
    expect(computeGoalProgress(50, -1)).toBe(0)
  })
})

describe('computeBudgetRemaining', () => {
  it('subtracts spent from budget', () => {
    expect(computeBudgetRemaining(10000, 6000)).toBe(4000)
  })

  it('returns negative when over budget', () => {
    expect(computeBudgetRemaining(5000, 7000)).toBe(-2000)
  })
})

describe('normalizeToMonthly', () => {
  it('returns same amount for monthly', () => {
    expect(normalizeToMonthly(1200, 'monthly')).toBe(1200)
  })

  it('divides by 3 for quarterly', () => {
    expect(normalizeToMonthly(300, 'quarterly')).toBe(100)
  })

  it('divides by 12 for yearly', () => {
    expect(normalizeToMonthly(1200, 'yearly')).toBe(100)
  })
})

describe('computeNetWorth', () => {
  it('subtracts liabilities from assets', () => {
    expect(computeNetWorth([100000, 50000], [30000, 20000])).toBe(100000)
  })

  it('returns negative for more liabilities than assets', () => {
    expect(computeNetWorth([10000], [50000])).toBe(-40000)
  })

  it('handles empty arrays', () => {
    expect(computeNetWorth([], [])).toBe(0)
  })
})
