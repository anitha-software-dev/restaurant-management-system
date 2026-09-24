import { useDispatch as useDispatchRedux, useSelector as useSelectorRedux } from 'react-redux';
import { useNavigate as useNavigateRedux } from 'react-router-dom';
import { useLocation as useLocationRedux } from 'react-router-dom';

import { Action } from 'redux';
import { RootState } from '../store';
import { ThunkDispatch } from 'redux-thunk';


// UI hooks
import { useThemeColor } from './useThemeColor';
import { useActiveOrder } from "./useActiveOrder"
import { useRestaurantConfig } from "./useRestaurantConfig"
import { useOrderNavigation } from "./useOrderNavigation"
import { useCart } from "./useCart"
import { useWindowSize } from './useWindowSize';

export const useNavigate = () => useNavigateRedux();
export const useDispatch = () =>
  useDispatchRedux<ThunkDispatch<RootState, void, Action>>();
export const useLocation = () => useLocationRedux();
export const useSelector = <TSelected = unknown,>(
  selector: (state: RootState) => TSelected,
  equalityFn?: (left: TSelected, right: TSelected) => boolean,
) => useSelectorRedux<RootState, TSelected>(selector, equalityFn);

export const hooks = {

  useNavigate,
  useDispatch,
  useLocation,
  useSelector,

  useThemeColor,
  useActiveOrder,
  useRestaurantConfig,
  useOrderNavigation,
  useCart,
  useWindowSize
};
