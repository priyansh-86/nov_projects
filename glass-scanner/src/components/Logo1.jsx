// Isko ek naya file bana lo: src/components/Logo1.jsx

const Logo1 = ({ className = "w-10 h-10", color = "currentColor" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Soft outer brackets */}
    <path 
      d="M8 3H7C4.79086 3 3 4.79086 3 7V8M3 16V17C3 19.2091 4.79086 21 7 21H8M16 21H17C19.2091 21 21 19.2091 21 17V16M21 8V7C21 4.79086 19.2091 3 17 3H16" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Cute central focal point */}
    <circle cx="12" cy="12" r="3" fill={color} />
  </svg>
);

export default Logo1;