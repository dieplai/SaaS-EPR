// Currency conversion utilities
const USD_TO_VND_RATE = 26312.40;

export const formatPrice = (priceUSD: number, language: string): string => {
  if (language === 'vi') {
    // Convert to VND
    const priceVND = Math.round(priceUSD * USD_TO_VND_RATE);
    return `${priceVND.toLocaleString('vi-VN')}đ`;
  } else {
    // Display in USD
    return `$${priceUSD.toFixed(2)}`;
  }
};

export const formatYearlyPrice = (monthlyPriceUSD: number, language: string): string => {
  // 20% discount for yearly (12 months * 0.8 = pay 80% of total)
  const yearlyPriceUSD = monthlyPriceUSD * 12 * 0.8;

  if (language === 'vi') {
    const priceVND = Math.round(yearlyPriceUSD * USD_TO_VND_RATE);
    return `${priceVND.toLocaleString('vi-VN')}đ`;
  } else {
    return `$${yearlyPriceUSD.toFixed(2)}`;
  }
};
