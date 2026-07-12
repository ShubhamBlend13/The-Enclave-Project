import { getUpkeepFrequency } from "../constants/upkeep";

function addMonthsClamped(date, months) {
  const nextDate = new Date(date);
  const originalDay = nextDate.getDate();

  // Move to the first day first so dates such as January 31 do not overflow.
  nextDate.setDate(1);
  nextDate.setMonth(nextDate.getMonth() + months);

  const lastDayOfTargetMonth = new Date(
    nextDate.getFullYear(),
    nextDate.getMonth() + 1,
    0,
  ).getDate();

  nextDate.setDate(
    Math.min(originalDay, lastDayOfTargetMonth),
  );

  return nextDate;
}

export function calculateNextDue(
  completedAt,
  frequencyId,
) {
  const completedDate = new Date(completedAt);
  const frequency =
    getUpkeepFrequency(frequencyId);

  if (
    Number.isNaN(completedDate.getTime()) ||
    !frequency
  ) {
    return null;
  }

  let nextDate = new Date(completedDate);

  if (frequency.days) {
    nextDate.setDate(
      nextDate.getDate() + frequency.days,
    );
  }

  if (frequency.months) {
    nextDate = addMonthsClamped(
      nextDate,
      frequency.months,
    );
  }

  return nextDate.toISOString();
}

export function dateInputToIso(value) {
  if (!value) {
    return null;
  }

  // Use a daytime value to avoid date shifts around timezone boundaries.
  const date = new Date(`${value}T09:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
}