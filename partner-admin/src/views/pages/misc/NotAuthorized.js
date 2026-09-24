import { Button } from 'reactstrap'
import { useHistory } from 'react-router-dom'
import notAuthImg from '@src/assets/images/pages/not-authorized.svg'
import logo from '@src/assets/images/logo/logo.png'

import '@styles/base/pages/page-misc.scss'

const NotAuthorized = () => {
  const history = useHistory()
  const handleBack = () => {
    const userData = (localStorage.getItem('auth')) ? JSON.parse(localStorage.getItem('auth')) : null
    const url = '/restaurants'
    history.push(url)
  }

  return (
    <div className='misc-wrapper'>
      <div className='misc-inner p-2 p-sm-3'>
        <div className='w-100 text-center'>
          <h2 className='mb-1'>You are not authorized! 🔐</h2>
          <p className='mb-2'>
          You do not have the necessary permissions to access this page.
          </p>
          <div>
            <Button onClick={handleBack} color='primary' className='btn-sm-block mb-1'>
              Back
            </Button>
          </div>
          <img className='img-fluid' src={notAuthImg} alt='Not authorized page' />
        </div>
      </div>
    </div>
  )
}
export default NotAuthorized
