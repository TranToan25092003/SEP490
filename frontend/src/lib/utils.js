import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format price in Vietnamese Dong (VND)
export function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(price)
}

// Function to format date
export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Format time from minutes to hours and minutes
 * @param {number} minutes
 * @returns {string} Formatted time string in "X giờ Y phút" or "Y phút" format
 */
export function formatTimeXGioYPhut(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours} giờ ${mins} phút` : `${mins} phút`;
};

/**
 * Format date and time to dd/MM/yyyy - HH:mm
 * @param {Date} date - Date object to format
 * @returns
 */
export function formatDateTime(date) {
  date = new Date(date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} - ${hours}:${minutes}`;
}
