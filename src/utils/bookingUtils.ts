/**
 * Pure helper utility functions for Smooth Operator SF Booking Engine.
 * Manages calendar calculations, date string formatters, and timeslot slot generators.
 */

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Returns the exact days count in a given month.
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Returns the weekday offset of the first day of the month (0 = Sunday, 1 = Monday, etc.).
 */
export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

/**
 * Standardizes a year, month, and day into format: UTC-neutral YYYY-MM-DD.
 */
export const formatDayString = (year: number, month: number, dayNum: number): string => {
  const mo = (month + 1).toString().padStart(2, '0');
  const dy = dayNum.toString().padStart(2, '0');
  return `${year}-${mo}-${dy}`;
};

/**
 * Generates 15-minute timeslots between 09:00 AM and 07:00 PM (Drew's open business hours).
 * Returns array with slot values, human-readable labels, and total minutes from midnight.
 */
export interface TimeSlot {
  value: string;
  label: string;
  minutes: number;
}

export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let h = 9; h < 19; h++) {
    for (let m = 0; m < 60; m += 15) {
      const minStr = m.toString().padStart(2, '0');
      const val = `${h.toString().padStart(2, '0')}:${minStr}`;
      
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const displayLabel = `${displayHour}:${minStr} ${period}`;
      
      slots.push({ value: val, label: displayLabel, minutes: h * 60 + m });
    }
  }
  return slots;
};
