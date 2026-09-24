import { configureStore, EnhancedStore } from '@reduxjs/toolkit';

import { BGState } from './slices/bgSlice';
import { TabState } from './slices/tabSlice';
import { CartType } from './slices/cartSlice';
import { SortState } from './slices/sortSlice';
import { FilterState } from './slices/filterSlice';
import { WishlistState } from './slices/wishlistSlice';
import { VerificationState } from './slices/verificationSlice';
import { MenuState } from './slices/menuSlice';

import { bgSlice } from './slices/bgSlice';
import { tabSlice } from './slices/tabSlice';
import { userSlice } from './slices/userSlice';
import { cartSlice } from './slices/cartSlice';
import { sortSlice } from './slices/sortSlice';
import { filterSlice } from './slices/filterSlice';
import { paymentSlice } from './slices/paymentSlice';
import { wishlistSlice } from './slices/wishlistSlice';
import { promocodeSlice } from './slices/promocodeSlice';
import { firstLaunchSlice } from './slices/firstLaunchSlice';
import { verificationSlice } from './slices/verificationSlice';
import { menuSlice } from './slices/menuSlice';

export const store: EnhancedStore = configureStore({
  reducer: {
    bgSlice: bgSlice.reducer,
    tabSlice: tabSlice.reducer,
    userSlice: userSlice.reducer,
    cartSlice: cartSlice.reducer,
    sortSlice: sortSlice.reducer,
    filterSlice: filterSlice.reducer,
    paymentSlice: paymentSlice.reducer,
    wishlistSlice: wishlistSlice.reducer,
    promocodeSlice: promocodeSlice.reducer,
    firstLaunchSlice: firstLaunchSlice.reducer,
    verificationSlice: verificationSlice.reducer,
    menuSlice: menuSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export interface RootState {
  bgSlice: BGState;
  tabSlice: TabState;
  cartSlice: CartType;
  sortSlice: SortState;
  filterSlice: FilterState;
  wishlistSlice: WishlistState;
  verificationSlice: VerificationState;
  menuSlice: MenuState;
}
