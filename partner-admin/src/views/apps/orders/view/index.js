// ** React Imports
import { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'

// ** Third Party Components
import { Card, CardBody, Button, CustomInput, Modal, ModalHeader, ModalBody, Form, ModalFooter, FormGroup, Spinner, Badge, Label, Row, Col, Table } from 'reactstrap'
import { Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore'
import { useParams } from 'react-router-dom'
import Breadcrumbs from '@components/breadcrumbs'
import { OpenNotification } from '@src/views/components/Helper'
import { db } from '../../../../configs/firebaseConfig'
import Config from '@src/configs/config.json'
import { Edit } from 'react-feather'

// ** Styles
import '@styles/base/pages/app-invoice.scss'

const ViewOrder = () => {

  const { id } = useParams()
  const { register, errors, handleSubmit, trigger, setValue } = useForm()
  const [data, setData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [orderStatus, setOrderStatus] = useState('')
  const [orderStatusModal, setOrderStatusModal] = useState(false)

  const getOrderDetail = async () => {
    try {
      const docRef = doc(db, 'orders', id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const res = docSnap.data()

        const { password, ...rest } = res

        const createdAtTimestamp = res.createdAt
        const createdAtDate = createdAtTimestamp?.toDate?.() || new Date()
        const createdAtFormatted = format(createdAtDate, 'dd/MM/yyyy hh:mm a')

        setData({
          ...rest, id: doc.id, createdAtDate, createdAtFormatted
        })
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
    }
  }

  useEffect(() => {
    if (id) {
      getOrderDetail()
    }
  }, [])

  const getOrderBadgeColor = (status) => {
    switch (status) {
      case 0:
        return 'warning'
      case 1:
        return 'success'
      case 2:
        return 'info'
      case 3:
        return 'danger'
      case 4:
        return 'secondary'
      default:
        return ''
    }
  }

  const getOrderBadgeName = (status) => {
    switch (status) {
      case 0:
        return 'PENDING'
      case 1:
        return 'ACCEPTED'
      case 2:
        return 'DELIVERED'
      case 3:
        return 'CANCELLED'
      case 4:
        return 'CLEARED'
      default:
        return '-'
    }
  }

  const handleOrderStatus = async (data) => {

    try {
      setSubmitting(true)
      const itemRef = doc(db, 'orders', id)

      await updateDoc(itemRef, {
        orderStatus: Number(data.orderStatus),
        updatedAt: Timestamp.now()
      })
      setSubmitting(false)
      setOrderStatusModal(false)
      getOrderDetail()
      OpenNotification('success', 'Success!', 'Order Status updated successfully')
    } catch (error) {
      setSubmitting(false)
      console.error("Error updating order status:", error)
      OpenNotification('error', 'Error', 'Failed to update the order status.')
    }
  }

  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='View Order Detail' breadCrumbParent='Order' breadCrumbActive="Detail" />
      <div className='invoice-preview-wrapper'>
        <Row className='invoice-preview'>
          <Col xl={12}>
            <Card className='invoice-preview-card'>
              <CardBody className='invoice-padding pb-0'>
                <div className='d-flex justify-content-between flex-md-row flex-column invoice-spacing mt-1'>
                  <div className='mt-md-0 mt-2'>
                    <div className='invoice-date-wrapper'>
                      <p className='invoice-date-title' style={{ width: '10rem' }}><strong>ORDER ID:</strong></p>
                      <p className='invoice-date' style={{ fontWeight: '300' }}>{data && data.transactionId}</p>
                    </div>
                    <div className='invoice-date-wrapper'>
                      <p className='invoice-date-title' style={{ width: '10rem' }}><strong>ORDER NUMBER:</strong></p>
                      <p className='invoice-date' style={{ fontWeight: '300' }}>{data && data.orderNumber}</p>
                    </div>
                    <div className='invoice-date-wrapper'>
                      <p className='invoice-date-title' style={{ width: '10rem' }}><strong>ORDER DATE:</strong></p>
                      <p className='invoice-date' style={{ fontWeight: '300' }}>{data && data.createdAtFormatted}</p>
                    </div>
                    <div className='invoice-date-wrapper'>
                      <p className='invoice-date-title' style={{ width: '10rem' }}><strong>ORDER FOR:</strong></p>
                      <p className='invoice-date' style={{ fontWeight: '300' }}>{`${data?.qrType || '-'} - ${data?.qrNumber || '-'}`}</p>
                    </div>
                  </div>
                  <div>
                    <h6>ORDER STATUS
                      <span className='ml-1 text-warning cursor-pointer font-weight-ligher' onClick={() => {
                        setOrderStatus(data?.orderStatus)
                        setOrderStatusModal(!orderStatusModal)
                      }}>
                        <Edit size={14} />
                      </span>
                    </h6>
                    <Badge color={getOrderBadgeColor(data?.orderStatus)} pill>
                      {getOrderBadgeName(data?.orderStatus)}
                    </Badge>
                  </div>
                </div>
              </CardBody>

              <Table responsive>
                <thead>
                  <tr>
                    <th className='py-1'>ITEM</th>
                    <th className='py-1 text-right'>RATE</th>
                    <th className='py-1 text-center'>QUANTITY</th>
                    <th className='py-1 text-right'>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items && data.items.length > 0) ? <>
                    {data.items.map((item, index) => (
                      <>
                        <tr>
                          <td className='py-1'>
                            <img
                              src={item.images && item.images.length > 0 ? `${Config.MEDIA_URL}${item.images[0]}?alt=media` : 'https://via.placeholder.com/60'}
                              alt={item.name}
                              style={{ width: '50px', height: '50px', borderRadius: '5px' }}
                            />
                            <span className='card-text font-weight-bold mb-25 mx-1'>{item.name}</span>
                            <span>{item.portion ? `(${item.portion})` : ''}</span>
                          </td>
                          <td className='py-1 text-right'>
                            <span className='font-weight-bold'>{data?.currencySymbol}{parseFloat(item.price).toFixed(2)}</span>
                          </td>
                          <td className='py-1 text-center'>
                            <span className='font-weight-bold'>{item.quantity}</span>
                          </td>
                          <td className='py-1 text-right'>
                            <span className='font-weight-bold'>{data?.currencySymbol}{parseFloat(item.price * item.quantity).toFixed(2)}</span>
                          </td>
                        </tr>
                      </>
                    ))}
                  </> : <>

                  </>}
                </tbody>
              </Table>

              <hr className='invoice-spacing' />

              <CardBody className='invoice-padding pb-0'>
                <Row className='invoice-sales-total-wrapper'>
                  <Col className='mt-md-0 mt-3' md='6' order={{ md: 1, lg: 2 }}>
                    <h6 style={{ fontWeight: 'bold' }}>PAYMENT MODE</h6>
                    <p style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{data?.paymentMode || 'Cash'}</p>
                  </Col>
                  <Col className='d-flex justify-content-end' md='6' order={{ md: 2, lg: 1 }}>
                    <div className='invoice-total-wrapper' style={{ maxWidth: '20rem' }}>

                      {(data?.taxBreakdown && data?.taxBreakdown.length > 0) ? (
                        <>
                          <div className='invoice-total-item'>
                            <p className='invoice-total-title'>SUB TOTAL:</p>
                            <p className='invoice-total-amount'>{data?.currencySymbol}{data?.subTotal?.toFixed(2) || '-'}</p>
                          </div>
                          {(data?.taxBreakdown.map((t) => (
                            <>
                              <div className='invoice-total-item'>
                                <p className='invoice-total-title'>{t.taxName}:</p>
                                <p className='invoice-total-amount'>{data?.currencySymbol}{(t.taxAmount).toFixed(2)}</p>
                              </div>
                            </>
                          )))}
                        </>
                      ) : (
                        <div className='invoice-total-item'>
                          <p className='invoice-total-title'>SUB TOTAL:</p>
                          <p className='invoice-total-amount'>{data?.currencySymbol}{data?.subTotal?.toFixed(2) || '-'}</p>
                        </div>
                      )}
                      <hr className='my-50' />
                      <div className='invoice-total-item'>
                        <p className='invoice-total-title'>GRAND TOTAL:</p>
                        <p className='invoice-total-amount'>{data?.currencySymbol}{data?.grandTotal?.toFixed(2) ?? '-'}</p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardBody>

              <hr className='invoice-spacing' />

              <CardBody className='invoice-padding pt-0'>
                <Row>
                  <Col sm='12'>
                    <span className='font-weight-bold'>Instructions: </span>
                    <span>
                      {data?.instructions}
                    </span>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>


      {/* {Order Status} */}
      <Modal isOpen={orderStatusModal} toggle={() => setOrderStatusModal(!orderStatusModal)} size={'md'}>
        <ModalHeader toggle={() => setOrderStatusModal(!orderStatusModal)}>Order Status</ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit(handleOrderStatus)}>
            <Row>
              <Col md={12}>
                <FormGroup >
                  <Label for="orderStatus">
                    Order <span className='text-danger'>*</span>
                  </Label>
                  <CustomInput
                    className='form-control'
                    type='select'
                    id='orderStatus'
                    name='orderStatus'
                    value={orderStatus}
                    onChange={(e) => { setOrderStatus(e.target.value); setValue('orderStatus', e.target.value) }}
                    innerRef={register({ required: true })}
                    invalid={errors.orderStatus && true}
                  >
                    <option value="">Select</option>
                    <option value="0">Pending</option>
                    <option value="1">Accepted</option>
                    <option value="2">Delivered</option>
                    <option value="3">Cancelled</option>
                    <option value="4">Cleared</option>
                  </CustomInput>
                </FormGroup>
              </Col>

            </Row>
            <ModalFooter>
              <Button disabled={submitting} color='primary'>
                {(submitting) ? <> <Spinner color='white' size='sm' /> </> : 'Save'}
              </Button>
              <Button color='secondary' onClick={() => setOrderStatusModal(!orderStatusModal)}>
                Cancel
              </Button>
            </ModalFooter>
          </Form>
        </ModalBody>
      </Modal>
    </Fragment >
  )
}

export default ViewOrder
