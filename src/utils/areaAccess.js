import { AREAS, CLUBHOUSE_CODE } from "../constants/areas";
import { USER_ROLES } from "../constants/roles";

// Owner and upkeep users work across the full property.
const ALL_AREA_ROLES = new Set([
  USER_ROLES.OWNER_ADMIN,
  USER_ROLES.UPKEEP_MANAGER,
]);

export function getAccessibleAreas(profile) {
  if (!profile) {
    return [];
  }

  if (ALL_AREA_ROLES.has(profile.role)) {
    return AREAS;
  }

  // Villa users can switch only between their home villa and the clubhouse.
  return AREAS.filter(
    (area) =>
      area.code === profile.homeAreaCode ||
      area.code === CLUBHOUSE_CODE,
  );
}

export function getDefaultAreaCode(profile) {
  const accessibleAreas = getAccessibleAreas(profile);

  // Villa users should land in their own home context after login.
  const homeArea = accessibleAreas.find(
    (area) => area.code === profile?.homeAreaCode,
  );

  return homeArea?.code ?? accessibleAreas[0]?.code ?? null;
}