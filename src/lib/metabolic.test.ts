import { describe, it, expect } from 'vitest'
import { 
  calculateMetabolicData, 
  calculateRecoveryHr,
  getMetabolicCategoryLabel,
  getMetabolicCategoryShortLabel 
} from './metabolic'

describe('calculateMetabolicData', () => {
  describe('AT/Max percentage calculation', () => {
    it('calculates AT percentage correctly', () => {
      const result = calculateMetabolicData({
        atHr: 150,
        maxHr: 180,
        recoveryHr2min: null,
      })
      
      expect(result.atMaxPercent).toBeCloseTo(83.33, 2)
    })

    it('returns null when AT HR is missing', () => {
      const result = calculateMetabolicData({
        atHr: null,
        maxHr: 180,
        recoveryHr2min: null,
      })
      
      expect(result.atMaxPercent).toBeNull()
    })

    it('returns null when Max HR is missing', () => {
      const result = calculateMetabolicData({
        atHr: 150,
        maxHr: null,
        recoveryHr2min: null,
      })
      
      expect(result.atMaxPercent).toBeNull()
    })
  })

  describe('Recovery/AT percentage calculation', () => {
    it('calculates recovery percentage correctly', () => {
      const result = calculateMetabolicData({
        atHr: 150,
        maxHr: 180,
        recoveryHr2min: 135,
      })
      
      expect(result.recoveryAtPercent).toBe(90)
    })

    it('returns null when recovery HR is missing', () => {
      const result = calculateMetabolicData({
        atHr: 150,
        maxHr: 180,
        recoveryHr2min: null,
      })
      
      expect(result.recoveryAtPercent).toBeNull()
    })

    it('returns null when AT HR is missing', () => {
      const result = calculateMetabolicData({
        atHr: null,
        maxHr: 180,
        recoveryHr2min: 135,
      })
      
      expect(result.recoveryAtPercent).toBeNull()
    })
  })

  describe('Metabolic category determination', () => {
    it('categorizes High Lactic Acid (< 88%)', () => {
      const result = calculateMetabolicData({
        atHr: 150,
        maxHr: 180, // 150/180 = 83.33%
        recoveryHr2min: null,
      })
      
      expect(result.metabolicCategory).toBe('la')
    })

    it('categorizes Standard (88-93%)', () => {
      const result = calculateMetabolicData({
        atHr: 162,
        maxHr: 180, // 162/180 = 90%
        recoveryHr2min: null,
      })
      
      expect(result.metabolicCategory).toBe('standard')
    })

    it('categorizes Low Metabolic (>= 94%)', () => {
      const result = calculateMetabolicData({
        atHr: 170,
        maxHr: 180, // 170/180 = 94.44%
        recoveryHr2min: null,
      })
      
      expect(result.metabolicCategory).toBe('low')
    })

    it('returns null category when data is incomplete', () => {
      const result = calculateMetabolicData({
        atHr: null,
        maxHr: 180,
        recoveryHr2min: null,
      })
      
      expect(result.metabolicCategory).toBeNull()
    })

    it('handles boundary case at 88%', () => {
      const result = calculateMetabolicData({
        atHr: 158.4,
        maxHr: 180, // 158.4/180 = 88%
        recoveryHr2min: null,
      })
      
      expect(result.metabolicCategory).toBe('standard')
    })

    it('handles boundary case at 94%', () => {
      const result = calculateMetabolicData({
        atHr: 169.2,
        maxHr: 180, // 169.2/180 = 94%
        recoveryHr2min: null,
      })
      
      expect(result.metabolicCategory).toBe('low')
    })
  })
})

describe('calculateRecoveryHr', () => {
  it('calculates recovery HR for poor recovery (< 85%)', () => {
    const recoveryHr = calculateRecoveryHr(180, 80, false)
    expect(recoveryHr).toBe(148) // ceil(180 * 0.82) = 148
  })

  it('calculates recovery HR for moderate recovery (85-92%)', () => {
    const recoveryHr = calculateRecoveryHr(180, 88, false)
    expect(recoveryHr).toBe(144) // ceil(180 * 0.80) = 144
  })

  it('calculates recovery HR for good recovery (> 92%)', () => {
    const recoveryHr = calculateRecoveryHr(180, 95, false)
    expect(recoveryHr).toBe(141) // ceil(180 * 0.78) = 141
  })

  it('uses speed-only override when enabled', () => {
    const recoveryHr = calculateRecoveryHr(180, 80, true)
    expect(recoveryHr).toBe(135) // ceil(180 * 0.75) = 135
  })

  it('returns null when max HR is missing', () => {
    const recoveryHr = calculateRecoveryHr(null, 80, false)
    expect(recoveryHr).toBeNull()
  })

  it('returns null when recovery percentage is missing and not speed-only', () => {
    const recoveryHr = calculateRecoveryHr(180, null, false)
    expect(recoveryHr).toBeNull()
  })

  it('calculates speed-only even without recovery percentage', () => {
    const recoveryHr = calculateRecoveryHr(180, null, true)
    expect(recoveryHr).toBe(135) // ceil(180 * 0.75) = 135
  })

  it('rounds up decimal results', () => {
    const recoveryHr = calculateRecoveryHr(175, 80, false)
    expect(recoveryHr).toBe(144) // ceil(175 * 0.82) = ceil(143.5) = 144
  })

  it('handles boundary case at 85%', () => {
    const recoveryHr = calculateRecoveryHr(180, 85, false)
    expect(recoveryHr).toBe(144) // 85% uses 0.80 multiplier
  })

  it('handles boundary case at 92%', () => {
    const recoveryHr = calculateRecoveryHr(180, 92, false)
    expect(recoveryHr).toBe(144) // 92% uses 0.80 multiplier
  })
})

describe('getMetabolicCategoryLabel', () => {
  it('returns correct label for high lactic acid', () => {
    expect(getMetabolicCategoryLabel('la')).toBe('High Lactic Acid')
  })

  it('returns correct label for standard', () => {
    expect(getMetabolicCategoryLabel('standard')).toBe('Standard')
  })

  it('returns correct label for low metabolic', () => {
    expect(getMetabolicCategoryLabel('low')).toBe('Low Metabolic')
  })

  it('returns placeholder for null', () => {
    expect(getMetabolicCategoryLabel(null)).toBe('—')
  })
})

describe('getMetabolicCategoryShortLabel', () => {
  it('returns correct short label for high lactic acid', () => {
    expect(getMetabolicCategoryShortLabel('la')).toBe('High LA')
  })

  it('returns correct short label for standard', () => {
    expect(getMetabolicCategoryShortLabel('standard')).toBe('Standard')
  })

  it('returns correct short label for low metabolic', () => {
    expect(getMetabolicCategoryShortLabel('low')).toBe('Low Met')
  })

  it('returns placeholder for null', () => {
    expect(getMetabolicCategoryShortLabel(null)).toBe('—')
  })
})

describe('Full metabolic calculation integration', () => {
  it('handles complete data correctly', () => {
    const result = calculateMetabolicData({
      atHr: 160,
      maxHr: 180,
      recoveryHr2min: 140,
      speedOnly: false,
    })
    
    // AT/Max: 160/180 = 88.89%
    expect(result.atMaxPercent).toBeCloseTo(88.89, 2)
    
    // Recovery/AT: 140/160 = 87.5%
    expect(result.recoveryAtPercent).toBe(87.5)
    
    // 88.89% is in standard range (88-93%)
    expect(result.metabolicCategory).toBe('standard')
    
    // 87.5% uses 0.80 multiplier: ceil(180 * 0.80) = 144
    expect(result.recoveryHr).toBe(144)
  })

  it('handles speed-only mode correctly', () => {
    const result = calculateMetabolicData({
      atHr: 160,
      maxHr: 180,
      recoveryHr2min: 140,
      speedOnly: true,
    })
    
    // Speed-only uses 75% regardless of recovery percentage
    expect(result.recoveryHr).toBe(135) // ceil(180 * 0.75)
  })

  it('handles partial data (no recovery HR)', () => {
    const result = calculateMetabolicData({
      atHr: 160,
      maxHr: 180,
      recoveryHr2min: null,
      speedOnly: false,
    })
    
    // Can still calculate AT/Max and category
    expect(result.atMaxPercent).toBeCloseTo(88.89, 2)
    expect(result.metabolicCategory).toBe('standard')
    
    // But can't calculate recovery HR without recovery data
    expect(result.recoveryAtPercent).toBeNull()
    expect(result.recoveryHr).toBeNull()
  })
})
