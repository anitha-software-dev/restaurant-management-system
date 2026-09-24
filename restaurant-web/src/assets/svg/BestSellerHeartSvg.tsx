import * as React from 'react';
import {useSelector} from 'react-redux';

import {RootState} from '../../store';
import {ProductType} from '../../types';

type Props = {
  product: ProductType;
  style?: React.CSSProperties;
};

export const BestSellerHeartSvg: React.FC<Props> = ({product}) => {
  const wishlist = useSelector((state: RootState) => state.wishlistSlice);

  const ifInWishlist = wishlist.list.find((item) => item.id === product.id);

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={14}
      height={13}
      fill={ifInWishlist ? 'var(--main-color)' : 'transparent'}
    >
      <g>
        <path
          stroke={ifInWishlist ? 'var(--main-color)' : '#666E84'}
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.2}
          d='M12.172 2.049a3.157 3.157 0 0 0-4.467 0l-.608.608-.609-.608a3.158 3.158 0 1 0-4.466 4.466l.609.609 4.466 4.466 4.466-4.466.609-.609a3.159 3.159 0 0 0 0-4.466v0Z'
        />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M0 0h14v13H0z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
