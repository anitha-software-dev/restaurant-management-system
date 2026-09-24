import { Nav, NavItem, NavLink } from 'reactstrap'

const Tabs = ({ activeTab, toggleTab }) => {
  return (
    <Nav className='nav-left admin-campaign' pills>
      <NavItem>
        <NavLink active={activeTab === '1'} onClick={() => toggleTab('1')}>
          <span className='font-weight-bold'>Orders</span>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink active={activeTab === '2'} onClick={() => toggleTab('2')}>
          <span className='font-weight-bold'>Menus</span>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink active={activeTab === '3'} onClick={() => toggleTab('3')}>
          <span className='font-weight-bold'>Items</span>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink active={activeTab === '4'} onClick={() => toggleTab('4')}>
          <span className='font-weight-bold'>Tables</span>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink active={activeTab === '5'} onClick={() => toggleTab('5')}>
          <span className='font-weight-bold'>Waiters</span>
        </NavLink>
      </NavItem>
    </Nav>
  )
}

export default Tabs