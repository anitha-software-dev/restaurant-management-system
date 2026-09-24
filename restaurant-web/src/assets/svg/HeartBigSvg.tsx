import * as React from 'react';
import {useSelector} from 'react-redux';

import {RootState} from '../../store';
import {ProductType} from '../../types';

type Props = {
  product: ProductType;
};

export const HeartBigSvg: React.FC<Props> = ({product}) => {
  const wishlist = useSelector((state: RootState) => state.wishlistSlice);

  const ifInWishlist = wishlist.list.find((item) => item.id === product.id);

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={50}
      height={50}
      fill='none'
    >
      <rect
        width={49}
        height={49}
        x={0.5}
        y={0.5}
        stroke='#C8CDD9'
        rx={24.5}
      />
      <path
        fill={ifInWishlist ? 'var(--main-color)' : 'transparent'}
        stroke={ifInWishlist ? 'var(--main-color)' : '#666E84'}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.2}
        d='M32.367 18.842a4.584 4.584 0 0 0-6.484 0l-.883.883-.883-.883a4.584 4.584 0 0 0-6.484 6.483l.884.883L25 32.692l6.483-6.484.884-.883a4.582 4.582 0 0 0 0-6.483Z'
      />
    </svg>
  );
};
