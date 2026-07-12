import { DEMO_PROFILES } from "../data/demoProfiles";
import { THEME } from "../constants/theme";

function DevRoleSwitcher({
  activeProfileId,
  onProfileChange,
}) {
  // Never expose development test controls in a production build.
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 10,
        bottom: 92,
        zIndex: 100,
        width: 180,
        padding: 10,
        border: `1px solid ${THEME.line}`,
        borderRadius: 12,
        background: THEME.card,
        boxShadow: "0 6px 20px rgba(28, 43, 38, 0.18)",
      }}
    >
      <label
        htmlFor="demo-profile"
        style={{
          display: "block",
          marginBottom: 5,
          color: THEME.mute,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Demo as
      </label>

      <select
        id="demo-profile"
        value={activeProfileId}
        onChange={(event) =>
          onProfileChange(event.target.value)
        }
        style={{
          width: "100%",
          padding: "8px 9px",
          border: `1px solid ${THEME.line}`,
          borderRadius: 8,
          background: THEME.card,
          color: THEME.ink,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {DEMO_PROFILES.map((profile) => (
          <option
            key={profile.id}
            value={profile.id}
          >
            {profile.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default DevRoleSwitcher;