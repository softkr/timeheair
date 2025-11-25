import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  className = '',
  showText = true
}) => {
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, fontSize: 16 };
      case 'medium':
        return { width: 64, height: 64, fontSize: 24 };
      case 'large':
        return { width: 120, height: 120, fontSize: 32 };
      default:
        return { width: 64, height: 64, fontSize: 24 };
    }
  };

  const { width, height, fontSize } = getSizeConfig();

  return (
    <div className={`logo-container ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-icon"
      >
        {/* Definitions for reusable gradients */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }}></stop>
            <stop offset="100%" style={{ stopColor: '#AA8A26', stopOpacity: 1 }}></stop>
          </linearGradient>
        </defs>

        {/* Outer Clock Ring (Stylized Hair Strand) */}
        <circle
          cx="100"
          cy="100"
          r="90"
          stroke="url(#goldGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="450"
          strokeDashoffset="50"
          transform="rotate(-90 100 100)"
        ></circle>

        {/* Clock Hands / Scissors Logic */}
        <g transform="translate(100, 100)">
          {/* Minute Hand (Scissor Blade Long) - Pointing at 12 */}
          <g transform="rotate(-15)">
            <path d="M-4 0 L-2 -65 Q0 -75 2 -65 L4 0 Z" fill="#1F2937"></path> {/* Blade */}
            <circle cx="0" cy="12" r="8" stroke="#1F2937" strokeWidth="3" fill="none"></circle> {/* Handle */}
          </g>

          {/* Hour Hand (Scissor Blade Short) - Pointing at 2 */}
          <g transform="rotate(45)">
            <path d="M-4 0 L-2 -45 Q0 -52 2 -45 L4 0 Z" fill="#1F2937"></path> {/* Blade */}
            <circle cx="0" cy="12" r="8" stroke="#1F2937" strokeWidth="3" fill="none"></circle> {/* Handle */}
          </g>

          {/* Center Pivot (Screw) */}
          <circle cx="0" cy="0" r="4" fill="url(#goldGradient)" stroke="white" strokeWidth="1"></circle>
        </g>

        {/* Text Label */}
        {showText && (
          <text
            x="100"
            y="150"
            textAnchor="middle"
            fontFamily="sans-serif"
            fontWeight="bold"
            fontSize={`${fontSize * 0.5}px`}
            fill="#1F2937"
            letterSpacing="2"
          >
            TIME HAIR
          </text>
        )}
      </svg>
    </div>
  );
};

export default Logo;
