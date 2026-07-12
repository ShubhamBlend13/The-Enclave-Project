import AreaSwitcher from "./AreaSwitcher";
import BottomNav from "./BottomNav";
import { THEME } from "../constants/theme";

function AppShell({
  profile,
  activeAreaCode,
  onAreaChange,
  activeTab,
  onTabChange,
  children,
}) {
  // A report owns its area selection once the form opens.
  // Hiding the global switcher prevents the form context changing midway.
  const showAreaSwitcher = activeTab !== "report";

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        maxWidth: 480,
        margin: "0 auto",
        background: THEME.bg,
      }}
    >
      {showAreaSwitcher && (
        <header
          style={{
            padding: "12px 20px 4px",
          }}
        >
          {/* Area context is shared by the main application pages. */}
          <AreaSwitcher
            profile={profile}
            activeAreaCode={activeAreaCode}
            onAreaChange={onAreaChange}
          />
        </header>
      )}

      <main
        style={{
          padding: "12px 20px 110px",
        }}
      >
        {children}
      </main>

      <BottomNav
        profile={profile}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
}

export default AppShell;