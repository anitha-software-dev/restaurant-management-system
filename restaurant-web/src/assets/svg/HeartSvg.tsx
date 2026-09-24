import * as React from 'react';
import {useSelector} from 'react-redux';

import {RootState} from '../../store';
import {ProductType} from '../../types';

type Props = {
  product: ProductType;
  style?: React.CSSProperties;
};

export const HeartSvg: React.FC<Props> = ({product, style}) => {
  const wishlist = useSelector((state: RootState) => state.wishlistSlice);

  const ifInWishlist = wishlist.list.find((item) => item.id === product.id);

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={30}
      height={30}
      fill='none'
    >
      <circle
        cx={15}
        cy={15}
        r={15}
        fill='#fff'
      />
      <path
        fill={ifInWishlist ? 'var(--main-color)' : 'transparent'}
        stroke='var(--main-color)'
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M19.788 10.935a2.979 2.979 0 0 0-4.214 0L15 11.51l-.574-.574a2.98 2.98 0 1 0-4.215 4.214l.575.575L15 19.938l4.214-4.214.574-.575a2.978 2.978 0 0 0 0-4.214v0Z'
      />
    </svg>
  );
};
