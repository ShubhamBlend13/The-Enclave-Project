import { AREAS, AREA_TYPES } from "../constants/areas";
import { THEME } from "../constants/theme";

function VillaStrip({ activeAreaCode }) {
  // The villa strip is only a visual representation of the eight homes.
  // Clubhouse navigation is already handled by the area switcher above.
  const villas = AREAS.filter(
    (area) => area.type === AREA_TYPES.VILLA,
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 6,
        paddingTop: 8,
      }}
    >
      {villas.map((villa) => {
        // No villa is highlighted while the Clubhouse context is active.
        const isActive = villa.code === activeAreaCode;

        return (
          <div
            key={villa.code}
            style={{
              flex: 1,
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                height: isActive ? 44 : 32,
                alignItems: "flex-end",
                justifyContent: "center",
                border: `1.5px solid ${
                  isActive ? THEME.brass : THEME.line
                }`,
                borderRadius: "8px 8px 3px 3px",
                background: isActive
                  ? THEME.brass
                  : THEME.greenSoft,
                transition: "height 300ms ease",
              }}
            >
              {/* Small rotated square creates the roof shape from the prototype. */}
              <div
                style={{
                  position: "absolute",
                  top: -7,
                  left: "50%",
                  width: isActive ? 16 : 12,
                  height: isActive ? 16 : 12,
                  borderTop: `1.5px solid ${
                    isActive ? THEME.brass : THEME.line
                  }`,
                  borderLeft: `1.5px solid ${
                    isActive ? THEME.brass : THEME.line
                  }`,
                  borderRadius: 3,
                  background: isActive
                    ? THEME.brass
                    : THEME.greenSoft,
                  transform: "translateX(-50%) rotate(45deg)",
                }}
              />

              <span
                style={{
                  paddingBottom: 5,
                  color: isActive ? "#FFFFFF" : THEME.mute,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                {villa.code}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VillaStrip;