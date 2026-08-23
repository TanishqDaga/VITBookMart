/**
 * The backend stores Hostel as three plain strings (type / block / room) with no
 * enum and no validation, so these lists are frontend conveniences only.
 * The picker always allows a free-text block so an unusual value is never blocked.
 */

export const HOSTEL_TYPES = [
  { value: "MH", label: "Men's hostel (MH)" },
  { value: "LH", label: "Ladies' hostel (LH)" },
] as const;

export const HOSTEL_BLOCK_SUGGESTIONS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R",
] as const;
