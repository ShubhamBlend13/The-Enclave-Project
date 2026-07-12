import { useState } from "react";

import AppShell from "./components/AppShell";
import { getAreaByCode } from "./constants/areas";
import { USER_ROLES } from "./constants/roles";
import { THEME } from "./constants/theme";
import { getDefaultAreaCode } from "./utils/areaAccess";

// Temporary local profile until Supabase Auth is connected.
const DEMO_PROFILE = {
  id: "demo-s1-admin",
  fullName: "Iron Man",
  role: USER_ROLES.VILLA_ADMIN,
  homeAreaCode: "S1",
};

const TAB_TITLES = {
  home: "Home",
  report: "Report an issue",
  issues: "Issues",
  upkeep: "Upkeep",
  more: "Community",
};

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [activeAreaCode, setActiveAreaCode] = useState(() =>
    getDefaultAreaCode(DEMO_PROFILE),
  );

  const activeArea = getAreaByCode(activeAreaCode);

  return (
    <AppShell
      profile={DEMO_PROFILE}
      activeAreaCode={activeAreaCode}
      onAreaChange={setActiveAreaCode}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <section>
        <h1
          style={{
            margin: "4px 0 6px",
            color: THEME.ink,
            fontFamily: "'Marcellus', serif",
            fontSize: 28,
            fontWeight: 400,
          }}
        >
          {TAB_TITLES[activeTab]}
        </h1>

        <p
          style={{
            margin: 0,
            color: THEME.mute,
            fontSize: 14,
          }}
        >
          Showing {activeArea?.name ?? "unknown area"}
        </p>

        {/* Temporary card proves that area context survives bottom-nav changes. */}
        <div
          style={{
            marginTop: 22,
            padding: 18,
            border: `1px solid ${THEME.line}`,
            borderRadius: 16,
            background: THEME.card,
          }}
        >
          <div
            style={{
              color: THEME.ink,
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Current prototype context
          </div>

          <div
            style={{
              marginTop: 8,
              color: THEME.mute,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            User: {DEMO_PROFILE.fullName}
            <br />
            Role: {DEMO_PROFILE.role}
            <br />
            Area: {activeArea?.code}
            <br />
            Page: {activeTab}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export default App;