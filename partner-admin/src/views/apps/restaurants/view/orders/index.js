// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** Invoice List Sidebar
import { useParams, useHistory } from 'react-router-dom'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Search, Eye, RefreshCcw } from 'react-feather'
import { Edit } from 'react-feather/dist'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Form, ModalFooter, FormGroup, Spinner, Badge, UncontrolledTooltip } from 'reactstrap'
import { OpenNotification, validateRestaurant } from '@src/views/components/Helper'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Spinners from '@components/spinner/Loading-spinner'
import Config from '@src/configs/config.json'

const MySwal = withReactContent(Swal)

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm } from 'react-hook-form'
import { collection, doc, getDocs, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '@src/configs/firebaseConfig'
import { format } from 'date-fns'
import { useDispatch } from 'react-redux'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, searchTerm, setSearchTerm, handleReset, setCurrentPage, getOrdersList, handleAdd, status, setStatus }) => {
  return (
    <div className='invoice-list-table-header w-100 mr-1 ml-50 mt-2 mb-75'>
      <Row>
        <Col xl='3' className='d-flex align-items-center p-0'>
          <div className='d-flex align-items-center w-100'>
            <Label for='rows-per-page'>Show</Label>
            <CustomInput
              className='form-control mx-50'
              type='select'
              id='rows-per-page'
              value={rowsPerPage}
              onChange={handlePerPage}
              style={{
                width: '5rem',
                padding: '0 0.8rem',
                backgroundPosition: 'calc(100% - 3px) 11px, calc(100% - 20px) 13px, 100% 0'
              }}
            >
              <option value='10'>10</option>
              <option value='25'>25</option>
              <option value='50'>50</option>
            </CustomInput>
            <Label for='rows-per-page'>Entries</Label>
          </div>
        </Col>
        <Col xl='3'>
          <CustomInput
            className='form-control mr-2 w-100'
            type='select'
            id='used'
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setCurrentPage(1)
              getOrdersList({ status: e.target.value, page: 1 })
            }}
          >
            <option defaultValue='Select Status' hidden>Select Status</option>
            <option value=''>ALL</option>
            <option value='0'>PENDING</option>
            <option value='1'>DELIVERED</option>
            <option value='2'>CANCELLED</option>
          </CustomInput>
        </Col>
        <Col
          xl='6'
          className='d-flex align-items-sm-center justify-content-lg-end justify-content-start flex-lg-nowrap flex-wrap flex-sm-row flex-column pr-lg-1 p-0 mt-lg-0 mt-1'
        >
          <div className='mr-1'>
            <InputGroup>
              <Input
                id='search-invoice'
                type='text'
                value={searchTerm}
                placeholder="Search"
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchTerm.trim() !== '' && searchTerm.length > 2) {
                    getOrdersList({ searchTerm, page: 1 })
                    setCurrentPage(1)
                  }
                }}
              />
              <InputGroupAddon addonType='append'>
                <Button color='secondary' outline onClick={() => {
                  if (searchTerm !== '' && searchTerm.length > 2) {
                    getOrdersList({ searchTerm, page: 1 }); setCurrentPage(1)
                  }
                }}>
                  <Search size={13} />
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <Button.Ripple color='secondary' title="Reset" onClick={() => handleReset()}>
            <RefreshCcw size={14} />
          </Button.Ripple>

          {/* <Button.Ripple color='primary' tag={Link} to={`/clients/create`}> */}
          {/* <Button.Ripple color='primary' onClick={() => handleAdd()}>
            Add New
          </Button.Ripple> */}
        </Col>
      </Row>
    </div >
  )
}

const OrdersList = () => {

  const { id } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [ordersList, setOrdersList] = useState([])
  const [viewModal, setViewModal] = useState(false)
  const [editInfo, setEditInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [tablesList, setTablesList] = useState([])
  const [currencySymbol, setCurrencySymbol] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [orderStatusModal, setOrderStatusModal] = useState(false)
  const [payment, setPayment] = useState('')
  const [paymentModal, setPaymentModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, control, watch, handleSubmit, setValue, formState: { errors }, reset } = useForm()
  const history = useHistory()
  const dispatch = useDispatch()

  const getTablesList = async () => {
    try {
      const collectionRef = collection(db, 'partnerqrs')

      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token not found. Redirecting to login.')
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
      }

      const baseQuery = query(collectionRef, where('restaurantId', '==', token), orderBy('createdAt', 'desc'))

      const querySnapshot = await getDocs(baseQuery)
      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data()
        const { password, ...rest } = data
        return { ...rest, id: doc.id }
      })

      setTablesList(docs)
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {

    }
  }

  const getOrdersList = async (param = {}) => {
    setLoading(true)
    try {
      // await validateRestaurant()
      validateRestaurant(dispatch, history).catch(console.error)
      const collectionRef = collection(db, 'orders')
      let results = []

      const searchKeyword = param?.reset ? '' : (param?.search || searchTerm)
      const page = param?.reset ? 1 : (param?.page || currentPage)
      const limitCount = param?.reset ? 10 : (param?.limit || rowsPerPage)
      const filterStatus = param?.reset ? '' : (param?.status ?? status)

      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token not found. Redirecting to login.')
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
      }

      // Build the base query
      const baseQuery = query(collectionRef, where('restaurantId', '==', id))

      const querySnapshot = await getDocs(baseQuery)
      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data()
        const { password, ...rest } = data

        const createdAtTimestamp = data.createdAt
        const createdAtDate = createdAtTimestamp?.toDate?.() || new Date()
        const createdAtFormatted = format(createdAtDate, 'dd/MM/yyyy, hh:mm:ss a')

        return { ...rest, id: doc.id, createdAtDate, createdAtFormatted }
      })

      const sortedDocs = docs.sort((a, b) => b.createdAtDate - a.createdAtDate)

      if (filterStatus !== '') {
        results = sortedDocs.filter(doc => doc.orderStatus === Number(filterStatus))
      } else if (searchKeyword.length >= 3) {
        results = sortedDocs.filter(doc => doc.id?.toLowerCase().includes(searchKeyword.toLowerCase())
        )
      } else {
        results = sortedDocs
      }

      const startIndex = (page - 1) * limitCount
      const paginatedResults = results.slice(startIndex, startIndex + limitCount)

      setOrdersList(paginatedResults)
      setTotalRecords(results.length)
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getOrdersList()
    getTablesList()
  }, [id])


  const getCurrencyData = async () => {
    try {
      const collectionRef = collection(db, 'configurations')
      const querySnapshot = await getDocs(query(collectionRef))

      let symbol = ''

      querySnapshot.forEach(docSnapshot => {
        const data = docSnapshot.data()

        if (data.currency?.symbol) {
          symbol = data.currency.symbol
        }
      })

      if (symbol) {
        setCurrencySymbol(symbol)
      }
    } catch (error) {
      console.error('Error fetching currency data:', error)
    }
  }

  useEffect(() => {
    getCurrencyData()
  }, [])

  const handlePagination = page => {
    setCurrentPage(page.selected + 1)
    getOrdersList({ page: page.selected + 1 })
  }

  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    setRowsPerPage(value)
    setCurrentPage(1)
    getOrdersList({ limit: value, page: 1 })
  }

  const handleReset = () => {
    setStatus('')
    setSearchTerm('')
    setCurrentPage(1)
    setRowsPerPage(10)
    getOrdersList({ reset: true })
  }

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
        return 'CANCELLLED'
      case 4:
        return 'CLEARED'
      default:
        return '-'
    }
  }

  const handlePayment = async (data) => {

    const token = localStorage.getItem('token')
    if (!token) {
      console.error('Token not found. Redirecting to login.')
      OpenNotification('error', 'Error', 'Please login again!')
      history.push('/login')
    }

    try {

      const itemRef = doc(db, 'orders', editInfo.id)

      await updateDoc(itemRef, {
        paymentStatus: Number(data.payment),
        updatedAt: Timestamp.now()
      })
      setPaymentModal(false)
      setViewModal(false)
      getOrdersList()
      OpenNotification('success', 'Success!', 'Payment Status updated successfully')
    } catch (error) {
      console.error("Error updating payment status:", error)
      OpenNotification('error', 'Error', 'Failed to update the payment status.')
    }
  }

  const handleOrderStatus = async (data) => {

    const token = localStorage.getItem('token')
    if (!token) {
      console.error('Token not found. Redirecting to login.')
      OpenNotification('error', 'Error', 'Please login again!')
      history.push('/login')
    }

    try {

      const itemRef = doc(db, 'orders', editInfo.id)

      await updateDoc(itemRef, {
        orderStatus: Number(data.orderStatus),
        updatedAt: Timestamp.now()
      })
      setOrderStatusModal(false)
      setViewModal(false)
      getOrdersList()
      OpenNotification('success', 'Success!', 'Order Status updated successfully')
    } catch (error) {
      console.error("Error updating order status:", error)
      OpenNotification('error', 'Error', 'Failed to update the order status.')
    }
  }


  // ** Custom Pagination
  const CustomPagination = () => {
    const count = Number((totalRecords / rowsPerPage))

    return (
      <div className="d-flex justify-content-between align-items-center p-1">
        <p className='mb-1 ml-1'>Total Entries: {totalRecords}</p>
        <ReactPaginate
          previousLabel={''}
          nextLabel={''}
          pageCount={count || 1}
          activeClassName='active'
          forcePage={currentPage !== 0 ? currentPage - 1 : 0}
          onPageChange={page => handlePagination(page)}
          pageClassName={'page-item'}
          nextLinkClassName={'page-link'}
          nextClassName={'page-item next'}
          previousClassName={'page-item prev'}
          previousLinkClassName={'page-link'}
          pageLinkClassName={'page-link'}
          containerClassName={'pagination react-paginate justify-content-end my-2 pr-1'}
        />
      </div>
    )
  }

  const columns = [

    {
      name: 'Transaction ID',
      selector: 'transaction',
      minWidth: '250px',
      cell: row => <>{(row.transactionId) ? `#${row.transactionId}` : '-'}</>
    },
    {
      name: 'Date',
      selector: 'date',
      cell: row => {
        const formatted = row.createdAtFormatted
        if (formatted) {
          const date = formatted.split(',')[0]?.trim()
          return <>{date}</>
        }
        return '-'
      }
    },
    {
      name: 'Assigned',
      selector: 'items',
      cell: row => <>{row?.qrType ? `${row.qrType} - ${row.qrNumber}` : row?.qrNumber || '-'}</>
    },
    {
      name: 'Total Amount',
      selector: 'total',
      cell: row => <>{(row.grandTotal) ? `${row.currencySymbol || currencySymbol} ${parseFloat(row.grandTotal).toFixed(2)}` : '-'}</>
    },
    {
      name: 'Order Status',
      selector: 'status',
      cell: row => (
        <Badge color={getOrderBadgeColor(row.orderStatus)} pill>
          {getOrderBadgeName(row.orderStatus)}
        </Badge>
      )
    },
    {
      name: 'Actions',
      selector: 'actions',
      center: true,
      cell: (row, index) => (
        <>
          <Button.Ripple outline color='secondary' id={`order-view-${index + 1}`} size='sm' onClick={() => { setEditInfo(row); setViewModal(!viewModal) }}>
            <Eye size={14} />
          </Button.Ripple>

          <UncontrolledTooltip placement='top' target={`order-view-${index + 1}`}>
            VIEW
          </UncontrolledTooltip>
        </>
      )
    }
  ]

  return (
    <Fragment>
      <Card>
        <div className='invoice-list-dataTable mb-3'>
          <DataTable
            noHeader
            pagination
            subHeader
            responsive
            paginationServer
            columns={columns}
            sortIcon={<ChevronDown />}
            className='react-dataTable'
            progressPending={loading}
            progressComponent={<div className="py-5 d-flex align-items-center"><Spinners className="w-14 text-secondary mr-1" /></div>}
            paginationComponent={CustomPagination}
            data={ordersList}
            subHeaderComponent={
              <CustomHeader
                handlePerPage={handlePerPage}
                rowsPerPage={rowsPerPage}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleReset={handleReset}
                setCurrentPage={setCurrentPage}
                getOrdersList={getOrdersList}
                status={status}
                setStatus={setStatus}
              />
            }
          />
        </div>
      </Card>

      {/******* VIEW Order DETAIL ********/}
      <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-centered' size="md">
        <ModalHeader toggle={() => setViewModal(!viewModal)}><strong>View Order Details</strong></ModalHeader>
        <ModalBody>
          <Row>
            <Col md="12" className="mb-2">
              <h5><strong className='mr-1' style={{ fontWeight: 'bold' }}>Order ID:</strong> <span style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{editInfo?.transactionId || '-'}</span></h5>
              <h6 className='mr-1 mt-1'><strong style={{ fontWeight: 'bold' }}>Date:</strong> &nbsp; &nbsp;<span style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{editInfo?.createdAtFormatted || '-'}</span></h6>

              <h6 className='mr-1 mt-1'>
                <strong style={{ fontWeight: 'bold' }}>Assigned:</strong>&nbsp;&nbsp;
                <span style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                  {`${editInfo?.qrType || '-'} - ${editInfo?.qrNumber || '-'}`}
                </span>
              </h6>
            </Col>

            <Col md="12">
              <h6 className="mb-1" style={{ fontWeight: 'bold' }}>Order Items</h6>
              {editInfo?.items && editInfo.items.length > 0 ? (
                <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}>
                  {editInfo.items.map((item, index) => (
                    <div key={index} style={{ paddingTop: "15px", borderBottom: index < editInfo.items.length - 1 ? '1px solid #eee' : 'none' }}>
                      <Row className="mb-2 align-items-center">
                        <Col xs="4">
                          <img
                            src={item.images && item.images.length > 0 ? `${Config.MEDIA_URL}${item.images[0]}?alt=media` : 'https://via.placeholder.com/60'}
                            alt={item.name}
                            style={{ width: '80px', borderRadius: '8px' }}
                          />
                        </Col>
                        <Col xs="8">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className='d-flex flex-column align-items-center'>
                              <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                              <span className='text-capitalize' style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{item.portion ? `(${item.portion})` : ''}</span>
                            </div>
                            <span style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{item.quantity} x {(editInfo?.currencySymbol || currencySymbol)} {parseFloat(item.price).toFixed(2)}</span>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(0, 0, 0, 0.87)' }}>-</p>
              )}
            </Col>

            <Col md="8" className="mt-3 ml-auto">
              <h6 className="mb-1" style={{ fontWeight: 'bold' }}>Order Summary</h6>

              {editInfo?.taxName && editInfo?.taxValue ? (
                <>
                  <div className="d-flex justify-content-between mb-1">
                    <span><strong >Subtotal:</strong></span>
                    <span style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {(editInfo?.currencySymbol || currencySymbol)} {editInfo?.subTotal?.toFixed(2) || '-'}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between mb-1">
                    <span>
                      <strong>{editInfo.taxName} ({editInfo.taxValue}%) :</strong>
                    </span>
                    <span style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {(editInfo?.currencySymbol || currencySymbol)} {(editInfo.subTotal * (editInfo.taxValue / 100)).toFixed(2)}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between">
                    <span><strong style={{ fontWeight: 'bold' }}>Total:</strong></span>
                    <strong style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {(editInfo?.currencySymbol || currencySymbol)} {editInfo?.grandTotal?.toFixed(2) ?? '-'}
                    </strong>
                  </div>
                </>
              ) : (
                <div className="d-flex justify-content-between">
                  <span><strong style={{ fontWeight: 'bold' }}>Total:</strong></span>
                  <strong style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {(editInfo?.currencySymbol || currencySymbol)} {editInfo?.subTotal?.toFixed(2) ?? '-'}
                  </strong>
                </div>
              )}
            </Col>

            <Col md="12" className="mt-4">
              <h6 style={{ fontWeight: 'bold' }}>Instructions</h6>
              <p style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{editInfo?.instructions || '-'}</p>
            </Col>

            <Col md="12">
              <h6 style={{ fontWeight: 'bold' }}>Payment Mode</h6>
              <p className="text-capitalize" style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{editInfo?.paymentMode || '-'}</p>
            </Col>

            {/* <Col md="12">
              <h6><strong>Payment Status</strong><a className='ml-1' style={{ color: 'blue', textDecoration: 'underline' }} onClick={() => {
                setPayment(editInfo.paymentStatus)
                setPaymentModal(!paymentModal)
              }}><Edit size={14} /> Change Status</a></h6>
              <Badge color={getBadgeColor(editInfo?.paymentStatus)} pill>
                {getBadgeName(editInfo?.paymentStatus)}
              </Badge>
            </Col> */}


            <Col md="12" className='mt-1 mb-1'>
              <h6 style={{ fontWeight: 'bold' }}>Order Status<a className='ml-1' style={{ color: 'blue', textDecoration: 'underline' }} onClick={() => {
                setOrderStatus(editInfo.orderStatus)
                setOrderStatusModal(!orderStatusModal)
              }}><Edit size={14} /> Change Status</a></h6>
              <Badge color={getOrderBadgeColor(editInfo?.orderStatus)} pill>
                {getOrderBadgeName(editInfo?.orderStatus)}
              </Badge>
            </Col>
          </Row>
        </ModalBody>
      </Modal>

      {/* {Payment Status} */}
      {/* <Modal isOpen={paymentModal} toggle={() => setPaymentModal(!paymentModal)} size={'md'}>
        <ModalHeader toggle={() => setPaymentModal(!paymentModal)}>Payment Status</ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit(handlePayment)}>
            <Row>
              <Col md={12}>
                <FormGroup >
                  <Label for="payment">
                    Payment <span className='text-danger'>*</span>
                  </Label>
                  <CustomInput
                    className='form-control'
                    type='select'
                    id='payment'
                    name='payment'
                    value={payment}
                    onChange={(e) => { setPayment(e.target.value); setValue('payment', e.target.value) }}
                    innerRef={register({ required: true })}
                    invalid={errors.payment && true}
                  >
                    <option value="">
                      Select
                    </option>
                    <option value="0">Pending</option>
                    <option value="1">Success</option>
                    <option value="2">Cancelled</option>
                  </CustomInput>
                </FormGroup>
              </Col>

            </Row>
            <ModalFooter>
              <Button disabled={submitting} color='primary'>
                {(submitting) ? <> <Spinner color='white' size='sm' /> </> : 'Save'}
              </Button>
              <Button color='secondary' onClick={() => setPaymentModal(!paymentModal)}>
                Cancel
              </Button>
            </ModalFooter>
          </Form>
        </ModalBody>
      </Modal> */}

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
                    <option value="">
                      Select
                    </option>
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

    </Fragment>
  )
}

export default OrdersList
