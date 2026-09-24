import * as React from 'react';
import {useSelector} from 'react-redux';

import {RootState} from '../../../store';

export const HomeSvg: React.FC = () => {
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
        fill={currentTabScreen === 'Home' ? '#FCC55E' : 'transparent'}
      />
      <g>
        <path
          fill={currentTabScreen === 'Home' ? '#1E2538' : '#666E84'}
          d='m26.45 14.526-.002-.002-8.974-8.974a2.011 2.011 0 0 0-1.432-.593c-.541 0-1.05.21-1.432.593l-8.97 8.97a2.028 2.028 0 0 0-.005 2.87 2.014 2.014 0 0 0 1.406.593H7.4v6.604a2.373 2.373 0 0 0 2.37 2.37h3.511a.645.645 0 0 0 .645-.645v-5.177c0-.597.485-1.082 1.082-1.082h2.07c.597 0 1.082.485 1.082 1.082v5.177c0 .356.288.645.644.645h3.511a2.373 2.373 0 0 0 2.37-2.37v-6.604h.332a2.028 2.028 0 0 0 1.433-3.457Zm-.913 1.952a.732.732 0 0 1-.52.216h-.977a.644.644 0 0 0-.644.644v7.249c0 .596-.485 1.081-1.082 1.081h-2.866v-4.533a2.373 2.373 0 0 0-2.37-2.37h-2.071a2.373 2.373 0 0 0-2.371 2.37v4.533H9.769a1.083 1.083 0 0 1-1.081-1.081v-7.249a.644.644 0 0 0-.645-.644h-.96a.73.73 0 0 1-.537-.216.737.737 0 0 1 0-1.042h.001l8.974-8.974a.73.73 0 0 1 .52-.216c.197 0 .382.077.521.216l8.972 8.972c.002 0 .003.002.005.004a.738.738 0 0 1-.002 1.04Z'
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
