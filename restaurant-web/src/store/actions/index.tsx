import {setColor} from '../slices/bgSlice';
import {setUser} from '../slices/userSlice';
import {setScreen} from '../slices/tabSlice';
import {addToCart} from '../slices/cartSlice';
import {resetCart} from '../slices/cartSlice';
import {setDiscount} from '../slices/cartSlice';
import {setPromoCode} from '../slices/cartSlice';
import {resetFilters} from '../slices/filterSlice';
import {removeFromCart} from '../slices/cartSlice';
import {setSelectedTags} from '../slices/filterSlice';
import {addToWishlist} from '../slices/wishlistSlice';
import {setSelectedSizes} from '../slices/filterSlice';
import {setSelectedColors} from '../slices/filterSlice';
import {setFirstLaunch} from '../slices/firstLaunchSlice';
import {removeFromWishlist} from '../slices/wishlistSlice';
import {setSelectedCategories} from '../slices/filterSlice';
import {setPhoneVerified} from '../slices/verificationSlice';
import {setEmailVerified} from '../slices/verificationSlice';
import {setMenus, setAllItems, setTaxes, setActiveOrder, resetMenuCache} from '../slices/menuSlice';

export const actions = {
  setUser,
  setColor,
  setScreen,
  addToCart,
  resetCart,
  setDiscount,
  resetFilters,
  setPromoCode,
  addToWishlist,
  removeFromCart,
  setFirstLaunch,
  setSelectedTags,
  setPhoneVerified,
  setEmailVerified,
  setSelectedSizes,
  setSelectedColors,
  removeFromWishlist,
  setSelectedCategories,
  setMenus,
  setAllItems,
  setTaxes,
  setActiveOrder,
  resetMenuCache,
};
