function Chip({ children, color, background }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        background,
        color,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.4,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default Chip;