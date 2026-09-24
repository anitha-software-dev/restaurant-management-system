import {createSlice} from '@reduxjs/toolkit';

export type BGState = {
  color:
    | 'var(--main-background)'
    | 'var(--white-color)'
    | '#f5fafb'
    | '#fff'
    | string;
};

const initialState: BGState = {
  color: 'var(--main-background)',
};

export const bgSlice = createSlice({
  name: 'bg',
  initialState,
  reducers: {
    setColor: (state, action) => {
      state.color = action.payload;
    },
  },
});

export const {setColor} = bgSlice.actions;
