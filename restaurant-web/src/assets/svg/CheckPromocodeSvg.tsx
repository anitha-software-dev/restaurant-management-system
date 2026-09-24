import * as React from 'react';

export const CheckPromocodeSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={30}
      height={30}
      fill='none'
    >
      <rect
        width={30}
        height={30}
        fill='#15C7FF'
        rx={15}
      />
      <g clipPath='url(#a)'>
        <path
          stroke='#fff'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M20.333 10 13 17.333 9.667 14'
        />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M8 9h14v10H8z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
