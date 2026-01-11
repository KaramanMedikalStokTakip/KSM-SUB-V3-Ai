import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Turkish Lira currency
 * @param {number} amount - Amount to format
 * @param {boolean} showSymbol - Whether to show ₺ symbol (default: true)
 * @returns {string} - Formatted currency string
 * 
 * Examples:
 * formatCurrency(1000000) => "₺1.000.000,00"
 * formatCurrency(1234.56) => "₺1.234,56"
 * formatCurrency(1234.56, false) => "1.234,56"
 */
export function formatCurrency(amount, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₺0,00' : '0,00';
  }
  
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return showSymbol ? `₺${formatted}` : formatted;
}
