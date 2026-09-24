import { Fragment, useState, useEffect } from 'react'
import * as yup from 'yup'
import classnames from 'classnames'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { Form, FormGroup, Row, Col, Button, Label, Input, Card, CardBody, CardHeader, Spinner } from 'reactstrap'
import { Service } from '@src/services/Service'
import Breadcrumbs from '@components/breadcrumbs'
import { OpenNotification } from '@src/views/components/Helper'
import '@styles/react/pages/page-account-settings.scss'

const AccountSettings = () => {

  const [mode, setMode] = useState('Add')
  const [data, setData] = useState(false)
  const [buttonDisable, setButtonDisable] = useState(false)

  const SignupSchema = yup.object().shape({
    time: yup.string().required(),
    type: yup.string().required()
  })

  const { register, errors, handleSubmit, reset, setValue } = useForm({
    resolver: yupResolver(SignupSchema)
  })

  const getSchedule = () => {
    Service.get({
      url: '/notification-schedule/'
    })
      .then(response => {
        if (response && response.length > 0) {
          setData(response[0])
          setValue('time', response[0]?.duration)
          setValue('type', response[0]?.duration_type)
          setMode('Edit')
        } else {
          setMode('Add')
        }
      })
      .catch(err => {
        console.log(err)
      })
  }

  useEffect(() => {
    // getSchedule()
  }, [])

  const onSubmit = (values) => {
    const params = {
      duration: values.time,
      duration_type: values.type
    }
    setButtonDisable(true)
    if (mode === 'Edit') {
      Service.put({
        url: `/notification-schedule/${data.id}/`,
        body: JSON.stringify(params)
      })
        .then(response => {
          setButtonDisable(false)
          if (response && response.status) {
            OpenNotification('success', 'Success!', 'Notification schedule updated successfully!')
          }
        })
        .catch(err => {
          console.log(err)
          setButtonDisable(false)
          OpenNotification('error', 'Oops!', 'Something went wrong!')
        })
    } else {
      Service.post({
        url: `/notification-schedule/`,
        body: JSON.stringify(params)
      })
        .then(response => {
          setButtonDisable(false)
          if (response && response.status) {
            OpenNotification('success', 'Success!', 'Notification schedule created successfully!')
          }
        })
        .catch(err => {
          console.log(err)
          setButtonDisable(false)
          OpenNotification('error', 'Oops!', 'Something went wrong!')
        })
    }
  }

  return (
    <Fragment>
      <Card style={{ minHeight: "360px" }}>
        <CardHeader tag='h4'>Ping Delay Notification Time</CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col sm='12'>
                <FormGroup>
                  <Input
                    type='text'
                    id='time'
                    name='time'
                    placeholder='Enter Time'
                    className={classnames({
                      'is-invalid': errors.time
                    })}
                    innerRef={register({ required: true })}
                  />
                </FormGroup>
              </Col>
              <Col sm='12'>
                <FormGroup>
                  <Input
                    type='select'
                    id='type'
                    name='type'
                    className={classnames({
                      'is-invalid': errors.type
                    })}
                    innerRef={register({ required: true })}
                  >
                    <option value="">Select Time</option>
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col sm='12' className="mt-1">
                <Button.Ripple type='submit' className='mr-1' color='primary' disabled={buttonDisable}>
                  Save Changes
                </Button.Ripple>
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
    </Fragment>
  )
}

export default AccountSettings
