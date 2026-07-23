import "./Button.styles.css";

export default function Button({
  children,
  onClick,
  variant = "primary", // default to primary
  size = "md", // default to medium
  disabled = false,
  style,
  className = "",
  ...props // Catches any extra attributes (like type, title, etc.)
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}
