import { THEME } from "../constants/theme";

function Field({ label, children }) {
  return (
    <div
      style={{
        marginBottom: 18,
      }}
    >
      <div
        style={{
          marginBottom: 7,
          color: THEME.mute,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      {children}
    </div>
  );
}

export default Field;