import { useState, useContext } from 'react'
import classnames from 'classnames'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { handleLogin } from '@store/actions/auth'
import { AbilityContext } from '@src/utility/context/Can'
import { useHistory } from 'react-router-dom'
import InputPasswordToggle from '@components/input-password-toggle'
import { Card, CardBody, Form, FormGroup, Label, Input, Button, Spinner } from 'reactstrap'
import '@styles/base/pages/page-auth.scss'
import logo from '@src/assets/images/logo/logo.png'
import { OpenNotification } from '@src/views/components/Helper'
import { auth, db } from '../../../configs/firebaseConfig'
import { collection, getDocs, query, where } from 'firebase/firestore'
import CryptoJS from "crypto-js"
import { signInWithEmailAndPassword } from 'firebase/auth'

const LoginV1 = () => {

  const ability = useContext(AbilityContext)
  const dispatch = useDispatch()
  const history = useHistory()
  const [email, setEmail] = useState('superadmin@gmail.com')
  const [password, setPassword] = useState('123456')
  const [buttonDisable, setButtonDisable] = useState(false)

  const { register, errors, handleSubmit } = useForm()

  const onSubmit = async (data) => {
    if (email !== '' && password !== '') {

      setButtonDisable(true)

      try {

        const res = await signInWithEmailAndPassword(auth, email, password)
        const user = res.user

        const hashedPassword = CryptoJS.MD5(password).toString()

        const collectionRef = collection(db, 'superadmin')
        const q = query(collectionRef, where("email", "==", email), where("uid", "==", user.uid))
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
          OpenNotification('success', `Welcome`, 'You have successfully logged in as an admin')
          history.push("/partners")
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

            <h4 className='text-center my-2'>Welcome to the Admin Restaurant!</h4>
            <Form className='auth-login-form mt-3' onSubmit={handleSubmit(onSubmit)}>
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
