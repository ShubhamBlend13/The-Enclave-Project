import App from "./App";
import AuthProvider from "./contexts/AuthProvider";
import { THEME } from "./constants/theme";
import { useAuth } from "./hooks/useAuth";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import LoginPage from "./pages/LoginPage";

function AuthenticatedRoot() {
  const {
    session,
    profile,
    loading,
    profileError,
    login,
    logout,
    completePasswordChange,
    retryProfile,
  } = useAuth();

  if (loading) {
    return (
      <AuthMessagePage
        icon="⌂"
        title="Opening The Enclave"
        message="Loading your private community..."
      />
    );
  }

  if (!session) {
    return <LoginPage onLogin={login} />;
  }

  if (profileError || !profile) {
    return (
      <AuthMessagePage
        icon="!"
        title="Profile unavailable"
        message={
          profileError ||
          "Your application profile could not be loaded."
        }
        primaryLabel="Try again"
        onPrimary={retryProfile}
        secondaryLabel="Sign out"
        onSecondary={logout}
      />
    );
  }

  if (!profile.isActive) {
    return (
      <AuthMessagePage
        icon="🔒"
        title="Account inactive"
        message="Your account has been deactivated. Contact your administrator for access."
        primaryLabel="Sign out"
        onPrimary={logout}
      />
    );
  }

  if (profile.mustChangePassword) {
    return (
      <ChangePasswordPage
        profile={profile}
        onChangePassword={
          completePasswordChange
        }
        onSignOut={logout}
      />
    );
  }

  return (
    <App
      authenticatedProfile={profile}
      onSignOut={logout}
    />
  );
}

function AuthMessagePage({
  icon,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <main
      style={{
        display: "grid",
        minHeight: "100vh",
        placeItems: "center",
        padding: 20,
        background: THEME.bg,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 24,
          border: `1px solid ${THEME.line}`,
          borderRadius: 18,
          background: THEME.card,
          textAlign: "center",
        }}
      >
        <div
          style={{
            marginBottom: 10,
            fontSize: 34,
          }}
        >
          {icon}
        </div>

        <h1
          style={{
            margin: "0 0 7px",
            color: THEME.ink,
            fontFamily: "'Marcellus', serif",
            fontSize: 26,
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
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        {primaryLabel && (
          <button
            type="button"
            onClick={onPrimary}
            style={{
              width: "100%",
              marginTop: 20,
              padding: "12px 16px",
              border: "none",
              borderRadius: 12,
              background: THEME.green,
              color: "#FFFFFF",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {primaryLabel}
          </button>
        )}

        {secondaryLabel && (
          <button
            type="button"
            onClick={onSecondary}
            style={{
              marginTop: 12,
              border: "none",
              background: "transparent",
              color: THEME.green,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {secondaryLabel}
          </button>
        )}
      </section>
    </main>
  );
}

function RootApp() {
  return (
    <AuthProvider>
      <AuthenticatedRoot />
    </AuthProvider>
  );
}

export default RootApp;