import { Fragment } from 'react'
import Avatar from '@components/avatar'
import { CheckCircle, X } from 'react-feather'
import { toast } from 'react-toastify'
import moment from 'moment'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { handleLogout } from '@store/actions/auth'
import { db } from '../../configs/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'


const OpenToast = ({ color, title, message }) => (
  <Fragment>
    <div className='toastify-header'>
      <div className='title-wrapper'>
        <Avatar size='sm' color={color} icon={(color === 'success') ? <CheckCircle size={12} /> : <X size={12} />} />
        <h6 className='toast-title'>{title}</h6>
      </div>
    </div>
    <div className='toastify-body'>
      <span>{message}</span>
    </div>
  </Fragment>
)

const OpenNotification = (type, title, message) => {
  toast[type](<OpenToast color={(type === 'error') ? 'danger' : type} title={title} message={message} />, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: true
  })
}

// const validateRestaurant = async () => {

//   const dispatch = useDispatch()
//   const history = useHistory()

//   const token = localStorage.getItem('token')
//   if (!token) {
//     console.error('Token not found. Redirecting to login.')
//     OpenNotification('error', 'Error', 'Please login again!')
//     history.push('/login')
//     throw new Error('Token not found')
//   }

//   const restaurantRef = doc(db, 'restaurants', token)
//   const restaurantSnapshot = await getDoc(restaurantRef)

//   if (!restaurantSnapshot.exists()) {
//     dispatch(handleLogout())
//     console.error('Restaurant not found. Redirecting to login.')
//     OpenNotification('error', 'Error', 'Your restaurant no longer exists. Please log in again.')
//     history.push('/login')
//     throw new Error('Restaurant not found')
//   }
// }

const validateRestaurant = async (dispatch, history) => {
  const token = localStorage.getItem('token')
  if (!token) {
    console.error('Token not found. Redirecting to login.')
    OpenNotification('error', 'Error', 'Please login again!')
    history.push('/login')
    throw new Error('Token not found')
  }

  const restaurantRef = doc(db, 'restaurants', token)
  const restaurantSnapshot = await getDoc(restaurantRef)

  if (!restaurantSnapshot.exists()) {
    dispatch(handleLogout())
    console.error('Restaurant not found. Redirecting to login.')
    OpenNotification('error', 'OOPS!', 'Your restaurant no longer exists. Please log in again.')
    history.push('/login')
    throw new Error('Restaurant not found')
  }
}

const formatPhoneNumber = (value) => {

  if (!value) return value

  const phoneNumber = value.replace(/[^\d]/g, '')
  const phoneNumberLength = phoneNumber.length
  if (phoneNumberLength < 4) return phoneNumber

  if (phoneNumberLength < 7) {
    return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`
  }

  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
}

export { OpenNotification, formatPhoneNumber, validateRestaurant }