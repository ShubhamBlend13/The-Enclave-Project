import { THEME } from "../constants/theme";

function Toast({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 92,
        left: "50%",
        zIndex: 50,
        width: "calc(100% - 48px)",
        maxWidth: 340,
        padding: "12px 18px",
        borderRadius: 12,
        background: THEME.ink,
        color: "#F2EEE2",
        boxShadow: "0 6px 20px rgba(28, 43, 38, 0.25)",
        fontSize: 13.5,
        fontWeight: 500,
        textAlign: "center",
        transform: "translateX(-50%)",
      }}
    >
      {message}
    </div>
  );
}

export default Toast;