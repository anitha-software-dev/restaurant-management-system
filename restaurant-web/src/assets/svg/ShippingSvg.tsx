import * as React from 'react';

export const ShippingSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={48}
      height={48}
      fill='none'
    >
      <path
        fill='#C8C8C8'
        d='M0 24C0 10.745 10.745 0 24 0s24 10.745 24 24-10.745 24-24 24S0 37.255 0 24Z'
      />
      <path
        fill='#fff'
        fillRule='evenodd'
        d='M22.416 33A5 5 0 0 0 27 36a5 5 0 0 0 4.584-3h1.593a3 3 0 0 0 2.824-3v-6.312l-.008-.222a3 3 0 0 0-.624-1.62l-5.378-6.914-.162-.2A5 5 0 0 0 26.044 13H15v2h11.044l.198.006a3 3 0 0 1 2.17 1.152l5.377 6.918.075.111a1 1 0 0 1 .136.5V30l-.006.116A1 1 0 0 1 33 31h-1v-.217A5.001 5.001 0 0 0 22 31h-3v2h3.416ZM24 31a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm-3-6v2h-6v-2h6Zm-9-6v2h6v-2h-6Z'
        clipRule='evenodd'
      />
    </svg>
  );
};
