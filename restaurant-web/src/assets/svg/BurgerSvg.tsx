
import * as React from 'react';

export const BurgerSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={25}
      height={18}
      fill='none'
      viewBox='0 0 25 18'
    >
      <g
        stroke='#A9A9A9'
        strokeLinecap='round'
        strokeWidth={2}
      >

        <path d='M1 2h23' />

        <path d='M4 9h17' />

        <path d='M1 16h23' />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M0 0h25v12H0z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
