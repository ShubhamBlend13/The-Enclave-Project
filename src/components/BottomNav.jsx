import { getNavigationItems } from "../constants/navigation";
import { THEME } from "../constants/theme";

function BottomNav({
  profile,
  activeTab,
  onTabChange,
}) {
  // The visible tabs depend on the authenticated user's role.
  const navigationItems = getNavigationItems(profile);

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        zIndex: 20,
        display: "flex",
        width: "100%",
        maxWidth: 480,
        padding:
          "10px 8px calc(12px + env(safe-area-inset-bottom))",
        borderTop: `1px solid ${THEME.line}`,
        background: "#FFFFFFF2",
        backdropFilter: "blur(10px)",
        transform: "translateX(-50%)",
      }}
    >
      {navigationItems.map((item) => {
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            style={{
              flex: 1,
              padding: "4px 0",
              border: "none",
              background: "transparent",
              color: isActive
                ? THEME.green
                : THEME.mute,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              {item.icon}
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 10.5,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: 0.3,
              }}
            >
              {item.label}
            </div>

            {isActive && (
              <div
                style={{
                  width: 16,
                  height: 3,
                  margin: "4px auto 0",
                  borderRadius: 2,
                  background: THEME.brass,
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;