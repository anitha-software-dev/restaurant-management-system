import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

export type FilterState = {
  selectedTags: string[];
  selectedSizes: string[];
  selectedColors: string[];
  selectedRatings: number[];
  selectedAgeGroups: string[];
  selectedPlayTypes: string[];
  selectedCategories: string[];
};

const initialState: FilterState = {
  selectedTags: [],
  selectedSizes: [],
  selectedColors: [],
  selectedRatings: [],
  selectedAgeGroups: [],
  selectedPlayTypes: [],
  selectedCategories: [],
};

export const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setSelectedTags: (state, action: PayloadAction<string[]>) => {
      state.selectedTags = action.payload;
    },
    setSelectedColors: (state, action: PayloadAction<string[]>) => {
      state.selectedColors = action.payload;
    },
    setSelectedSizes: (state, action: PayloadAction<string[]>) => {
      state.selectedSizes = action.payload;
    },
    setSelectedRatings: (state, action: PayloadAction<number[]>) => {
      state.selectedRatings = action.payload;
    },
    setSelectedCategories: (state, action: PayloadAction<string[]>) => {
      state.selectedCategories = action.payload;
    },
    setSelectedAgeGroups: (state, action: PayloadAction<string[]>) => {
      state.selectedAgeGroups = action.payload;
    },
    setSelectedPlayTypes: (state, action: PayloadAction<string[]>) => {
      state.selectedPlayTypes = action.payload;
    },
    resetFilters: (state) => {
      state.selectedTags = [];
      state.selectedSizes = [];
      state.selectedColors = [];
      state.selectedRatings = [];
      state.selectedPlayTypes = [];
      state.selectedAgeGroups = [];
      state.selectedCategories = [];
    },
  },
});

export const {
  resetFilters,
  setSelectedTags,
  setSelectedSizes,
  setSelectedColors,
  setSelectedRatings,
  setSelectedPlayTypes,
  setSelectedAgeGroups,
  setSelectedCategories,
} = filterSlice.actions;
