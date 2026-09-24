import * as React from 'react';

export const StarSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={10}
      height={10}
      fill='none'
    >
      <path
        fill='#FFC700'
        d='m5 .833 1.287 2.609 2.88.42-2.084 2.03.492 2.866L5 7.404 2.425 8.758l.492-2.866-2.084-2.03 2.88-.42L5 .833Z'
      />
    </svg>
  );
};
