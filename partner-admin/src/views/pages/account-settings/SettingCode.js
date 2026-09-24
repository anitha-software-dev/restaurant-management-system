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

  const [pin, setPin] = useState(null)
  const [data, setData] = useState(null)
  const [buttonDisable, setButtonDisable] = useState(false)

  const SignupSchema = yup.object().shape({
    oldcode: yup.string().min(4).required(),
    newcode: yup.string().min(4).required(),
    retypecode: yup
      .string()
      .required()
      .min(4)
      .oneOf([yup.ref(`newcode`), null], 'Code must match!')
  })

  const { register, errors, handleSubmit, reset } = useForm({
    resolver: yupResolver(SignupSchema)
  })

  const getSettingCode = () => {
    Service.get({
      url: '/settings/'
    })
      .then(response => {
        if (response && response.pin) {
          setData(response)
          setPin(response.pin)
        } else {
          setPin(null)
          setData(null)
        }
      })
      .catch(err => {
        console.log(err)
      })
  }

  useEffect(() => {
    // getSettingCode()
  }, [])

  const onSubmit = (values) => {
    setButtonDisable(true)
    Service.put({
      url: `/settings/${data.id}/`,
      body: JSON.stringify({ old_pin: pin, pin: values.newcode })
    })
      .then(response => {
        setButtonDisable(false)
        if (response && response.status) {
          OpenNotification('success', 'Success!', 'PIN Updated Successfully!')
          reset()
          getSettingCode()
        }
      })
      .catch(err => {
        console.log(err)
        setButtonDisable(false)
        OpenNotification('error', 'Oops!', 'Something went wrong!')
      })
  }

  return (
    <Fragment>
      <Card>
        <CardHeader tag='h4'>App Setting Code</CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col sm='12'>
                <FormGroup>
                  <Label for='oldcode'>Current Code</Label>
                  <Input
                    type='text'
                    id='oldcode'
                    name='oldcode'
                    placeholder='Current Code'
                    className={classnames({
                      'is-invalid': errors.oldcode
                    })}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    innerRef={register({ required: true })}
                    readOnly
                  />
                </FormGroup>
              </Col>
              <Col sm='12'>
                <FormGroup>
                  <Label for='newcode'>New Code</Label>
                  <Input
                    type='text'
                    id='newcode'
                    name='newcode'
                    placeholder='Enter New Code'
                    className={classnames({
                      'is-invalid': errors.newcode
                    })}
                    innerRef={register({ required: true })}
                    max={4}
                  />
                </FormGroup>
              </Col>
              <Col sm='12'>
                <FormGroup>
                  <Label for='retypecode'>Confirm New Code</Label>
                  <Input
                    type='text'
                    id='retypecode'
                    name='retypecode'
                    placeholder='Confirm New Code'
                    className={classnames({
                      'is-invalid': errors.retypecode
                    })}
                    innerRef={register({ required: true })}
                    max={4}
                  />
                </FormGroup>
              </Col>
              <Col className='mt-1' sm='12'>
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
