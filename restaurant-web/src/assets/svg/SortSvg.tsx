import * as React from 'react';

export const SortSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={24}
      height={24}
      fill='none'
      viewBox='0 0 24 24'
    >
      <path
        stroke='black'
        strokeLinecap='round'
        strokeWidth={1.5}
        d='M22 7H2'
      />
      <path
        stroke='black'
        strokeLinecap='round'
        strokeWidth={1.5}
        d='M19 12H5'
        opacity={0.5}
      />
      <path
        stroke='black'
        strokeLinecap='round'
        strokeWidth={1.5}
        d='M16 17H8'
      />
    </svg>
  );
};
