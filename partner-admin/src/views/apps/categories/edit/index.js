// ** React Imports
import { Fragment, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import classnames from 'classnames'

import { useDispatch, useSelector } from 'react-redux'
import { getAllStatesData, getAllCitiesData } from '@store/actions/common'

// ** Third Party Components
import { Card, CardBody, CardHeader, Button, Input, Form, Label, FormGroup, Row, Col, CustomInput } from 'reactstrap'
import Select, { components } from 'react-select'
import { selectThemeColors } from '@utils'
import Flatpickr from 'react-flatpickr'
import { useHistory, useParams } from 'react-router-dom'
import Breadcrumbs from '@components/breadcrumbs'
import { Service } from '@src/services/Service'
import { OpenNotification } from '@src/views/components/Helper'

const OptionComponent = ({ data, ...props }) => {
  return (
    <components.Option {...props}>
      {data.label}
    </components.Option>
  )
}

const AddNewRecord = () => {

  const dispatch = useDispatch()
  const { stateData, cityData, isFetching } = useSelector(({ common }) => common)

  const { id } = useParams()
  const history = useHistory()
  const { register, errors, handleSubmit, trigger, setValue } = useForm()
  const [mode, setMode] = useState('Add')
  const [editInfo, setEditInfo] = useState(null)
  const [btnSubmitted, setBtnSubmitted] = useState(false)
  const [state, setState] = useState(null)
  const [city, setCity] = useState(null)
  const [statesList, setStatesList] = useState([])
  const [citiesList, setCitiesList] = useState([])

  // GET CLIENT DETAILS
  const getClientDetail = (val) => {
    Service.get({
      url: `/client/${val}/`
    }).then(response => {
      if (response) {
        setEditInfo(response)
      } else {
        setEditInfo(null)
      }
    }).catch(err => {
      console.log(err)
      setEditInfo(null)
    })
  }

  useEffect(() => {
    if (id) {
      setMode('Edit')
      getClientDetail(id)
    }

    dispatch(getAllStatesData())
  }, [])

  useEffect(() => {
    if (state) {
      dispatch(getAllCitiesData(state.value))
    }
  }, [state])

  useEffect(() => {
    if (editInfo) {
      setValue('name', editInfo.name)
      setValue('address_1', editInfo.address_1)
      setValue('address_2', editInfo.address_2)
      setValue('zip_code', editInfo.zip_code)
      setValue('email', editInfo.email)
      setValue('phone_number', editInfo.phone_number)
      setValue('whatsapp', editInfo.whatsapp)
      setValue('company_name', editInfo.company_name)
      setValue('phone_number', editInfo.phone_number)
      setValue('gst', editInfo.gst)
      setValue('pan', editInfo.pan)
      setValue('website', editInfo.website)

      setTimeout(() => {
        setState({ label: editInfo.state_name, value: editInfo.state })
        setCity({ label: editInfo.city_name, value: editInfo.city })
      }, 500)
    }
  }, [editInfo])

  useEffect(() => {
    if (stateData && stateData.length > 0) {
      const tmp = stateData.map((item) => { return { value: item.id, label: item.name } })
      setStatesList(tmp)
    } else {
      setStatesList([])
    }
  }, [stateData])

  useEffect(() => {
    if (cityData && cityData.length > 0) {
      const tmp = cityData.map((item) => { return { value: item.id, label: item.name } })
      setCitiesList(tmp)
    } else {
      setCitiesList([])
    }
  }, [cityData])

  // SUBMIT CLIENT FORM
  const onSubmit = (values) => {

    const params = {}

    for (const key in values) {
      params[key] = (values[key] && values[key] !== "") ? values[key] : null
    }

    if (state) {
      params.state = state.value
    } else {
      OpenNotification('error', 'Oops!', 'Please choose state!')
      return false
    }
    if (city) {
      params.city = city.value
    } else {
      OpenNotification('error', 'Oops!', 'Please choose city!')
      return false
    }

    setBtnSubmitted(true)

    if (mode === 'Add') {
      Service.post({
        url: '/client/',
        body: JSON.stringify(params)
      }).then(response => {
        setBtnSubmitted(false)
        if (response.status === 'error') {
          response.data.then(res => {
            if (typeof res === 'object') {
              for (const key in res) {
                if (Object.hasOwnProperty.call(res, key)) {
                  const value = res[key]
                  OpenNotification('error', 'Oops!', `${key}: ${value[0]}`)
                  return false
                }
              }
            } else {
              OpenNotification('error', 'Oops!', 'Create Failed!')
            }
          })
          return false
        } else {
          setBtnSubmitted(false)
          OpenNotification('success', 'Success!', 'Client added successfully')
          history.push('/clients')
        }
      })
    } else {
      Service.put({
        url: `/client/${id}/`,
        body: JSON.stringify(params)
      }).then(response => {
        if (response.status === 'error') {
          response.data.then(res => {
            if (typeof res === 'object') {
              for (const key in res) {
                if (Object.hasOwnProperty.call(res, key)) {
                  const value = res[key]
                  OpenNotification('error', 'Oops!', `${value[0]}`)
                  return false
                }
              }
            } else {
              OpenNotification('error', 'Oops!', 'Update Failed!')
            }
          })
          return false
        } else {
          setBtnSubmitted(false)
          OpenNotification('success', 'Success!', 'Client updated successfully!')
          history.push('/clients')
        }
      })
    }
  }

  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='Manage Clients' breadCrumbParent='Clients' breadCrumbActive={mode} />
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader tag='h3'>Client Information</CardHeader><hr className='mt-0' />
          <CardBody>
            <Row>
              <Col sm='4'>
                <FormGroup>
                  <Label for='name'>Contact Name <span className="text-danger">*</span></Label>
                  <Input
                    type='text'
                    id='name'
                    name='name'
                    placeholder='Enter Client Name'
                    className={classnames({
                      'is-invalid': errors.name
                    })}
                    innerRef={register({ required: true })}
                  />
                </FormGroup>
              </Col>
              <Col sm='4'>
                <FormGroup>
                  <Label for='company_name'>Company Name</Label>
                  <Input
                    type='text'
                    id='company_name'
                    name='company_name'
                    placeholder='Enter Company Name'
                    className={classnames({
                      'is-invalid': errors.company_name
                    })}
                    innerRef={register({ required: false })}
                  />
                </FormGroup>
              </Col>
              <Col sm='4'>
                <FormGroup>
                  <Label for='gst'>GST</Label>
                  <Input
                    type='text'
                    id='gst'
                    name='gst'
                    placeholder='Enter GST'
                    className={classnames({
                      'is-invalid': errors.gst
                    })}
                    innerRef={register({ required: false })}
                  />
                </FormGroup>
              </Col>
              <Col sm='4'>
                <FormGroup>
                  <Label for='state'>State <span className="text-danger">*</span></Label>
                  <Select
                    id='state'
                    name='state'
                    options={statesList}
                    value={state}
                    onChange={(e) => { setCitiesList([]); setCity(null); setState(e) }}
                    theme={selectThemeColors}
                    className='react-select'
                    classNamePrefix='select'
                    isClearable={false}
                    placeholder="Select"
                    components={{
                      Option: OptionComponent
                    }}
                  />
                </FormGroup>
              </Col>
              <Col sm='4'>
                <FormGroup>
                  <Label for='city'>City <span className="text-danger">*</span></Label>
                  <Select
                    id='city'
                    name='city'
                    options={citiesList}
                    value={city}
                    onChange={(e) => setCity(e)}
                    theme={selectThemeColors}
                    className='react-select'
                    classNamePrefix='select'
                    placeholder="Select"
                    isClearable={false}
                    components={{
                      Option: OptionComponent
                    }}
                  />
                </FormGroup>
              </Col>
              <Col sm='4'>
                <FormGroup>
                  <Label for='address_1'>Address 1 <span className="text-danger">*</span></Label>
                  <Input
                    type='text'
                    id='address_1'
                    name='address_1'
                    placeholder='Enter Address Line 1'
                    className={classnames({
                      'is-invalid': errors.address_1
                    })}
                    innerRef={register({ required: true })}
                  />
                </FormGroup>
              </Col>

              <Col sm='4'>
                <FormGroup>
                  <Label for='address_2'>Address 2</Label>
                  <Input
                    type='text'
                    id='address_2'
                    name='address_2'
                    placeholder='Enter Address Line 2'
                    className={classnames({
                      'is-invalid': errors.address_2
                    })}
                    innerRef={register({ required: false })}
                  />
                </FormGroup>
              </Col>
              <Col sm='4'>
                <FormGroup>
                  <Label for='zip_code'>Zip Code <span className="text-danger">*</span></Label>
                  <Input
                    type='text'
                    id='zip_code'
                    name='zip_code'
                    placeholder='Enter Zip Code'
                    className={classnames({
                      'is-invalid': errors.zip_code
                    })}
                    innerRef={register({ required: true })}
                  />
                </FormGroup>
              </Col>
              <Col sm='4'>
                <FormGroup>
                  <Label for='email'>Email <span className="text-danger">*</span></Label>
                  <Input
                    type='text'
                    id='email'
                    name='email'
                    placeholder='Enter Email'
                    className={classnames({
                      'is-invalid': errors.email
                    })}
                    innerRef={register({ required: true })}
                  />
                </FormGroup>
              </Col>
              <Col sm='4'>
                <FormGroup>
                  <Label for='phone_number'>Phone Number <span className="text-danger">*</span></Label>
                  <Input
                    type='text'
                    id='phone_number'
                    name='phone_number'
                    placeholder='Enter Phone Number'
                    className={classnames({
                      'is-invalid': errors.phone_number
                    })}
                    innerRef={register({ required: true })}
                  />
                </FormGroup>
              </Col>
              <Col sm='4'>
                <FormGroup>
                  <Label for='whatsapp'>Whatsapp</Label>
                  <Input
                    type='text'
                    id='whatsapp'
                    name='whatsapp'
                    placeholder='Enter Whatsapp'
                    className={classnames({
                      'is-invalid': errors.whatsapp
                    })}
                    innerRef={register({ required: false })}
                  />
                </FormGroup>
              </Col>
              <Col sm='4'>
                <FormGroup>
                  <Label for='website'>Website</Label>
                  <Input
                    type='text'
                    id='website'
                    name='website'
                    placeholder='Enter Website'
                    className={classnames({
                      'is-invalid': errors.website
                    })}
                    innerRef={register({ required: false })}
                  />
                </FormGroup>
              </Col>
              <Col sm='4'>
                <FormGroup>
                  <Label for='pan'>PAN</Label>
                  <Input
                    type='text'
                    id='pan'
                    name='pan'
                    placeholder='Enter PAN'
                    className={classnames({
                      'is-invalid': errors.pan
                    })}
                    innerRef={register({ required: false })}
                  />
                </FormGroup>
              </Col>
            </Row>

          </CardBody>
        </Card>

        <Row>
          <Col className='mt-1 text-left' sm='12'>
            <Button.Ripple className='mr-1' color='secondary' onClick={() => history.push('/clients')}>
              Cancel
            </Button.Ripple>
            <Button.Ripple type='submit' color='primary' disabled={btnSubmitted}>
              Submit
            </Button.Ripple>
          </Col>
        </Row>
      </Form>

    </Fragment >
  )
}

export default AddNewRecord
