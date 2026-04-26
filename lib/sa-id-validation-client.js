/**
 * Infinity Legal - South African ID Validation (Client-Safe)
 * Pure JavaScript - no server-only APIs
 */

export function validateSAIdLocal(idNumber) {
  if (!idNumber || typeof idNumber !== "string") {
    return { valid: false, reason: "ID number is required" };
  }

  const clean = idNumber.replace(/[\s-]/g, "");

  if (clean.length !== 13) {
    return { valid: false, reason: "ID number must be 13 digits" };
  }

  if (!/^\d{13}$/.test(clean)) {
    return { valid: false, reason: "ID number must contain only digits" };
  }

  const year = parseInt(clean.substring(0, 2), 10);
  const month = parseInt(clean.substring(2, 4), 10);
  const day = parseInt(clean.substring(4, 6), 10);
  const gender = parseInt(clean.substring(6, 7), 10);
  const citizenship = parseInt(clean.substring(10, 11), 10);

  const currentYear = new Date().getFullYear() % 100;
  const fullYear = year > currentYear ? 1900 + year : 2000 + year;

  const date = new Date(fullYear, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { valid: false, reason: "Invalid date of birth in ID number" };
  }

  if (month < 1 || month > 12) {
    return { valid: false, reason: "Invalid month in ID number" };
  }

  if (day < 1 || day > 31) {
    return { valid: false, reason: "Invalid day in ID number" };
  }

  if (citizenship !== 0 && citizenship !== 1) {
    return { valid: false, reason: "Invalid citizenship digit" };
  }

  const digits = clean.split("").map(Number);
  const checksum = digits.pop();

  let sum = 0;
  let alternate = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits[i];
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }

  const calculatedChecksum = (10 - (sum % 10)) % 10;

  if (calculatedChecksum !== checksum) {
    return { valid: false, reason: "Invalid checksum - ID number appears to be fraudulent" };
  }

  const genderLabel = gender >= 5 ? "Male" : "Female";
  const citizenshipLabel = citizenship === 0 ? "SA Citizen" : "Permanent Resident";
  const age = new Date().getFullYear() - fullYear;

  return {
    valid: true,
    idNumber: clean,
    dateOfBirth: `${fullYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    gender: genderLabel,
    citizenship: citizenshipLabel,
    age,
    isAdult: age >= 18,
  };
}
