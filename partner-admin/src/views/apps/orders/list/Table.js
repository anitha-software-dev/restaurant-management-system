// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** Invoice List Sidebar
import { Link, useHistory } from 'react-router-dom'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Search, Eye, RefreshCcw, Calendar } from 'react-feather'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Badge, UncontrolledTooltip } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import { OpenNotification, validateRestaurant } from '@src/views/components/Helper'
import Spinners from '@components/spinner/Loading-spinner'

import { useForm } from 'react-hook-form'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../../../configs/firebaseConfig'
import { format } from 'date-fns'
import { useDispatch } from 'react-redux'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/flatpickr.css'

// ** Styles
import '@styles/react/libs/tables/react-dataTable-component.scss'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, searchTerm, setSearchTerm, handleReset, setCurrentPage, getOrdersList, status, setStatus, fromDate, setFromDate, toDate, setToDate }) => {
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

        </Col>

      </Row>
    </div >
  )
}

const OrdersList = () => {

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [ordersList, setOrdersList] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currencySymbol, setCurrencySymbol] = useState('')

  const { register, control, watch, handleSubmit, setValue, formState: { errors }, reset } = useForm()
  const history = useHistory()
  const dispatch = useDispatch()

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
      const fromDates = param?.reset ? '' : (param?.fromDate || fromDate)
      const toDates = param?.reset ? '' : (param?.toDate ?? toDate)

      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token not found. Redirecting to login.')
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
      }

      // Build the base query
      const baseQuery = query(collectionRef, where('restaurantId', '==', token))
      const querySnapshot = await getDocs(baseQuery)

      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data()
        const { password, ...rest } = data

        const createdAtTimestamp = data.createdAt
        const createdAtDate = createdAtTimestamp?.toDate?.() || new Date()
        const createdAtFormatted = format(createdAtDate, 'dd/MM/yyyy, hh:mm:ss a')

        return {
          ...rest, id: doc.id, createdAtDate, createdAtFormatted
        }
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

      if (fromDates && toDates) {
        const from = new Date(fromDates)
        const to = new Date(toDates)
        to.setHours(23, 59, 59, 999) // include the whole 'to' day

        results = results.filter(doc => {
          return doc.createdAtDate >= from && doc.createdAtDate <= to
        })
      } else if (fromDates) {
        const from = new Date(fromDates)
        results = results.filter(doc => doc.createdAtDate >= from)
      } else if (toDates) {
        const to = new Date(toDates)
        to.setHours(23, 59, 59, 999)
        results = results.filter(doc => doc.createdAtDate <= to)
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
  }, [])

  const getCurrencyData = async () => {
    try {
      const collectionRef = collection(db, 'configurations')
      const querySnapshot = await getDocs(query(collectionRef))

      let symbol = ''

      querySnapshot.forEach(docSnapshot => {
        const data = docSnapshot.data()

        if (data.currency?.symbol) {
          // console.log("currency:", data.currency.symbol)
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
    setFromDate('')
    setToDate('')
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
        return 'CANCELLED'
      case 4:
        return 'CLEARED'
      default:
        return '-'
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
        const createdAt = row.createdAt
        if (createdAt?.seconds) {
          const date = new Date(createdAt.seconds * 1000)
          return <>{format(date, 'dd/MM/yyyy')}</>
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
      cell: row => <>{
        (row.grandTotal) ? `${row.currency.symbol || currencySymbol} ${parseFloat(row.grandTotal).toFixed(2)}` : '-'}
      </>
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
      name: 'Action',
      selector: 'action',
      center: true,
      cell: (row, index) => (
        <>

          <Button outline color='secondary' tag={Link} to={`/order/view/${row.id}`} id={`button-view-${index + 1}`} size='sm'>
            <Eye size={14} />
          </Button>

          <UncontrolledTooltip placement='top' target={`button-view-${index + 1}`}>
            VIEW
          </UncontrolledTooltip>
        </>
      )
    }
  ]

  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='Manage Orders' breadCrumbParent='Orders' breadCrumbActive='List' />

      <div
        className="d-flex justify-content-center align-items-center w-100"
      >
        <Card className=" d-flex justify-content-center w-100 py-2 px-2">
          <Row>
            <Col xl='5' className='d-flex align-items-center mb-1 mb-xl-0'>
              <div className='d-flex align-items-center mb-1 mr-1 mb-md-0'>
                <Label className='mr-1'>From:</Label>
                <Flatpickr
                  className='form-control'
                  value={fromDate ? new Date(fromDate) : null} // Convert stored string back to Date for Flatpickr
                  placeholder='DD-MM-YYYY'
                  options={{
                    dateFormat: 'd-m-Y' // Capital Y = four-digit year
                  }}
                  onChange={([selectedDate]) => {
                    const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : ''
                    setFromDate(formattedDate)
                    setCurrentPage(1)
                    getOrdersList({ fromDate: formattedDate, page: 1 })
                  }}
                />
                <Label className='mx-1'>To:</Label>
                <Flatpickr
                  className='form-control'
                  placeholder='DD-MM-YYYY'
                  value={toDate ? new Date(toDate) : null} // Convert stored YYYY-MM-DD string to Date
                  options={{
                    dateFormat: 'd-m-Y' // Show as DD-MM-YYYY
                  }}
                  onChange={([selectedDate]) => {
                    const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : ''
                    setToDate(formattedDate)
                    setCurrentPage(1)
                    getOrdersList({ toDate: formattedDate, page: 1 })
                  }}
                />
              </div>
            </Col>
            <Col
              xl='3'
              className='d-flex align-items-sm-center justify-content-lg-end justify-content-start flex-lg-nowrap flex-wrap flex-sm-row flex-column pr-lg-1 p-0 mt-lg-0 mt-1'
            >
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
                <option value=''>ALL STATUS</option>
                <option value='0'>PENDING</option>
                <option value='1'>DELIVERED</option>
                <option value='2'>CANCELLED</option>
              </CustomInput>
            </Col>
            <Col
              xl='4'
              className='d-flex align-items-sm-center justify-content-lg-end justify-content-start flex-lg-nowrap flex-wrap flex-sm-row flex-column pr-lg-1 p-0 mt-lg-0 mt-1'
            >

              <div className='mr-1 mt-0'>
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
                    <Button color='secondary' style={{ height: "2.8rem" }} outline onClick={() => {
                      if (searchTerm !== '' && searchTerm.length > 2) {
                        getOrdersList({ searchTerm, page: 1 }); setCurrentPage(1)
                      }
                    }}>
                      <Search size={14} />
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <Button.Ripple className='mt-0' color='secondary' title="Reset" onClick={() => handleReset()}>
                <RefreshCcw size={14} />
              </Button.Ripple>

            </Col>
          </Row>
        </Card>
      </div>

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
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
              />
            }
          />
        </div>
      </Card>

    </Fragment>
  )
}

export default OrdersList
