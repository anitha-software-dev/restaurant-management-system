import * as React from 'react';

export const PhoneVerifiedSvg: React.FC = () => {
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
        d='M24.167 11.667h-8.334c-.92 0-1.666.746-1.666 1.666v13.334c0 .92.746 1.666 1.666 1.666h8.334c.92 0 1.666-.746 1.666-1.666V13.333c0-.92-.746-1.666-1.666-1.666ZM20 25h.008'
      />
    </svg>
  );
};
