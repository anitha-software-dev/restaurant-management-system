import { useState, useContext } from 'react'
import classnames from 'classnames'
import { useDispatch } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { handleLogin } from '@store/actions/auth'
import { AbilityContext } from '@src/utility/context/Can'
import { useHistory } from 'react-router-dom'
import InputPasswordToggle from '@components/input-password-toggle'
import { Card, CardBody, Form, FormGroup, Label, Input, Button, Spinner } from 'reactstrap'
import '@styles/base/pages/page-auth.scss'
import { OpenNotification } from '@src/views/components/Helper'
import { db } from '../../../configs/firebaseConfig'
import { collection, getDocs, query, where } from 'firebase/firestore'
import CryptoJS from "crypto-js"

const LoginV1 = () => {

  const ability = useContext(AbilityContext)
  const dispatch = useDispatch()
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [buttonDisable, setButtonDisable] = useState(false)

  const { register, errors, handleSubmit } = useForm()

  const onSubmit = async (data) => {
    if (email !== '' && password !== '') {

      setButtonDisable(true)

      try {
        const hashedPassword = CryptoJS.MD5(password).toString()

        const collectionRef = collection(db, 'restaurants')
        const q = query(collectionRef, where("isRestaurant", "==", true), where("email", "==", email), where("password", "==", hashedPassword))
        const querySnapshot = await getDocs(q)

        setButtonDisable(false)
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]
          const user = userDoc.data()
          delete user.password

          const userData = {
            user,
            token: userDoc.id
          }

          dispatch(handleLogin(userData))

          ability.update([
            {
              action: 'manage',
              subject: 'all'
            }
          ])
          history.push("/orders")
          OpenNotification('success', `Welcome`, 'You have successfully logged in as an admin')

          return true
        } else {
          OpenNotification('error', 'OOPS', 'Invalid email or password!')
          return false
        }
      } catch (error) {
        console.log(error)
        setButtonDisable(false)
        OpenNotification('error', 'OOPS', 'Login Failed')
        return false
      }

    }
  }

  return (
    <div className='auth-wrapper auth-v1 px-2'>
      <div className='auth-inner py-2'>
        <Card className='mb-0'>
          <CardBody>
            {/* <div className='brand-logo'>
              <img src={logo ? `${Config.MEDIA_URL}${logo}?alt=media` : ''} width={200} />
            </div> */}
            <h4 className='text-center my-2'>Welcome! Please log in to continue</h4>
            <Form className='auth-login-form mt-2' onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label className='form-label' for='login-email'>
                  Email
                </Label>
                <Input
                  autoFocus
                  type='text'
                  value={email}
                  id='login-email'
                  name='login-email'
                  placeholder='Enter Email'
                  onChange={e => setEmail(e.target.value)}
                  className={classnames({ 'is-invalid': errors['login-email'] })}
                  innerRef={register({ required: true, validate: value => value !== '' })}
                />
              </FormGroup>
              <FormGroup>
                <div className='d-flex justify-content-between'>
                  <Label className='form-label' for='login-password'>
                    Password
                  </Label>
                </div>
                <InputPasswordToggle
                  value={password}
                  id='login-password'
                  name='login-password'
                  className='input-group-merge'
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  innerRef={register({ required: true, validate: value => value !== '' })}
                />
              </FormGroup>

              <Button.Ripple type="submit" color='primary' className="mt-3 mb-2" block>
                {(buttonDisable) ? <> <Spinner color='white' size='sm' /> </> : 'LOGIN'}
              </Button.Ripple>
            </Form>

          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default LoginV1
