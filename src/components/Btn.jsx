import { THEME } from "../constants/theme";

const BUTTON_VARIANTS = {
  primary: {
    background: THEME.green,
    color: "#F7F5EE",
  },
  ghost: {
    background: "transparent",
    color: THEME.green,
    border: `1.5px solid ${THEME.green}`,
  },
  brass: {
    background: THEME.brass,
    color: "#FFFFFF",
  },
  quiet: {
    background: THEME.greenSoft,
    color: THEME.green,
  },
};

function Btn({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  style = {},
}) {
  // Keeping button styles here avoids copying the same inline styles to every page.
  const baseStyle = {
    width: "100%",
    padding: "14px 20px",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "transform 120ms ease, opacity 120ms ease",
  };

  const variantStyle =
    BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...baseStyle,
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default Btn;