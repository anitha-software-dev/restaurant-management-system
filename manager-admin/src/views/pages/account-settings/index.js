// ** React Imports
import { Fragment, useEffect, useState } from 'react'
import { Row, Col } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import SettingCode from './SettingCode'
import Gst from './Gst'
import { Service } from '@src/services/Service'
import '@styles/react/pages/page-account-settings.scss'
import ChangePassword from './ChangePassword'
import TaxesList from './Taxes'
import Qrcode from './Qrcode'
import OffersList from './Offers'

const Security = () => {

  const [locationList, setLocationList] = useState([])
  const [isRestaurant, setIsRestaurant] = useState(null)

  // PRIMARY LOCATIONS
  const getPrimaryLocationList = (param) => {
    const params = { page: 1, limit: 1000 }

    Service.get({
      url: `/primary-location/?${new URLSearchParams(params).toString()}`
    }).then(response => {
      if (response) {
        if (response && response.data && response.data.length > 0) {
          const tmp = response.data.map((item) => { return { value: item.id, label: item.location_name } })
          setLocationList(tmp)
        } else {
          setLocationList([])
        }
      }
    }).catch(err => {
      setLocationList([])
    })
  }

  const getData = () => {
    const auth = localStorage.getItem('auth')
    try {
      const parsedAuth = JSON.parse(auth)

      if (parsedAuth?.isRestaurant === true) {
        setIsRestaurant(true)
      } else {
        setIsRestaurant(null)
      }

    } catch (error) {
      console.error('Failed to parse auth:', error)
      setIsRestaurant(null)
    }
  }

  useEffect(() => {
    // getPrimaryLocationList()
    getData()
  }, [])

  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='Manage Configurations' breadCrumbParent='Configurations' breadCrumbActive='Details' />
      <Row>
        {/* Left Column for smaller cards */}
        <Col lg="4" md="5" sm="12" className="d-flex flex-column" style={{ gap: '2rem' }}>
          <ChangePassword />
          <Qrcode />
        </Col>

        {/* Right Column for larger lists */}
        <Col lg="8" md="7" sm="12" className="d-flex flex-column" style={{ gap: '2rem' }}>
          {isRestaurant === true && <TaxesList />}
          <OffersList />
        </Col>
      </Row>
    </Fragment>
  )
}

export default Security
