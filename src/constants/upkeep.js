export const UPKEEP_FREQUENCIES = [
  {
    id: "weekly",
    label: "Weekly",
    days: 7,
  },
  {
    id: "monthly",
    label: "Monthly",
    months: 1,
  },
  {
    id: "quarterly",
    label: "Every 3 months",
    months: 3,
  },
  {
    id: "halfyearly",
    label: "Every 6 months",
    months: 6,
  },
  {
    id: "yearly",
    label: "Yearly",
    months: 12,
  },
];

export function getUpkeepFrequency(frequencyId) {
  return (
    UPKEEP_FREQUENCIES.find(
      (frequency) => frequency.id === frequencyId,
    ) ?? null
  );
}