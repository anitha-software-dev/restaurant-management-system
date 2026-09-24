import * as React from 'react';

export const CardSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={30}
      height={30}
      fill='none'
    >
      <path
        fill='#D7BB7B'
        d='M30 15c0 8.284-6.716 15-15 15-8.284 0-15-6.716-15-15C0 6.716 6.716 0 15 0c8.284 0 15 6.716 15 15Z'
      />
      <path
        fill='#fff'
        fillRule='evenodd'
        d='M6 20.25a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 24 20.25V9.75a2.25 2.25 0 0 0-2.25-2.25H8.25A2.25 2.25 0 0 0 6 9.75v10.5Zm2.25.75a.75.75 0 0 1-.75-.75V13.5h15v6.75a.75.75 0 0 1-.75.75H8.25Zm14.25-9V9.75a.75.75 0 0 0-.75-.75H8.25a.75.75 0 0 0-.75.75V12h15Zm-12 4.5V18h3v-1.5h-3Z'
        clipRule='evenodd'
      />
    </svg>
  );
};
