// ** React Imports
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Utils
import { isUserLoggedIn } from '@utils'

// ** Store & Actions
import { useDispatch } from 'react-redux'
import { handleLogout } from '@store/actions/auth'
import { CgProfile } from "react-icons/cg"

// ** Third Party Components
import { UncontrolledDropdown, DropdownMenu, DropdownToggle, DropdownItem } from 'reactstrap'
import { User, Mail, CheckSquare, MessageSquare, Settings, CreditCard, HelpCircle, Power } from 'react-feather'
import Config from '@src/configs/config.json'

// ** Default Avatar Image
import defaultAvatar from '@src/assets/images/avatars/avatar-blank.png'
import { FaHistory } from 'react-icons/fa'

const UserDropdown = () => {
  // ** Store Vars
  const dispatch = useDispatch()

  // ** State
  const [userData, setUserData] = useState(null)

  //** ComponentDidMount
  useEffect(() => {
    if (isUserLoggedIn() !== null) {
      setUserData(JSON.parse(localStorage.getItem('auth')))
    }
  }, [])

  //** Vars
  const userAvatar = defaultAvatar

  return (
    <UncontrolledDropdown tag='li' className='dropdown-user nav-item'>
      <DropdownToggle href='/' tag='a' className='nav-link dropdown-user-link' onClick={e => e.preventDefault()}>
        <div className='user-nav d-sm-flex d-none'>
          <span className='user-name font-weight-bold'>{(userData && userData.name) || 'Restaurant'}</span>
          <span className='user-status'>{(userData && userData.isRestaurant === false) ? 'Partner Admin' : 'Restaurant Admin'}</span>
        </div>
        <Avatar img={(userData && userData.logo && userData.isRestaurant === false) ? `${Config.MEDIA_URL}${userData.logo}?alt=media` : userAvatar} imgHeight='40' imgWidth='40' />
      </DropdownToggle>
      <DropdownMenu right>
        <DropdownItem tag={Link} to='/profile'>
          <CgProfile size={14} className='mr-75' />
          <span className='align-middle'>Profile</span>
        </DropdownItem>
          {/* <DropdownItem tag={Link} to={`/transactions/${row.id}`}>
  <FaHistory size={16} className='me-50' /> Transaction History
</DropdownItem> */}
  <DropdownItem tag={Link} to='/transactions'>
          <FaHistory size={14} className='mr-75' />
          <span className='align-middle'>Transactions</span>
        </DropdownItem>
        <DropdownItem tag={Link} to='/settings'>
          <Settings size={14} className='mr-75' />
          <span className='align-middle'>Settings</span>
        </DropdownItem>
        <DropdownItem tag={Link} to='/login' onClick={() => dispatch(handleLogout())}>
          <Power size={14} className='mr-75' />
          <span className='align-middle'>Logout</span>
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  )
}

export default UserDropdown
