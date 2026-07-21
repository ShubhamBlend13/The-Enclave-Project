import { useState } from "react";

import Btn from "../components/Btn";
import Field from "../components/Field";
import PasswordInput from "../components/PasswordInput";
import { THEME } from "../constants/theme";

const INPUT_STYLE = {
  width: "100%",
  padding: "13px 14px",
  border: `1.5px solid ${THEME.line}`,
  borderRadius: 12,
  background: THEME.card,
  color: THEME.ink,
  fontSize: 16,
};

function ChangePasswordPage({
  profile,
  onChangePassword,
  onSignOut,
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    password.length >= 8 &&
    confirmation.length >= 8 &&
    !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    if (!canSubmit) {
      setError(
        "Use a password with at least 8 characters.",
      );
      return;
    }

    setSubmitting(true);

    try {
      await onChangePassword(password);
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "The password could not be changed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 20px",
        background: THEME.bg,
      }}
    >
      <section
        style={{
          maxWidth: 430,
          margin: "0 auto",
          padding: 20,
          border: `1px solid ${THEME.line}`,
          borderRadius: 18,
          background: THEME.card,
        }}
      >
        <div
          style={{
            marginBottom: 6,
            color: THEME.brass,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          First login
        </div>

        <h1
          style={{
            margin: "0 0 8px",
            color: THEME.ink,
            fontFamily: "'Marcellus', serif",
            fontSize: 28,
            fontWeight: 400,
          }}
        >
          Create your password
        </h1>

        <p
          style={{
            margin: "0 0 22px",
            color: THEME.mute,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Welcome, {profile.fullName}. Replace the
          temporary password before entering the app.
        </p>

        <form onSubmit={handleSubmit}>
          <Field label="New password">
            <PasswordInput
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter a new password"
              autoComplete="new-password"
              style={INPUT_STYLE}
            />
          </Field>

          <Field label="Confirm new password">
            <PasswordInput
              value={confirmation}
              onChange={(event) =>
                setConfirmation(event.target.value)
              }
              placeholder="Enter the password again"
              autoComplete="new-password"
              style={INPUT_STYLE}
            />
          </Field>

          {error && (
            <div
              role="alert"
              style={{
                marginBottom: 15,
                padding: "10px 12px",
                borderRadius: 10,
                background: "#F7E6E0",
                color: THEME.red,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <Btn
            type="submit"
            disabled={!canSubmit}
          >
            {submitting
              ? "Updating..."
              : "Set password and continue"}
          </Btn>

          <Btn
            variant="ghost"
            onClick={onSignOut}
            style={{
              marginTop: 10,
            }}
          >
            Sign out
          </Btn>
        </form>
      </section>
    </main>
  );
}

export default ChangePasswordPage;