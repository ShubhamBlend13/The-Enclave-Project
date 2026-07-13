const AUTH_ALIAS_DOMAIN =
  "auth.enclave.example.com";

export function normalizePhone(value) {
  const digits = String(value ?? "").replace(
    /\D/g,
    "",
  );

  // Allow Indian users to type either a 10-digit mobile
  // number or the complete number including country code.
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return `+${digits}`;
  }

  throw new Error(
    "Enter a valid 10-digit Indian phone number.",
  );
}

export function normalizeEmployeeId(value) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  if (!/^[A-Z0-9-]{3,30}$/.test(normalized)) {
    throw new Error(
      "Enter a valid employee ID.",
    );
  }

  return normalized;
}

export function getPhoneAuthEmail(phone) {
  const normalizedPhone =
    normalizePhone(phone);

  const digits = normalizedPhone.replace(
    /\D/g,
    "",
  );

  return `phone_${digits}@${AUTH_ALIAS_DOMAIN}`;
}

export function getEmployeeAuthEmail(employeeId) {
  const normalizedEmployeeId =
    normalizeEmployeeId(employeeId)
      .toLowerCase()
      .replace(/-/g, "_");

  return `employee_${normalizedEmployeeId}@${AUTH_ALIAS_DOMAIN}`;
}