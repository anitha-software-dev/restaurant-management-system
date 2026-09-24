import React from 'react';
import { RouterProvider, createBrowserRouter, Route } from 'react-router-dom';
import { screens } from '../screens';


export enum Routes {
  Home = '/:id',
  // Home1 = '/',
  // Menu = '/menu',
  Shop = "/menu/:id",
  Shop2 = '/takeaway/:id',
  Shop1 = '/',
  OrderHistory = '/orders',
  PlacedOrders = '/placed-orders',
  OrderDetails = '/order-details',
  FindOrder = '/find-order',
  ViewOrder = '/view-order/:orderId',
  // Checkout = '/checkout',
  // OrderSuccessful = '/order-successful',
  OrderSuccessful = '/order-successful/:orderId',
  TakeawayMenu = '/takeaway/menu/:id'
}

const stack = createBrowserRouter([
  {
    path: Routes.Home,
    element: <screens.Home />,
  },
  // {
  //   path: Routes.Home1,
  //   element: <screens.Home />,
  // },
  // {
  //   path: Routes.Menu,
  //   element: <screens.Menu />,
  // },
  {
    path: Routes.Shop,
    element: <screens.Shop />,
  },
  {
    path: Routes.Shop1,
    element: <screens.Home />,
  },
  {
    path: Routes.Shop2,
    element: <screens.Home />,
  },
  {
    path: Routes.TakeawayMenu,
    element: <screens.Shop />,
  },
  {
    path: Routes.OrderHistory,
    element: <screens.OrderHistory />,

  },
  // {
  //   path: Routes.PlacedOrders,
  //   element: <screens.PlacedOrders />
  // },
  {
    path: Routes.OrderDetails,
    element: <screens.OrderDetails />
  },
  {
    path: Routes.FindOrder,
    element: <screens.FindOrder />
  },
  {
    path: Routes.ViewOrder,
    element: <screens.ViewOrder />
  },
  {
    path: Routes.OrderDetails + '/:orderId',
    element: <screens.OrderDetails />
  },
  // {
  //   path: Routes.Checkout,
  //   element: <screens.Checkout />,
  // },
  {
    path: Routes.OrderSuccessful,
    element: <screens.OrderSuccessful />,
  },


]);

export const StackNavigator: React.FC = () => {
  return <RouterProvider router={stack} />;
};
