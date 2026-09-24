import * as React from 'react';

export const InWishlistSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={30}
      height={30}
      fill='none'
    >
      <circle
        cx={15}
        cy={15}
        r={14.5}
        stroke='#D7BB7B'
        strokeOpacity={0.35}
      />
      <g>
        <path
          fill='#F4303C'
          stroke='#F4303C'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.2}
          d='M20.692 11.241a3.54 3.54 0 0 0-5.01 0l-.682.683-.683-.683a3.542 3.542 0 1 0-5.01 5.01l.683.683 5.01 5.01 5.01-5.01.682-.683a3.541 3.541 0 0 0 0-5.01Z'
        />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M7.273 7.273h15.454v15.454H7.273z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
