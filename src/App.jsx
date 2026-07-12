import { AREAS } from "./constants/areas";
import { USER_ROLES } from "./constants/roles";
import { THEME } from "./constants/theme";

function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        maxWidth: 480,
        margin: "0 auto",
        padding: 24,
        background: THEME.bg,
      }}
    >
      <p
        style={{
          margin: 0,
          color: THEME.brass,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 2.5,
        }}
      >
        THE ENCLAVE
      </p>

      <h1
        style={{
          marginTop: 8,
          fontFamily: "'Marcellus', serif",
          color: THEME.ink,
          fontWeight: 400,
        }}
      >
        Core application setup
      </h1>

      <p style={{ color: THEME.mute }}>
        Areas: {AREAS.map((area) => area.code).join(", ")}
      </p>

      <p style={{ color: THEME.mute }}>
        Roles: {Object.values(USER_ROLES).join(", ")}
      </p>
    </main>
  );
}

export default App;