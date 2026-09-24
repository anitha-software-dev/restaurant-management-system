import {createSlice} from '@reduxjs/toolkit';

export type TabState = {
  screen: string;
};

const initialState: TabState = {
  screen: 'Home',
};

export const tabSlice = createSlice({
  name: 'tab',
  initialState,
  reducers: {
    setScreen: (state, action) => {
      state.screen = action.payload;
    },
  },
});

export const {setScreen} = tabSlice.actions;
