import { Fragment, useState, useEffect } from 'react'
import classnames from 'classnames'
import { useForm } from 'react-hook-form'
import { Form, FormGroup, Row, Col, Button, Label, Input, Card, CardBody, CardHeader, Spinner } from 'reactstrap'
import { OpenNotification } from '@src/views/components/Helper'
import '@styles/react/pages/page-account-settings.scss'
import InputPasswordToggle from '@components/input-password-toggle'
import { collection, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { auth, db } from '../../../configs/firebaseConfig'
import CryptoJS from "crypto-js"

const ChangePassword = () => {

  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [ConfirmNewPassword, setConfirmNewPassword] = useState('')
  const [buttonDisable, setButtonDisable] = useState(false)

  const { register, control, watch, handleSubmit, formState: { errors }, reset } = useForm()

  const onSubmit = async () => {

    setButtonDisable(true)

    try {
      const hashedCurrentPassword = CryptoJS.MD5(currentPassword).toString()

      const storedAuth = localStorage.getItem('auth')
      if (!storedAuth) {
        OpenNotification('error', 'Error', 'User not authenticated. Please log in again')
        setButtonDisable(false)
        return
      }
      const parsedUser = JSON.parse(storedAuth)

      const collectionRef = collection(db, 'superadmin')
      const q = query(collectionRef, where("email", "==", parsedUser.email), where("password", "==", hashedCurrentPassword))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        OpenNotification('error', 'Error', 'The current password is incorrect.')
        setButtonDisable(false)
        return
      }

      const userDoc = querySnapshot.docs[0]
      await updateDoc(userDoc.ref, {
        password: CryptoJS.MD5(newPassword).toString()
      })

      OpenNotification('success', 'Success', 'Password updated Successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')

    } catch (error) {
      console.error('Error updating password:', error)
      OpenNotification('error', 'Error', error.message || 'Password update failed.')
    } finally {
      setButtonDisable(false)
    }

  }


  return (
    <Fragment>
      <Card>
        <CardHeader tag='h4'>Change Password</CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col sm='12'>
                <FormGroup>
                  <Label className='form-label' for='currentPassword'>
                    Current Password
                  </Label>
                  <InputPasswordToggle
                    value={currentPassword}
                    id='currentPassword'
                    name='currentPassword'
                    className='input-group-merge'
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter Current Password"
                    innerRef={register({
                      required: 'Current password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    invalid={errors.currentPassword && true}
                  />
                  {errors.currentPassword && (
                    <small className='text-danger'>{errors.currentPassword.message}</small>
                  )}
                </FormGroup>
              </Col>
              <Col sm='12'>
                <FormGroup>
                  <div className='d-flex justify-content-between'>
                    <Label className='form-label' for='newPassword'>
                      New Password
                    </Label>
                  </div>
                  <InputPasswordToggle
                    value={newPassword}
                    id='newPassword'
                    name='newPassword'
                    className='input-group-merge'
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter New Password"
                    innerRef={register({
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    invalid={errors.newPassword && true}
                  />
                  {errors.newPassword && (
                    <small className='text-danger'>{errors.newPassword.message}</small>
                  )}
                </FormGroup>

              </Col>
              <Col sm='12'>
                <FormGroup>
                  <div className='d-flex justify-content-between'>
                    <Label className='form-label' for='reEnterPassword'>
                      Re-Enter New Password
                    </Label>
                  </div>
                  <InputPasswordToggle
                    value={ConfirmNewPassword}
                    id='reEnterPassword'
                    name='reEnterPassword'
                    className='input-group-merge'
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-Enter New Password"
                    innerRef={register({
                      required: 'Please re-enter your password',
                      validate: value => value === watch('newPassword') || 'Passwords do not match!'
                    })}
                    invalid={errors.reEnterPassword && true}
                  />
                  {errors.reEnterPassword && (
                    <small className='text-danger'>{errors.reEnterPassword.message}</small>
                  )}
                </FormGroup>
              </Col>
              <Col sm='12'>

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

export default ChangePassword
