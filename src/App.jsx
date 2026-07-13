import { useEffect, useState } from "react";

import AppShell from "./components/AppShell";
import DevRoleSwitcher from "./components/DevRoleSwitcher";
import Toast from "./components/Toast";
import CommunityPage from "./pages/CommunityPage";
import AccountManagementPage from "./pages/AccountManagementPage";
import { DEMO_USERS } from "./data/demoUsers";

import HomePage from "./pages/HomePage";
import IssueDetailPage from "./pages/IssueDetailPage";
import IssuesPage from "./pages/IssuesPage";
import ReportIssuePage from "./pages/ReportIssuePage";
import UpkeepPage from "./pages/UpkeepPage";

import {
  ALL_AREAS_CODE,
  getAreaByCode,
} from "./constants/areas";
import { ISSUE_STATUSES } from "./constants/issues";
import {
  canManageUpkeep,
  canPostAnnouncements,
  canViewCommunity,
  isOwnerAdmin,
  isVillaAdmin,
  USER_ROLES,
} from "./constants/roles";
import { THEME } from "./constants/theme";
import { canManageUser } from "./utils/userAccess";
import { calculateNextDue } from "./utils/upkeep";

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

function App({
  authenticatedProfile = null,
  onSignOut = null,
}) {
  const [demoProfile, setDemoProfile] = useState(
    getInitialDemoProfile,
  );

  const profile =
    authenticatedProfile ?? demoProfile;

  const initialProfile =
    authenticatedProfile ??
    getInitialDemoProfile();

  const [activeTab, setActiveTab] = useState(() =>
    getDefaultTab(initialProfile),
  );

  const [activeAreaCode, setActiveAreaCode] =
    useState(() =>
      getDefaultAreaCode(initialProfile),
    );

  // Issues stay in local state until Supabase replaces the demo data source.
  const [allIssues, setAllIssues] =
    useState(DEMO_ISSUES);

  // Announcements are local state until Supabase becomes the shared data source.
  const [allAnnouncements, setAllAnnouncements] =
    useState(DEMO_ANNOUNCEMENTS);

  // Upkeep schedules and completion history remain local until Supabase is connected.
  const [allUpkeepTasks, setAllUpkeepTasks] =
    useState(DEMO_UPKEEP_TASKS);

  const [allUpkeepHistory, setAllUpkeepHistory] =
    useState([]);

  // Account metadata is local for now; authentication remains a later Supabase step.
  const [allUsers, setAllUsers] =
    useState(DEMO_USERS);

  const [moreView, setMoreView] =
    useState("community");

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
      ? allUpkeepTasks
      : allUpkeepTasks.filter(
        (task) =>
          task.areaCode === activeAreaCode,
      );

  const upkeepHistory =
    activeAreaCode === ALL_AREAS_CODE
      ? allUpkeepHistory
      : allUpkeepHistory.filter(
        (entry) =>
          entry.areaCode === activeAreaCode,
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
    if (authenticatedProfile) {
      return;
    }
    const nextProfile = DEMO_PROFILES.find(
      (item) => item.id === profileId,
    );

    if (!nextProfile) {
      return;
    }

    // Every demo user starts in an area and tab permitted for their role.
    setDemoProfile(nextProfile);
    setActiveAreaCode(
      getDefaultAreaCode(nextProfile),
    );
    setActiveTab(getDefaultTab(nextProfile));
    setSelectedIssueId(null);
    setMoreView("community");

    setToast(
      `Demo switched to ${nextProfile.label}.`,
    );
  };

  const handleAreaChange = (areaCode) => {
    // An issue detail from one area must not remain open in another context.
    setActiveAreaCode(areaCode);
    setSelectedIssueId(null);
    setMoreView("community");
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSelectedIssueId(null);

    // More always opens at its family/community landing page.
    if (tabId === "more") {
      setMoreView("community");
    }
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

  const handleUpkeepSave = async (formData) => {
    if (!canManageUpkeep(profile)) {
      setToast(
        "You do not have permission to manage upkeep.",
      );

      return;
    }

    const taskArea = getAreaByCode(
      formData.areaCode,
    );

    if (
      !taskArea ||
      formData.areaCode === ALL_AREAS_CODE
    ) {
      setToast(
        "Choose a valid area for this upkeep schedule.",
      );

      return;
    }

    const timestamp = new Date().toISOString();

    if (formData.id) {
      setAllUpkeepTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === formData.id
            ? {
              ...task,
              areaCode: formData.areaCode,
              title: formData.title,
              icon: formData.icon,
              frequency: formData.frequency,
              nextDue: formData.nextDue,
              updatedAt: timestamp,
            }
            : task,
        ),
      );

      setToast("Upkeep schedule updated.");
      return;
    }

    const newTask = {
      id: createId(),
      areaCode: formData.areaCode,
      title: formData.title,
      icon: formData.icon,
      frequency: formData.frequency,
      nextDue: formData.nextDue,
      lastCompletedAt: null,
      isActive: true,
      createdBy: profile.fullName,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setAllUpkeepTasks((currentTasks) => [
      newTask,
      ...currentTasks,
    ]);

    setToast(
      `Upkeep schedule created for ${taskArea.name}.`,
    );
  };

  const handleUpkeepComplete = async (
    taskId,
    note,
  ) => {
    if (!canManageUpkeep(profile)) {
      setToast(
        "You do not have permission to complete upkeep tasks.",
      );

      return;
    }

    const task = allUpkeepTasks.find(
      (item) => item.id === taskId,
    );

    if (!task) {
      setToast("Upkeep task was not found.");
      return;
    }

    const timestamp = new Date().toISOString();

    const nextDue =
      calculateNextDue(
        timestamp,
        task.frequency,
      ) ?? task.nextDue;

    setAllUpkeepTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === taskId
          ? {
            ...currentTask,
            lastCompletedAt: timestamp,
            nextDue,
            updatedAt: timestamp,
          }
          : currentTask,
      ),
    );

    const historyEntry = {
      id: createId(),
      taskId: task.id,
      taskTitle: task.title,
      areaCode: task.areaCode,
      completedBy: profile.fullName,
      completedAt: timestamp,
      note,
    };

    setAllUpkeepHistory((currentHistory) => [
      historyEntry,
      ...currentHistory,
    ]);

    setToast(`${task.title} marked complete.`);
  };

  const handleUserCreate = async (formData) => {
    const villaAdminCreatingResident =
      isVillaAdmin(profile) &&
      formData.role === USER_ROLES.RESIDENT &&
      formData.homeAreaCode === profile.homeAreaCode;

    const ownerCreatingManagedAccount =
      isOwnerAdmin(profile) &&
      [
        USER_ROLES.VILLA_ADMIN,
        USER_ROLES.UPKEEP_MANAGER,
      ].includes(formData.role);

    if (
      !villaAdminCreatingResident &&
      !ownerCreatingManagedAccount
    ) {
      setToast(
        "You do not have permission to create this account.",
      );

      return false;
    }

    if (
      formData.role === USER_ROLES.VILLA_ADMIN &&
      !getAreaByCode(formData.homeAreaCode)
    ) {
      setToast("Choose a valid villa.");
      return false;
    }

    const duplicateIdentity = allUsers.some(
      (user) =>
        (formData.phone &&
          user.phone === formData.phone) ||
        (formData.employeeId &&
          user.employeeId === formData.employeeId),
    );

    if (duplicateIdentity) {
      setToast(
        "An account with this phone or employee ID already exists.",
      );

      return false;
    }

    const newUser = {
      id: createId(),
      fullName: formData.fullName,
      phone: formData.phone,
      employeeId: formData.employeeId,
      role: formData.role,
      homeAreaCode: formData.homeAreaCode,
      mustChangePassword: true,
      isActive: true,
    };

    // The temporary password is intentionally not stored in frontend account state.
    setAllUsers((currentUsers) => [
      newUser,
      ...currentUsers,
    ]);

    setToast(
      `${newUser.fullName}'s account was created.`,
    );

    return true;
  };

  const handleUserPasswordReset = async (
    userId,
    temporaryPassword,
  ) => {
    const targetUser = allUsers.find(
      (user) => user.id === userId,
    );

    if (
      !targetUser ||
      !canManageUser(profile, targetUser)
    ) {
      setToast(
        "You do not have permission to reset this account.",
      );

      return false;
    }

    if (temporaryPassword.length < 6) {
      setToast(
        "Temporary password must have at least 6 characters.",
      );

      return false;
    }

    // The real implementation will send this password to a protected Edge Function.
    setAllUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? {
            ...user,
            mustChangePassword: true,
          }
          : user,
      ),
    );

    setToast(
      `Temporary password reset for ${targetUser.fullName}.`,
    );

    return true;
  };

  const handleUserActiveChange = async (
    userId,
    isActive,
  ) => {
    const targetUser = allUsers.find(
      (user) => user.id === userId,
    );

    if (
      !targetUser ||
      !canManageUser(profile, targetUser)
    ) {
      setToast(
        "You do not have permission to change this account.",
      );

      return false;
    }

    setAllUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? {
            ...user,
            isActive,
          }
          : user,
      ),
    );

    setToast(
      `${targetUser.fullName} ${isActive ? "reactivated" : "deactivated"
      }.`,
    );

    return true;
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

    if (activeTab === "upkeep") {
      return (
        <UpkeepPage
          profile={profile}
          activeArea={activeArea}
          tasks={upkeepTasks}
          history={upkeepHistory}
          onSaveTask={handleUpkeepSave}
          onCompleteTask={handleUpkeepComplete}
        />
      );
    }

    if (
      activeTab === "more" &&
      canViewCommunity(profile)
    ) {
      if (moreView === "accounts") {
        return (
          <AccountManagementPage
            profile={profile}
            users={allUsers}
            onBack={() =>
              setMoreView("community")
            }
            onCreateUser={handleUserCreate}
            onResetPassword={
              handleUserPasswordReset
            }
            onSetUserActive={
              handleUserActiveChange
            }
          />
        );
      }

      return (
        <CommunityPage
          // Changing areas resets unfinished announcement form state.
          key={activeAreaCode}
          profile={profile}
          activeArea={activeArea}
          announcements={announcements}
          onPostAnnouncement={handleAnnouncementPost}
          onOpenAccountManagement={() =>
            setMoreView("accounts")
          }
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
        onSignOut={onSignOut}
      >
        {renderPage()}
      </AppShell>

      <Toast message={toast} />

      {/* Local-only helper for testing every role without editing App.jsx. */}
      {!authenticatedProfile && (
        <DevRoleSwitcher
          activeProfileId={profile.id}
          onProfileChange={handleProfileChange}
        />
      )}
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