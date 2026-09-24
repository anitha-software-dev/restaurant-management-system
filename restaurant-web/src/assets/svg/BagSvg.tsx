import * as React from 'react';

export const BagSvg: React.FC = () => {
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
        r={15}
        fill='#1E2538'
      />
      <path
        fill='#fff'
        d='M15.726 15.707V19h-1.423v-3.293H11v-1.414h3.303V11h1.423v3.293H19v1.414h-3.274Z'
      />
    </svg>
  );
};
