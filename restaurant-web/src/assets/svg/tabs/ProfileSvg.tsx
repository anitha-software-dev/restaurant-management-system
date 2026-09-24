import * as React from 'react';
import {useSelector} from 'react-redux';

import {RootState} from '../../../store';

export const ProfileSvg: React.FC = () => {
  const currentTabScreen = useSelector(
    (state: RootState) => state.tabSlice.screen,
  );

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={32}
      height={32}
      fill='none'
    >
      <circle
        cx={16}
        cy={16}
        r={16}
        fill={currentTabScreen === 'Profile' ? '#FCC55E' : 'transparent'}
      />
      <g>
        <path
          fill={currentTabScreen === 'Profile' ? '#1E2538' : '#666E84'}
          d='M23.778 8.222A10.928 10.928 0 0 0 16 5c-2.938 0-5.7 1.144-7.778 3.222A10.928 10.928 0 0 0 5 16c0 2.938 1.144 5.7 3.222 7.778A10.928 10.928 0 0 0 16 27c2.938 0 5.7-1.144 7.778-3.222A10.928 10.928 0 0 0 27 16c0-2.938-1.144-5.7-3.222-7.778ZM10.515 24.009A5.554 5.554 0 0 1 16 19.406a5.554 5.554 0 0 1 5.485 4.603A9.656 9.656 0 0 1 16 25.71a9.656 9.656 0 0 1-5.485-1.702Zm1.987-9.39A3.501 3.501 0 0 1 16 11.122a3.502 3.502 0 0 1 3.498 3.497A3.502 3.502 0 0 1 16 18.117a3.502 3.502 0 0 1-3.498-3.498Zm10.1 8.496a6.85 6.85 0 0 0-2.002-3.226 6.851 6.851 0 0 0-1.992-1.258 4.786 4.786 0 0 0 2.179-4.012A4.792 4.792 0 0 0 16 9.833a4.792 4.792 0 0 0-4.787 4.786c0 1.678.869 3.157 2.179 4.012-.725.298-1.4.721-1.992 1.258a6.853 6.853 0 0 0-2.002 3.226A9.686 9.686 0 0 1 6.29 16c0-5.355 4.356-9.71 9.711-9.71s9.71 4.355 9.71 9.71a9.687 9.687 0 0 1-3.108 7.115Z'
        />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M5 5h22v22H5z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
