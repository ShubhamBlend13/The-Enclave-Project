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

function LoginPage({ onLogin }) {
  const [identityType, setIdentityType] =
    useState("phone");
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    Boolean(identity.trim()) &&
    Boolean(password) &&
    !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onLogin({
        identityType,
        identity: identity.trim(),
        password,
      });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Login failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const changeIdentityType = (nextType) => {
    setIdentityType(nextType);
    setIdentity("");
    setPassword("");
    setError("");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "42px 20px",
        background: THEME.bg,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 430,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: THEME.brass,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Private community
          </div>

          <h1
            style={{
              margin: "9px 0 5px",
              color: THEME.green,
              fontFamily: "'Marcellus', serif",
              fontSize: 38,
              fontWeight: 400,
            }}
          >
            The Enclave
          </h1>

          <p
            style={{
              margin: 0,
              color: THEME.mute,
              fontSize: 14,
            }}
          >
            Sign in to your home and upkeep portal.
          </p>
        </div>

        <div
          style={{
            padding: 20,
            border: `1px solid ${THEME.line}`,
            borderRadius: 18,
            background: THEME.card,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              marginBottom: 20,
              padding: 4,
              borderRadius: 12,
              background: THEME.greenSoft,
            }}
          >
            <LoginTypeButton
              selected={identityType === "phone"}
              onClick={() =>
                changeIdentityType("phone")
              }
            >
              Family / Villa
            </LoginTypeButton>

            <LoginTypeButton
              selected={
                identityType === "employee"
              }
              onClick={() =>
                changeIdentityType("employee")
              }
            >
              Staff
            </LoginTypeButton>
          </div>

          <form onSubmit={handleSubmit}>
            <Field
              label={
                identityType === "employee"
                  ? "Employee ID"
                  : "Phone number"
              }
            >
              <input
                type={
                  identityType === "employee"
                    ? "text"
                    : "tel"
                }
                value={identity}
                onChange={(event) =>
                  setIdentity(event.target.value)
                }
                placeholder={
                  identityType === "employee"
                    ? "e.g. EMP-001"
                    : "10-digit mobile number"
                }
                autoComplete="username"
                style={INPUT_STYLE}
              />
            </Field>

            <Field label="Password">
              <PasswordInput
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                style={INPUT_STYLE}
              />
            </Field>

            {error && (
              <div
                role="alert"
                style={{
                  margin: "-3px 0 15px",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#F7E6E0",
                  color: THEME.red,
                  fontSize: 13,
                  lineHeight: 1.4,
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
                ? "Signing in..."
                : "Sign in"}
            </Btn>
          </form>
        </div>

        <p
          style={{
            marginTop: 18,
            color: THEME.mute,
            fontSize: 12.5,
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          Forgotten passwords are reset by your
          villa administrator or the owner.
        </p>
      </section>
    </main>
  );
}

function LoginTypeButton({
  selected,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 8px",
        border: "none",
        borderRadius: 9,
        background: selected
          ? THEME.card
          : "transparent",
        color: selected
          ? THEME.green
          : THEME.mute,
        boxShadow: selected
          ? "0 1px 4px rgba(28, 43, 38, 0.10)"
          : "none",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default LoginPage;