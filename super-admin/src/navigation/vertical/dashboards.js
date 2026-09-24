import { Table } from 'react-feather'
import { FaAddressBook, FaHandshake } from 'react-icons/fa'

export default [
  // {
  //   id: 'dashboard',
  //   title: 'Dashboard',
  //   icon: <FaAddressBook />,
  //   navLink: '/dashboard'
  // },
  {
    id: 'partners',
    title: 'Partners',
    icon: <FaHandshake />,
    navLink: '/partners'
  },
  {
    id: 'restaurants',
    title: 'Restaurants',
    icon: <Table />,
    navLink: '/restaurants'
  }
]
