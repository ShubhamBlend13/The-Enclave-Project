export function createId() {
  // Modern browsers provide secure UUID generation.
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // This fallback is sufficient only for temporary prototype records.
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}