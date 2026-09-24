export const GoBackSvg: React.FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width={8}
    height={14}
    fill='none'
  >
    <g>
      <path
        fill='#222'
        fillRule='evenodd'
        d='M7.707.293a1 1 0 0 1 0 1.414L2.414 7l5.293 5.293a1 1 0 1 1-1.414 1.414l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 0Z'
        clipRule='evenodd'
      />
    </g>
    <defs>
      <clipPath id='a'>
        <path
          fill='#fff'
          d='M0 0h8v14H0z'
        />
      </clipPath>
    </defs>
  </svg>
);
