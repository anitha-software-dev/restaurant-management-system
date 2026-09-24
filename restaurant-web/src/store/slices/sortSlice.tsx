import {createSlice} from '@reduxjs/toolkit';

export type SortState = {
  sort: string;
};

const initialState: SortState = {
  sort: 'Newest',
};

export const sortSlice = createSlice({
  name: 'sort',
  initialState,
  reducers: {
    setSort: (state, action) => {
      state.sort = action.payload;
    },
  },
});

export const {setSort} = sortSlice.actions;
