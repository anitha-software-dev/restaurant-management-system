import * as React from 'react';
import {useSelector} from 'react-redux';

import {RootState} from '../../../store';

export const WishlistSvg: React.FC = () => {
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
        fill={currentTabScreen === 'Wishlist' ? '#FCC55E' : 'transparent'}
      />
      <path
        stroke={currentTabScreen === 'Wishlist' ? '#1E2538' : '#666E84'}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M24.103 9.226a5.042 5.042 0 0 0-7.131 0l-.972.971-.972-.971a5.043 5.043 0 1 0-7.131 7.132l.971.971L16 24.461l7.132-7.132.971-.971a5.042 5.042 0 0 0 0-7.132v0Z'
      />
    </svg>
  );
};
