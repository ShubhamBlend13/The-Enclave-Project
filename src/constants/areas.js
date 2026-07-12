export const AREA_TYPES = {
  VILLA: "villa",
  COMMON: "common",
};

// All areas is a viewing context for operational users.
// It is not stored as a real area in the database.
export const ALL_AREAS_CODE = "ALL";

export const CLUBHOUSE_CODE = "CLUBHOUSE";

export const AREAS = [
  { code: "S1", name: "Villa S1", type: AREA_TYPES.VILLA },
  { code: "S2", name: "Villa S2", type: AREA_TYPES.VILLA },
  { code: "S3", name: "Villa S3", type: AREA_TYPES.VILLA },
  { code: "S4", name: "Villa S4", type: AREA_TYPES.VILLA },
  { code: "E1", name: "Villa E1", type: AREA_TYPES.VILLA },
  { code: "E2", name: "Villa E2", type: AREA_TYPES.VILLA },
  { code: "E3", name: "Villa E3", type: AREA_TYPES.VILLA },
  { code: "E4", name: "Villa E4", type: AREA_TYPES.VILLA },
  {
    code: CLUBHOUSE_CODE,
    name: "Clubhouse",
    type: AREA_TYPES.COMMON,
  },
];

export function getAreaByCode(code) {
  if (code === ALL_AREAS_CODE) {
    return {
      code: ALL_AREAS_CODE,
      name: "All areas",
      type: "virtual",
    };
  }

  return AREAS.find((area) => area.code === code) ?? null;
}