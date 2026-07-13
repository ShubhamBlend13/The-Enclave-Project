// Date formatting stays in one place so pages do not repeat locale logic.
export function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const datePart = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  const timePart = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePart}, ${timePart}`;
}

export function formatDueDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

const ENCLAVE_TIME_ZONE = "Asia/Kolkata";

export function getEnclaveTodayDate() {
  const dateParts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: ENCLAVE_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).formatToParts(new Date());

  const dateValues = Object.fromEntries(
    dateParts.map((part) => [
      part.type,
      part.value,
    ]),
  );

  return `${dateValues.year}-${dateValues.month}-${dateValues.day}`;
}

export function isPastEnclaveDate(dateValue) {
  if (!dateValue) {
    return false;
  }

  return dateValue < getEnclaveTodayDate();
}