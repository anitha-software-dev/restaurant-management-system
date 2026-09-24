import * as React from 'react';

export const EmailVerifiedSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={40}
      height={40}
      fill='none'
    >
      <rect
        width={40}
        height={40}
        fill='#F5FAFB'
        rx={20}
      />
      <path
        stroke='#1E2538'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M13.333 13.333h13.334c.916 0 1.666.75 1.666 1.667v10c0 .917-.75 1.667-1.666 1.667H13.333c-.916 0-1.666-.75-1.666-1.667V15c0-.917.75-1.667 1.666-1.667Z'
      />
      <path
        stroke='#1E2538'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M28.333 15 20 20.833 11.667 15'
      />
    </svg>
  );
};
