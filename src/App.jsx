import { useState } from "react";

import AppShell from "./components/AppShell";
import HomePage from "./pages/HomePage";
import { getAreaByCode } from "./constants/areas";
import { USER_ROLES } from "./constants/roles";
import { THEME } from "./constants/theme";
import {
  DEMO_ANNOUNCEMENTS,
  DEMO_ISSUES,
  DEMO_UPKEEP_TASKS,
} from "./data/demoData";
import { getDefaultAreaCode } from "./utils/areaAccess";

// This profile exists only until Supabase authentication is connected.
const DEMO_PROFILE = {
  id: "demo-s1-admin",
  fullName: "Sunil Tenali",
  role: USER_ROLES.VILLA_ADMIN,
  homeAreaCode: "S1",
};

const TAB_TITLES = {
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

  // Area filtering happens before data reaches each page.
  // Supabase queries will later apply this same area constraint.
  const issues = DEMO_ISSUES.filter(
    (issue) => issue.areaCode === activeAreaCode,
  );

  const announcements = DEMO_ANNOUNCEMENTS.filter(
    (announcement) =>
      announcement.areaCode === activeAreaCode,
  );

  const upkeepTasks = DEMO_UPKEEP_TASKS.filter(
    (task) => task.areaCode === activeAreaCode,
  );

  const renderPage = () => {
    if (activeTab === "home") {
      return (
        <HomePage
          profile={DEMO_PROFILE}
          activeArea={activeArea}
          issues={issues}
          announcements={announcements}
          upkeepTasks={upkeepTasks}
          onNavigate={setActiveTab}
        />
      );
    }

    return (
      <PagePlaceholder
        title={TAB_TITLES[activeTab]}
        areaName={activeArea?.name}
      />
    );
  };

  return (
    <AppShell
      profile={DEMO_PROFILE}
      activeAreaCode={activeAreaCode}
      onAreaChange={setActiveAreaCode}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderPage()}
    </AppShell>
  );
}

function PagePlaceholder({ title, areaName }) {
  return (
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
        {title}
      </h1>

      <p
        style={{
          margin: 0,
          color: THEME.mute,
          fontSize: 14,
        }}
      >
        {areaName}
      </p>

      <div
        style={{
          marginTop: 22,
          padding: 18,
          border: `1px solid ${THEME.line}`,
          borderRadius: 16,
          background: THEME.card,
          color: THEME.mute,
          fontSize: 14,
        }}
      >
        This workflow is being connected next.
      </div>
    </section>
  );
}

export default App;