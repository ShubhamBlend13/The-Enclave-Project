import { useEffect, useState } from "react";

import AppShell from "./components/AppShell";
import DevRoleSwitcher from "./components/DevRoleSwitcher";
import Toast from "./components/Toast";
import CommunityPage from "./pages/CommunityPage";

import HomePage from "./pages/HomePage";
import IssueDetailPage from "./pages/IssueDetailPage";
import IssuesPage from "./pages/IssuesPage";
import ReportIssuePage from "./pages/ReportIssuePage";

import {
  ALL_AREAS_CODE,
  getAreaByCode,
} from "./constants/areas";
import { ISSUE_STATUSES } from "./constants/issues";
import {
  canPostAnnouncements,
  canViewCommunity,
  USER_ROLES,
} from "./constants/roles";
import { THEME } from "./constants/theme";

import {
  DEMO_ANNOUNCEMENTS,
  DEMO_ISSUES,
  DEMO_UPKEEP_TASKS,
} from "./data/demoData";
import { DEMO_PROFILES } from "./data/demoProfiles";

import { getDefaultAreaCode } from "./utils/areaAccess";
import { createId } from "./utils/id";

const TAB_TITLES = {
  upkeep: "Upkeep",
};

function getDefaultTab(profile) {
  // The upkeep manager starts directly with the active work queue.
  if (profile.role === USER_ROLES.UPKEEP_MANAGER) {
    return "issues";
  }

  // Residents, villa admins and the owner currently start at Home.
  return "home";
}

function getInitialDemoProfile() {
  // Keep our operational user as the default while testing issue workflows.
  return (
    DEMO_PROFILES.find(
      (item) => item.id === "demo-upkeep-manager",
    ) ?? DEMO_PROFILES[0]
  );
}

function App() {
  const [profile, setProfile] = useState(
    getInitialDemoProfile,
  );

  const [activeTab, setActiveTab] = useState(() =>
    getDefaultTab(getInitialDemoProfile()),
  );

  const [activeAreaCode, setActiveAreaCode] = useState(
    () =>
      getDefaultAreaCode(getInitialDemoProfile()),
  );

  // Issues stay in local state until Supabase replaces the demo data source.
  const [allIssues, setAllIssues] =
    useState(DEMO_ISSUES);

  // Announcements are local state until Supabase becomes the shared data source.
  const [allAnnouncements, setAllAnnouncements] =
    useState(DEMO_ANNOUNCEMENTS);

  const [selectedIssueId, setSelectedIssueId] =
    useState(null);

  const [toast, setToast] = useState("");

  const activeArea = getAreaByCode(activeAreaCode);

  // ALL is a virtual operational view and removes the area filter.
  const issues =
    activeAreaCode === ALL_AREAS_CODE
      ? allIssues
      : allIssues.filter(
        (issue) =>
          issue.areaCode === activeAreaCode,
      );

  // Announcements always belong to one real area.
  const announcements =
    activeAreaCode === ALL_AREAS_CODE
      ? []
      : allAnnouncements
        .filter(
          (announcement) =>
            announcement.areaCode === activeAreaCode,
        )
        .sort(
          (first, second) =>
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime(),
        );

  const upkeepTasks =
    activeAreaCode === ALL_AREAS_CODE
      ? DEMO_UPKEEP_TASKS
      : DEMO_UPKEEP_TASKS.filter(
        (task) =>
          task.areaCode === activeAreaCode,
      );

  const selectedIssue = issues.find(
    (issue) => issue.id === selectedIssueId,
  );

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    // Toast messages clear themselves after a short confirmation period.
    const timerId = window.setTimeout(() => {
      setToast("");
    }, 2600);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [toast]);

  const handleProfileChange = (profileId) => {
    const nextProfile = DEMO_PROFILES.find(
      (item) => item.id === profileId,
    );

    if (!nextProfile) {
      return;
    }

    // Every demo user starts in an area and tab permitted for their role.
    setProfile(nextProfile);
    setActiveAreaCode(
      getDefaultAreaCode(nextProfile),
    );
    setActiveTab(getDefaultTab(nextProfile));
    setSelectedIssueId(null);

    setToast(
      `Demo switched to ${nextProfile.label}.`,
    );
  };

  const handleAreaChange = (areaCode) => {
    // An issue detail from one area must not remain open in another context.
    setActiveAreaCode(areaCode);
    setSelectedIssueId(null);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);

    // Bottom navigation always returns to the selected tab's root page.
    setSelectedIssueId(null);
  };

  const handleIssueSubmit = async (formData) => {
    // ALL is only a viewing context and must never be stored on an issue.
    const reportArea = getAreaByCode(
      formData.areaCode,
    );

    if (
      !reportArea ||
      formData.areaCode === ALL_AREAS_CODE
    ) {
      setToast(
        "Choose a valid area for this issue.",
      );

      return;
    }

    const timestamp = new Date().toISOString();

    const newIssue = {
      id: createId(),
      areaCode: formData.areaCode,
      category: formData.category,
      location: formData.location,
      description: formData.description,
      priority: formData.priority,
      status: ISSUE_STATUSES.OPEN,
      reportedBy: profile.fullName,
      createdAt: timestamp,
      updatedAt: timestamp,
      resolvedAt: null,
      updates: [
        {
          id: createId(),
          message: "Issue reported",
          createdBy: profile.fullName,
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
      `Issue submitted for ${reportArea.name}.`,
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

  const handleAnnouncementPost = async (formData) => {
    // Only villa admins may create announcements.
    if (!canPostAnnouncements(profile)) {
      setToast(
        "You do not have permission to post announcements.",
      );

      return;
    }

    const announcementArea = getAreaByCode(
      activeAreaCode,
    );

    // Announcements must belong to a real villa or the clubhouse.
    if (
      !announcementArea ||
      activeAreaCode === ALL_AREAS_CODE
    ) {
      setToast(
        "Select a specific area before posting an announcement.",
      );

      return;
    }

    const newAnnouncement = {
      id: createId(),
      areaCode: activeAreaCode,
      title: formData.title,
      body: formData.body,
      createdBy: profile.fullName,
      createdAt: new Date().toISOString(),
    };

    setAllAnnouncements((currentAnnouncements) => [
      newAnnouncement,
      ...currentAnnouncements,
    ]);

    setToast(
      `Announcement published to ${announcementArea.name}.`,
    );
  };

  const renderPage = () => {
    if (activeTab === "home") {
      return (
        <HomePage
          profile={profile}
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
          // Changing area creates a fresh form with the correct report context.
          key={activeAreaCode}
          profile={profile}
          activeArea={activeArea}
          onSubmit={handleIssueSubmit}
          onCancel={() =>
            handleTabChange(
              getDefaultTab(profile),
            )
          }
        />
      );
    }

    if (activeTab === "issues") {
      if (selectedIssue) {
        return (
          <IssueDetailPage
            issue={selectedIssue}
            profile={profile}
            activeArea={activeArea}
            onBack={() =>
              setSelectedIssueId(null)
            }
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

    if (
      activeTab === "more" &&
      canViewCommunity(profile)
    ) {
      return (
        <CommunityPage
          // Changing areas resets unfinished announcement form state.
          key={activeAreaCode}
          profile={profile}
          activeArea={activeArea}
          announcements={announcements}
          onPostAnnouncement={handleAnnouncementPost}
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
        profile={profile}
        activeAreaCode={activeAreaCode}
        onAreaChange={handleAreaChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        {renderPage()}
      </AppShell>

      <Toast message={toast} />

      {/* Local-only helper for testing every role without editing App.jsx. */}
      <DevRoleSwitcher
        activeProfileId={profile.id}
        onProfileChange={handleProfileChange}
      />
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