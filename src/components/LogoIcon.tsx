import React, { forwardRef } from 'react';

interface LogoIconProps {
  className?: string;
}

const LogoIcon = forwardRef<SVGSVGElement, LogoIconProps>(({ className }, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 11.41 13.92"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M6.26 0c2.84,0 5.15,2.3 5.15,5.15 0,2.84 -2.31,5.15 -5.15,5.15l-0.59 0c-0.58,0 -1.08,0.18 -1.53,0.54l-3.7 3.02c-0.08,0.07 -0.19,0.08 -0.29,0.03 -0.1,-0.05 -0.15,-0.14 -0.15,-0.24l0 -13.38c0,-0.15 0.12,-0.27 0.27,-0.27l5.99 0z"/>
    </svg>
  );
});

LogoIcon.displayName = 'LogoIcon';

export default LogoIcon;
