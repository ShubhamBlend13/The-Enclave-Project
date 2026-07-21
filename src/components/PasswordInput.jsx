import { useState } from "react";

import { THEME } from "../constants/theme";

function PasswordInput({
  value,
  onChange,
  style,
  disabled = false,
  ...inputProps
}) {
  const [isVisible, setIsVisible] =
    useState(false);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <input
        {...inputProps}
        type={isVisible ? "text" : "password"}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...style,
          paddingRight: 52,
        }}
      />

      <button
        type="button"
        onClick={() =>
          setIsVisible(
            (currentValue) => !currentValue,
          )
        }
        disabled={disabled}
        aria-label={
          isVisible
            ? "Hide password"
            : "Show password"
        }
        aria-pressed={isVisible}
        title={
          isVisible
            ? "Hide password"
            : "Show password"
        }
        style={{
          position: "absolute",
          top: 0,
          right: 4,
          display: "grid",
          width: 44,
          height: "100%",
          padding: 0,
          border: "none",
          background: "transparent",
          color: THEME.mute,
          cursor: disabled
            ? "not-allowed"
            : "pointer",
          placeItems: "center",
        }}
      >
        {isVisible ? (
          <EyeOffIcon />
        ) : (
          <EyeIcon />
        )}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.7"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M10.6 6.1A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16.2 16.2 0 0 1-3 3.6M6.1 6.2A16.9 16.9 0 0 0 2.5 12s3.5 6 9.5 6a10.4 10.4 0 0 0 4.1-.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default PasswordInput;