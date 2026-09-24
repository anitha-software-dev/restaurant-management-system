import { Fragment, useEffect, useState } from 'react'
import { Row, Col } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import '@styles/react/pages/page-account-settings.scss'
import Profile from './Profile'

const Security = () => {


  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='Manage Profile' breadCrumbParent='Profile' breadCrumbActive='Details' />
      <Row>
        <Col sm="12">
          <Profile />
        </Col>
      </Row>
    </Fragment>
  )
}

export default Security
