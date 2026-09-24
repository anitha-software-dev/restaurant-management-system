// ** React Imports
import { Fragment } from 'react'
import { Row, Col } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import '@styles/react/pages/page-account-settings.scss'
import ChangePassword from './ChangePassword'
import Tax from './Tax'
import Currencies from './Currencies'
import PlatformFee from './PlatformFee'

const Security = () => {

  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='Manage Configurations' breadCrumbParent='Configurations' breadCrumbActive='Details' />
      <Row>
        <Col sm="4">
          <ChangePassword />
        </Col>

        <Col sm="4">
          <PlatformFee />
        </Col>

        {/* <Col sm="4">
          <Tax />
        </Col> */}

        {/* <Col sm="4">
          <Currencies />
        </Col> */}
      </Row>
    </Fragment>
  )
}

export default Security
