import {
  ALL_AREAS_CODE,
  AREAS,
  CLUBHOUSE_CODE,
} from "../constants/areas";
import { USER_ROLES } from "../constants/roles";

// Operational roles can work across the whole property.
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

  // Villa users only access their own home and the shared clubhouse.
  return AREAS.filter(
    (area) =>
      area.code === profile.homeAreaCode ||
      area.code === CLUBHOUSE_CODE,
  );
}

export function getDefaultAreaCode(profile) {
  if (!profile) {
    return null;
  }

  // Upkeep and owner users start with a combined operational view.
  if (ALL_AREA_ROLES.has(profile.role)) {
    return ALL_AREAS_CODE;
  }

  const accessibleAreas = getAccessibleAreas(profile);

  const homeArea = accessibleAreas.find(
    (area) => area.code === profile.homeAreaCode,
  );

  return homeArea?.code ?? accessibleAreas[0]?.code ?? null;
}

export function canViewAllAreas(profile) {
  return ALL_AREA_ROLES.has(profile?.role);
}

export function canAccessAreaCode(
  profile,
  areaCode,
) {
  if (
    !profile ||
    !areaCode ||
    areaCode === ALL_AREAS_CODE
  ) {
    return false;
  }

  return getAccessibleAreas(profile).some(
    (area) => area.code === areaCode,
  );
}