export const AREA_TYPES = {
  VILLA: "villa",
  COMMON: "common",
};

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
    code: "CLUBHOUSE",
    name: "Clubhouse",
    type: AREA_TYPES.COMMON,
  },
];

export const CLUBHOUSE_CODE = "CLUBHOUSE";

export function getAreaByCode(code) {
  return AREAS.find((area) => area.code === code) ?? null;
}