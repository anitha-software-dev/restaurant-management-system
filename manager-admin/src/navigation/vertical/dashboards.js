import { Menu } from 'react-feather'
import { FaClipboardList, FaQrcode } from 'react-icons/fa'
import { CiBoxList } from "react-icons/ci"
import { GrRestaurant } from "react-icons/gr"
import { GiChefToque } from "react-icons/gi"
import { TbChefHat } from "react-icons/tb"

export default [
  {
    id: 'orders',
    title: 'Orders',
    icon: <FaClipboardList />,
    action: 'manage',
    resource: 'orders',
    navLink: '/orders'
  },
  {
    id: 'menu',
    title: 'Menus',
    icon: <Menu />,
    action: 'manage',
    resource: 'menu',
    navLink: '/menu'
  },
  {
    id: 'items',
    title: 'Items',
    icon: <CiBoxList />,
    action: 'manage',
    resource: 'items',
    navLink: '/items'
  },
  {
    id: 'tables',
    title: 'QR Codes',
    icon: <FaQrcode />,
    action: 'manage',
    resource: 'tables',
    navLink: '/tables'
  },
  {
    id: 'waiters',
    title: 'Waiters',
    icon: <GrRestaurant />,
    action: 'manage',
    resource: 'waiters',
    navLink: '/waiters'
  },
  {
    id: 'chefs',
    title: 'Chefs',
    icon: <TbChefHat />,
    action: 'manage',
    resource: 'chefs',
    navLink: '/chefs'
  }
]
