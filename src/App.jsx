import { useEffect, useState } from "react";

import AppShell from "./components/AppShell";
import Toast from "./components/Toast";
import HomePage from "./pages/HomePage";
import IssueDetailPage from "./pages/IssueDetailPage";
import IssuesPage from "./pages/IssuesPage";
import ReportIssuePage from "./pages/ReportIssuePage";
import {
  ALL_AREAS_CODE,
  getAreaByCode,
} from "./constants/areas";
import { ISSUE_STATUSES } from "./constants/issues";
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
  id: "demo-upkeep-manager",
  fullName: "Iron Man",
  role: USER_ROLES.VILLA__ADMIN,
  homeAreaCode: "S2",
};

const TAB_TITLES = {
  upkeep: "Upkeep",
  more: "Community",
};

function getDefaultTab(profile) {
  // Operational users should land directly on the work queue.
  if (profile.role === USER_ROLES.UPKEEP_MANAGER) {
    return "issues";
  }

  // Residents and villa admins start with their area dashboard.
  return "home";
}

function App() {
  const [activeTab, setActiveTab] = useState(() =>
    getDefaultTab(DEMO_PROFILE),
  );

  const [activeAreaCode, setActiveAreaCode] = useState(() =>
    getDefaultAreaCode(DEMO_PROFILE),
  );

  // Local issue state lets us test create and update workflows before Supabase.
  const [allIssues, setAllIssues] = useState(DEMO_ISSUES);

  const [selectedIssueId, setSelectedIssueId] =
    useState(null);

  const [toast, setToast] = useState("");

  const activeArea = getAreaByCode(activeAreaCode);

  // All Areas removes the area constraint for operational work queues.
  const issues =
    activeAreaCode === ALL_AREAS_CODE
      ? allIssues
      : allIssues.filter(
        (issue) => issue.areaCode === activeAreaCode,
      );

  // Announcements still belong to one real area.
  const announcements =
    activeAreaCode === ALL_AREAS_CODE
      ? []
      : DEMO_ANNOUNCEMENTS.filter(
        (announcement) =>
          announcement.areaCode === activeAreaCode,
      );

  const upkeepTasks =
    activeAreaCode === ALL_AREAS_CODE
      ? DEMO_UPKEEP_TASKS
      : DEMO_UPKEEP_TASKS.filter(
        (task) => task.areaCode === activeAreaCode,
      );

  const selectedIssue = issues.find(
    (issue) => issue.id === selectedIssueId,
  );

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setToast("");
    }, 2600);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [toast]);

  const handleAreaChange = (areaCode) => {
    // An issue from one area must not remain open after switching context.
    setActiveAreaCode(areaCode);
    setSelectedIssueId(null);
  };

  const handleTabChange = (tabId) => {
    // New issues must always belong to a real villa or the clubhouse.
    if (
      tabId === "report" &&
      activeAreaCode === ALL_AREAS_CODE
    ) {
      setToast(
        "Select a specific area before reporting an issue.",
      );

      return;
    }

    setActiveTab(tabId);

    // Pressing a bottom-navigation item returns to its main page.
    setSelectedIssueId(null);
  };

  const handleIssueSubmit = async (formData) => {
    const timestamp = new Date().toISOString();

    const newIssue = {
      id: createId(),
      areaCode: activeAreaCode,
      category: formData.category,
      location: formData.location,
      description: formData.description,
      priority: formData.priority,
      status: ISSUE_STATUSES.OPEN,
      reportedBy: DEMO_PROFILE.fullName,
      createdAt: timestamp,
      updatedAt: timestamp,
      resolvedAt: null,
      updates: [
        {
          id: createId(),
          message: "Issue reported",
          createdBy: DEMO_PROFILE.fullName,
          createdAt: timestamp,
        },
      ],
    };

    setAllIssues((currentIssues) => [
      newIssue,
      ...currentIssues,
    ]);

    handleTabChange("issues");

    setToast(
      `Issue submitted for ${activeArea?.name ?? "the selected area"
      }.`,
    );
  };

  const handleIssueUpdate = (updatedIssue) => {
    setAllIssues((currentIssues) =>
      currentIssues.map((issue) =>
        issue.id === updatedIssue.id
          ? updatedIssue
          : issue,
      ),
    );

    setToast("Issue updated.");
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
          onNavigate={handleTabChange}
        />
      );
    }

    if (activeTab === "report") {
      return (
        <ReportIssuePage
          // Reset unfinished form state when the selected area changes.
          key={activeAreaCode}
          activeArea={activeArea}
          onSubmit={handleIssueSubmit}
          onCancel={() => handleTabChange("home")}
        />
      );
    }

    if (activeTab === "issues") {
      if (selectedIssue) {
        return (
          <IssueDetailPage
            issue={selectedIssue}
            profile={DEMO_PROFILE}
            activeArea={activeArea}
            onBack={() => setSelectedIssueId(null)}
            onUpdate={handleIssueUpdate}
          />
        );
      }

      return (
        <IssuesPage
          activeArea={activeArea}
          issues={issues}
          onOpenIssue={setSelectedIssueId}
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
        onAreaChange={handleAreaChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
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