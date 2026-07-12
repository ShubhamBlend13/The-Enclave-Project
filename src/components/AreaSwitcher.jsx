import {
  ALL_AREAS_CODE,
  CLUBHOUSE_CODE,
} from "../constants/areas";
import { THEME } from "../constants/theme";
import { USER_ROLES } from "../constants/roles";
import {
  canViewAllAreas,
  getAccessibleAreas,
} from "../utils/areaAccess";

const AREA_PICKER_ROLES = new Set([
  USER_ROLES.OWNER_ADMIN,
  USER_ROLES.UPKEEP_MANAGER,
]);

function AreaSwitcher({
  profile,
  activeAreaCode,
  onAreaChange,
}) {
  const accessibleAreas = getAccessibleAreas(profile);
  const useAreaPicker = AREA_PICKER_ROLES.has(profile?.role);

  if (accessibleAreas.length === 0) {
    return null;
  }

  // Operational users work across many areas, so a dropdown is easier on mobile.
  if (useAreaPicker) {
    return (
      <div
        style={{
          marginTop: 16,
        }}
      >
        <label
          htmlFor="active-area"
          style={{
            display: "block",
            marginBottom: 6,
            color: THEME.mute,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Active area
        </label>

        <select
          id="active-area"
          value={activeAreaCode ?? ""}
          onChange={(event) =>
            onAreaChange(event.target.value)
          }
          style={{
            width: "100%",
            padding: "12px 14px",
            border: `1.5px solid ${THEME.line}`,
            borderRadius: 12,
            background: THEME.card,
            color: THEME.ink,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {canViewAllAreas(profile) && (
            <option value={ALL_AREAS_CODE}>
              All areas
            </option>
          )}

          {accessibleAreas.map((area) => (
            <option
              key={area.code}
              value={area.code}
            >
              {area.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        marginTop: 16,
        padding: 4,
        borderRadius: 14,
        background: THEME.greenSoft,
      }}
    >
      {accessibleAreas.map((area) => {
        const isActive = area.code === activeAreaCode;

        // Villa users switch between their own home and the shared clubhouse.
        const label =
          area.code === CLUBHOUSE_CODE
            ? "Clubhouse"
            : `Villa ${area.code}`;

        return (
          <button
            key={area.code}
            type="button"
            onClick={() => onAreaChange(area.code)}
            style={{
              padding: "11px 10px",
              border: "none",
              borderRadius: 10,
              background: isActive
                ? THEME.card
                : "transparent",
              color: isActive
                ? THEME.green
                : THEME.mute,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: isActive
                ? "0 1px 4px rgba(28, 43, 38, 0.10)"
                : "none",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default AreaSwitcher;