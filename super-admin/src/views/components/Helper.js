import { Fragment } from 'react'
import Avatar from '@components/avatar'
import { CheckCircle, X } from 'react-feather'
import { toast } from 'react-toastify'
import moment from 'moment'

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

export { OpenNotification, formatPhoneNumber }