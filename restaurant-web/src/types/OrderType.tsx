import {ProductType} from './ProductType';

export type OrderType = {
  id: number;
  date: string;
  status: 'shipping' | 'pending' | 'delivered' | 'canceled';
  total: number;
  products: ProductType[];
};
