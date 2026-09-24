import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Menu, Items } from '../../types/shopType';

export interface MenuState {
  menus: Menu[];
  allItems: Items[];
  taxes: any[];
  activeOrder: any | null;
  lastFetched: number | null;
}

const initialState: MenuState = {
  menus: [],
  allItems: [],
  taxes: [],
  activeOrder: null,
  lastFetched: null,
};

export const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setMenus: (state, action: PayloadAction<Menu[]>) => {
      state.menus = action.payload;
    },
    setAllItems: (state, action: PayloadAction<Items[]>) => {
      state.allItems = action.payload;
      state.lastFetched = Date.now();
    },
    setTaxes: (state, action: PayloadAction<any[]>) => {
      state.taxes = action.payload;
    },
    setActiveOrder: (state, action: PayloadAction<any>) => {
      state.activeOrder = action.payload;
    },
    resetMenuCache: (state) => {
      state.menus = [];
      state.allItems = [];
      state.taxes = [];
      state.activeOrder = null;
      state.lastFetched = null;
    },
  },
});

export const { setMenus, setAllItems, setTaxes, setActiveOrder, resetMenuCache } = menuSlice.actions;

export default menuSlice.reducer;
