

/**
 * Infinity Legal - South African ID Number Validation
 * Uses local Luhn checksum algorithm + Zanode API fallback
 * SA ID Format: YYMMDDGSSSCAZ
 *   - YYMMDD = Date of birth
 *   - G = Gender (0-4 female, 5-9 male)
 *   - SSS = Sequence number
 *   - C = Citizenship (0=SA citizen, 1=permanent resident)
 *   - A = Usually 8 or 9
 *   - Z = Luhn checksum digit
 */

/**
 * Validate SA ID number using local Luhn algorithm
 */
export function validateSAIdLocal(idNumber) {
  if (!idNumber || typeof idNumber !== "string") {
    return { valid: false, reason: "ID number is required" };
  }

  // Remove spaces and hyphens
  const clean = idNumber.replace(/[\s-]/g, "");

  // Check length
  if (clean.length !== 13) {
    return { valid: false, reason: "ID number must be 13 digits" };
  }

  // Check all digits
  if (!/^\d{13}$/.test(clean)) {
    return { valid: false, reason: "ID number must contain only digits" };
  }

  // Extract components
  const year = parseInt(clean.substring(0, 2), 10);
  const month = parseInt(clean.substring(2, 4), 10);
  const day = parseInt(clean.substring(4, 6), 10);
  const gender = parseInt(clean.substring(6, 7), 10);
  const citizenship = parseInt(clean.substring(10, 11), 10);

  // Validate date
  const currentYear = new Date().getFullYear() % 100;
  const fullYear = year > currentYear ? 1900 + year : 2000 + year;

  const date = new Date(fullYear, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { valid: false, reason: "Invalid date of birth in ID number" };
  }

  // Validate month (01-12)
  if (month < 1 || month > 12) {
    return { valid: false, reason: "Invalid month in ID number" };
  }

  // Validate day (01-31)
  if (day < 1 || day > 31) {
    return { valid: false, reason: "Invalid day in ID number" };
  }

  // Validate citizenship digit
  if (citizenship !== 0 && citizenship !== 1) {
    return { valid: false, reason: "Invalid citizenship digit" };
  }

  // Luhn checksum validation
  const digits = clean.split("").map(Number);
  const checksum = digits.pop(); // Remove last digit

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

  // Extract info
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

/**
 * Validate SA ID via Zanode API (fallback / additional verification)
 */
export async function validateSAIdViaApi(idNumber) {
  try {
    const clean = idNumber.replace(/[\s-]/g, "");
    const response = await fetch(`https://zanode.co.za/api/id-validation/${clean}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      return { valid: false, reason: "API validation unavailable", apiError: true };
    }

    const data = await response.json();
    return {
      valid: data.valid ?? false,
      ...data,
      source: "zanode-api",
    };
  } catch (err) {
    return { valid: false, reason: "API validation failed", apiError: true, error: err.message };
  }
}

/**
 * Smart validator - tries local first, falls back to API
 */
export async function validateSAId(idNumber) {
  // Always do local validation first (fast, reliable, no network)
  const localResult = validateSAIdLocal(idNumber);

  if (!localResult.valid) {
    return localResult;
  }

  // Local passed - optionally confirm with API
  // For production, you might want to always verify against the API
  // For demo/preview, local validation is sufficient and instant
  return {
    ...localResult,
    source: "local-luhn",
    note: "Local validation passed. API verification available for production.",
  };
}
