import './Button.styles.css';

// We destructure the props right in the function arguments
export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', // default to primary
  size = 'md',         // default to medium
  disabled = false 
}) {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}