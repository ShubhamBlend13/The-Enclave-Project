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
          padding: "22px 20px 8px",
        }}
      >
        <div
          style={{
            color: THEME.brass,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2.5,
          }}
        >
          THE ENCLAVE
        </div>

        {/* Area context stays outside individual pages so every tab follows it. */}
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