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
      <header
        style={{
          padding: "12px 20px 4px",
        }}
      >
        {/* Area selection lives above every page so context survives navigation. */}
        <AreaSwitcher
          profile={profile}
          activeAreaCode={activeAreaCode}
          onAreaChange={onAreaChange}
        />
      </header>

      <main
        style={{
          padding: "12px 20px 110px",
        }}
      >
        {children}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
}

export default AppShell;