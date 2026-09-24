import * as React from 'react';
import {useSelector} from 'react-redux';

import {RootState} from '../../store';

export const MailSvg: React.FC = () => {
  const {emailVerified} = useSelector(
    (state: RootState) => state.verificationSlice,
  );

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={40}
      height={40}
      fill='none'
    >
      <rect
        width={40}
        height={40}
        fill='#FFF2F5'
        rx={20}
      />
      <path
        stroke={'#FF4768'}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M13.333 13.333h13.334c.916 0 1.666.75 1.666 1.667v10c0 .917-.75 1.667-1.666 1.667H13.333c-.916 0-1.666-.75-1.666-1.667V15c0-.917.75-1.667 1.666-1.667Z'
      />
      <path
        stroke={'#FF4768'}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M28.333 15 20 20.833 11.667 15'
      />
    </svg>
  );
};
