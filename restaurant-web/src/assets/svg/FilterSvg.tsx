import * as React from 'react';

export const FilterSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={24}
      height={24}
      fill='none'
      viewBox='0 0 24 24'
    >
      <path
        stroke='#222'
        strokeLinecap='round'
        d='M10 8h10M4 16h10'
      />
      <circle
        cx={7}
        cy={8}
        r={3}
        stroke='#222'
        strokeLinecap='round'
        transform='rotate(90 7 8)'
      />
      <circle
        cx={17}
        cy={16}
        r={3}
        stroke='#222'
        strokeLinecap='round'
        transform='rotate(90 17 16)'
      />
    </svg>
  );
};
