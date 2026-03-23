// ============================================
// 🎛️ GLOBAL FORMAT CONFIG
// Change ROUND_PERCENTAGES to false → decimals 
// Change to true → whole numbers 
// ============================================

export const FORMAT_CONFIG = {
  ROUND_PERCENTAGES: true,   // 👈 TRUE = round, FALSE = decimal
  ROUND_CURRENCY: true,
};

// Core formatter — config based
export const formatPercentage = (num) => {
  if (FORMAT_CONFIG.ROUND_PERCENTAGES) {
    return `${Math.round(num)}%`;           // 61.06 → 61%
  } else {
    return `${num.toFixed(2)}%`;            // 61.06 → 61.06%
  }
};