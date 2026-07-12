import { useEffect, useState } from "react";

import AppShell from "./components/AppShell";
import Toast from "./components/Toast";
import HomePage from "./pages/HomePage";
import ReportIssuePage from "./pages/ReportIssuePage";
import { getAreaByCode } from "./constants/areas";
import {
  ISSUE_STATUSES,
} from "./constants/issues";
import { USER_ROLES } from "./constants/roles";
import { THEME } from "./constants/theme";
import {
  DEMO_ANNOUNCEMENTS,
  DEMO_ISSUES,
  DEMO_UPKEEP_TASKS,
} from "./data/demoData";
import { getDefaultAreaCode } from "./utils/areaAccess";
import { createId } from "./utils/id";

// This local profile will be replaced by the authenticated Supabase profile.
const DEMO_PROFILE = {
  id: "demo-s1-admin",
  fullName: "Sunil Tenali",
  role: USER_ROLES.VILLA_ADMIN,
  homeAreaCode: "S1",
};

const TAB_TITLES = {
  issues: "Issues",
  upkeep: "Upkeep",
  more: "Community",
};

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [activeAreaCode, setActiveAreaCode] = useState(() =>
    getDefaultAreaCode(DEMO_PROFILE),
  );

  // Issues are local state for now so newly submitted records appear immediately.
  const [allIssues, setAllIssues] = useState(DEMO_ISSUES);
  const [toast, setToast] = useState("");

  const activeArea = getAreaByCode(activeAreaCode);

  const issues = allIssues.filter(
    (issue) => issue.areaCode === activeAreaCode,
  );

  const announcements = DEMO_ANNOUNCEMENTS.filter(
    (announcement) =>
      announcement.areaCode === activeAreaCode,
  );

  const upkeepTasks = DEMO_UPKEEP_TASKS.filter(
    (task) => task.areaCode === activeAreaCode,
  );

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    // The confirmation disappears automatically after a short delay.
    const timerId = window.setTimeout(() => {
      setToast("");
    }, 2600);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [toast]);

  const handleIssueSubmit = async (formData) => {
    const newIssue = {
      id: createId(),
      areaCode: activeAreaCode,
      category: formData.category,
      location: formData.location,
      description: formData.description,
      priority: formData.priority,
      status: ISSUE_STATUSES.OPEN,
      reportedBy: DEMO_PROFILE.fullName,
      createdAt: new Date().toISOString(),
      updates: [
        {
          id: createId(),
          message: "Issue reported",
          createdBy: DEMO_PROFILE.fullName,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    setAllIssues((currentIssues) => [
      newIssue,
      ...currentIssues,
    ]);

    setActiveTab("home");
    setToast(
      `Issue submitted for ${activeArea?.name ?? "the selected area"}.`,
    );
  };

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

    if (activeTab === "report") {
      return (
        <ReportIssuePage
          // Reset unfinished form state when the user changes areas.
          key={activeAreaCode}
          activeArea={activeArea}
          onSubmit={handleIssueSubmit}
          onCancel={() => setActiveTab("home")}
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
    <>
      <AppShell
        profile={DEMO_PROFILE}
        activeAreaCode={activeAreaCode}
        onAreaChange={setActiveAreaCode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderPage()}
      </AppShell>

      <Toast message={toast} />
    </>
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