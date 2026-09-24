import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export type VerificationState = {
  phoneVerified: boolean;
  emailVerified: boolean;
};

const initialState: VerificationState = {
  phoneVerified: false,
  emailVerified: false,
};

export const verificationSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setPhoneVerified: (state, action: PayloadAction<boolean>) => {
      state.phoneVerified = action.payload;
    },
    setEmailVerified: (state, action: PayloadAction<boolean>) => {
      state.emailVerified = action.payload;
    },
  },
});

export const {setPhoneVerified, setEmailVerified} = verificationSlice.actions;
