// ** Dropdowns Imports
import UserDropdown from './UserDropdown'

// ** Third Party Components
import { Sun, Moon, AlertTriangle } from 'react-feather'
import { NavItem, NavLink } from 'reactstrap'
import { useSelector } from "react-redux"
import { useLocation } from 'react-router-dom'

const NavbarUser = props => {
  // ** Props
  const { skin, setSkin } = props

  const location = useLocation()
  const showChefWarning = useSelector((state) => state.common.showChefWarning)
  const isItemsPage = location.pathname.includes('/items')

  // ** Function to toggle Theme (Light/Dark)
  const ThemeToggler = () => {
    if (skin === 'dark') {
      return <Sun className='ficon' onClick={() => setSkin('light')} />
    } else {
      return <Moon className='ficon' onClick={() => setSkin('dark')} />
    }
  }

  return (

    <ul className="nav navbar-nav w-100 align-items-center">
      {/* ✅ Only show if Redux says true and on Items page */}
      {(showChefWarning && isItemsPage) && (
        <NavItem className="d-none d-lg-block mr-auto">
          <NavLink className="nav-link-style d-flex align-items-center text-danger">
            <AlertTriangle size={18} className="mr-1" />
            Some items have no chefs assigned.
          </NavLink>
        </NavItem>
      )}

      <NavItem className="ml-auto">
        <UserDropdown />
      </NavItem>
    </ul>

  )
}
export default NavbarUser
