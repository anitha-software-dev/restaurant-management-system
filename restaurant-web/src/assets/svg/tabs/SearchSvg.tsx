import * as React from 'react';
import {useSelector} from 'react-redux';

import {RootState} from '../../../store';

export const SearchSvg: React.FC = () => {
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
        fill={currentTabScreen === 'Search' ? '#FCC55E' : 'transparent'}
      />
      <path
        fill={currentTabScreen === 'Search' ? '#1E2538' : '#666E84'}
        fillRule='evenodd'
        d='M15.083 8.438a6.646 6.646 0 1 0 0 13.291 6.646 6.646 0 0 0 0-13.291Zm-8.02 6.645a8.02 8.02 0 1 1 16.041 0 8.02 8.02 0 0 1-16.041 0Z'
        clipRule='evenodd'
      />
      <path
        fill={currentTabScreen === 'Search' ? '#1E2538' : '#666E84'}
        fillRule='evenodd'
        d='M19.614 19.614a.917.917 0 0 1 1.297 0l3.987 3.988a.917.917 0 1 1-1.296 1.296l-3.988-3.987a.917.917 0 0 1 0-1.297Z'
        clipRule='evenodd'
      />
    </svg>
  );
};
