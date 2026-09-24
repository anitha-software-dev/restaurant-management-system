import { Button, Form, Input, Row, Col } from 'reactstrap'
import comingSoonImg from '@src/assets/images/pages/coming-soon.svg'
import logo from '@src/assets/images/logo/logo.png'

import '@styles/base/pages/page-misc.scss'

const ComingSoon = () => {
  return (
    <div className='misc-wrapper'>
      <a className='brand-logo' href='/'>
        <img src={logo} width={200} />
      </a>
      <div className='misc-inner p-2 p-sm-3'>
        <div className='w-100 text-center'>
          <h2 className='mb-1'>We are launching soon 🚀</h2>
          <p className='mb-3'>We're creating something awesome. Please subscribe to get notified when it's ready!</p>
          <Form tag={Row} className='justify-content-center m-0 mb-2' inline onSubmit={e => e.preventDefault()}>
            <Col tag={Input} className='mb-1 mr-md-2' md='5' sm='12' placeholder='john@example.com' />
            <Button className='btn-sm-block mb-1' color='primary'>
              Notify
            </Button>
          </Form>
          <img className='img-fluid' src={comingSoonImg} alt='Coming soon page' />
        </div>
      </div>
    </div>
  )
}
export default ComingSoon
