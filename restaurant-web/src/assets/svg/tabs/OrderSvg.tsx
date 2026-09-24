import * as React from 'react';
import {useSelector} from 'react-redux';

import {RootState} from '../../../store';

export const OrderSvg: React.FC = () => {
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
        fill={currentTabScreen === 'Order' ? '#FCC55E' : 'transparent'}
      />
      <g fill={currentTabScreen === 'Order' ? '#1E2538' : '#666E84'}>
        <path d='M8.892 24.785c.079.277.332.468.62.468h12.976c.288 0 .54-.191.62-.468l2.444-8.556H6.447l2.445 8.556Zm10.06-2.861.645-3.867a.644.644 0 1 1 1.271.212l-.644 3.867a.645.645 0 0 1-1.272-.212Zm-3.597-3.761a.645.645 0 1 1 1.29 0v3.867a.645.645 0 1 1-1.29 0v-3.867Zm-3.65-.636a.645.645 0 0 1 .741.53l.645 3.867a.645.645 0 1 1-1.272.212l-.644-3.867a.644.644 0 0 1 .53-.742ZM26.355 12.362h-2.268l-4.963-6.203a.645.645 0 0 0-1.006.805l4.318 5.398H9.564l4.318-5.398a.645.645 0 0 0-1.006-.805l-4.963 6.203H5.645a.645.645 0 0 0-.645.645v1.289c0 .356.289.644.645.644h20.71a.645.645 0 0 0 .645-.644v-1.29a.645.645 0 0 0-.645-.644Z' />
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
