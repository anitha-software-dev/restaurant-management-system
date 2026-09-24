// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** Invoice List Sidebar
import { Link } from 'react-router-dom'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Trash2, Search, Eye, RefreshCcw, Settings } from 'react-feather'
import { Edit } from 'react-feather/dist'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Form, ModalFooter, FormGroup, Spinner } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import { Service } from '@src/services/Service'
import { formatPhoneNumber, OpenNotification } from '@src/views/components/Helper'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Spinners from '@components/spinner/Loading-spinner'
import InputPasswordToggle from '@components/input-password-toggle'

const MySwal = withReactContent(Swal)

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm } from 'react-hook-form'
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../../../configs/firebaseConfig'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, handleFilter, searchTerm, setSearchTerm, handleReset, setCurrentPage, getUserList, handleAdd }) => {
  return (
    <div className='invoice-list-table-header w-100 mr-1 ml-50 mt-2 mb-75'>
      <Row>
        <Col xl='5' className='d-flex align-items-center p-0'>
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
        <Col
          xl='7'
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
                    getUserList({ searchTerm, page: 1 })
                    setCurrentPage(1)
                  }
                }}
              />
              <InputGroupAddon addonType='append'>
                <Button color='secondary' outline onClick={() => {
                  if (searchTerm !== '' && searchTerm.length > 2) {
                    getUserList({ searchTerm, page: 1 }); setCurrentPage(1)
                  }
                }}>
                  <Search size={14} />
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <Button.Ripple className='mr-1' color='secondary' title="Reset" onClick={() => handleReset()}>
            <RefreshCcw size={14} />
          </Button.Ripple>

          {/* <Button.Ripple color='primary' tag={Link} to={`/clients/create`}> */}
          <Button.Ripple color='primary' onClick={() => handleAdd()}>
            Add New
          </Button.Ripple>
        </Col>
      </Row>
    </div>
  )
}

const CustomersList = () => {

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [customersList, setCustomersList] = useState([])
  const [viewModal, setViewModal] = useState(false)
  const [editInfo, setEditInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [addUserModal, setAddUserModal] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register, control, watch, handleSubmit, formState: { errors }, reset } = useForm()

  const getUserList = async (param = {}) => {
    return false
    setLoading(true)
    try {

    } catch (error) {
      console.error('Error fetching QR tags:', error)
      OpenNotification('error', 'Oops!', 'Something went wrong!')
    } finally {
      setLoading(false)
    }
  }

  const customers = [
    {
      id: "#12345",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "9551234567",
      address: "Delhi"
    },
    {
      id: "#67890",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "959876543",
      address: "Kolkata"
    },
    {
      id: "#54321",
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      phone: "9079460958",
      address: "Bangalore"
    },
    {
      id: "#98765",
      name: "Bob Brown",
      email: "bob.brown@example.com",
      phone: "9000555123",
      address: "Mumbai"
    },
    {
      id: "#11223",
      name: "Carlos Martinez",
      email: "carlos.martinez@example.com",
      phone: "9600555789",
      address: "Chennai"
    }
  ]

  useEffect(() => {
    setCustomersList(customers)
  }, [])

  const handlePagination = page => {
    setCurrentPage(page.selected + 1)
    getUserList({ page: page.selected + 1 })
  }

  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    setRowsPerPage(value)
    setCurrentPage(1)
    getUserList({ limit: value, page: 1 })
  }

  const handleFilter = val => {
    getUserList()
  }

  const handleReset = () => {
    setSearchTerm('')
    setCurrentPage(1)
    setRowsPerPage(10)
    getUserList({ reset: true })
  }

  const AddCustomers = (data) => {
    setSubmitting(true)

    try {
      const newCustomer = {
        id: `#${Math.floor(Math.random() * 100000)}`,
        name,
        email,
        phone,
        address
      }

      if (editInfo) {

        const updatedList = customersList.map((customer) => {
          return customer.id === editInfo.id ? { ...editInfo, ...newCustomer } : customer
        })
        setCustomersList(updatedList)
        OpenNotification('success', 'Success', 'Customer details updated successfully!')
      } else {
        // Add new customer
        setCustomersList((prevList) => [newCustomer, ...prevList])
        OpenNotification('success', 'Success', 'Customer details added successfully!')
      }

      setAddUserModal(false)
      setName('')
      setEmail('')
      setPhone('')
      setAddress('')
      setEditInfo(null)
    } catch (error) {
      console.error('Error saving customer:', error)
      OpenNotification('error', 'Oops!', 'Failed to save customer details!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdd = () => {
    setName('')
    setEmail('')
    setPhone('')
    setAddress('')
    setEditInfo(null)
    setAddUserModal(!addUserModal)
  }

  const handleEdit = (row) => {
    setName(row && row.name)
    setEmail(row && row.email)
    setPhone(row && row.phone)
    setAddress(row && row.address)
    setEditInfo(row)
    setAddUserModal(!addUserModal)
  }

  { /* DELETE CLIENTS */ }
  const handleDelete = (row) => {

    return MySwal.fire({
      title: 'Are you sure?',
      text: "You want to delete this Customer!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      customClass: {
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-outline-secondary ml-1'
      },
      buttonsStyling: false
    }).then(async (result) => {
      if (result.value) {
        try {
          const updatedList = customersList.filter(customer => customer.id !== row.id)
          setCustomersList(updatedList)
          OpenNotification('success', 'Deleted!', 'Customer details deleted successfully!')
        } catch (error) {
          console.error('Error deleting customer:', error)
          OpenNotification('error', 'Oops!', 'Failed to delete customer details.')
        }
      }
    })
  }

  // ** Custom Pagination
  const CustomPagination = () => {
    const count = Number((totalRecords / rowsPerPage))

    return (
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
    )
  }

  const columns = [
    {
      name: 'ID',
      selector: 'id',
      maxWidth: '100px',
      sortable: true,
      cell: row => (
        <>
          {(row) ? (
            <div >
              <span className=''>{(row.id) ? row.id : '-'}</span>
            </div>
          ) : '-'}
        </>
      )
    },
    {
      name: 'Name',
      selector: 'name',
      maxWidth: '150px',
      cell: row => <>{(row.name) ? row.name : '-'}</>
    },
    {
      name: 'Email',
      selector: 'email',
      minWidth: '275px',
      cell: row => <>{(row.email) ? row.email : '-'}</>
    },
    {
      name: 'Phone Number',
      selector: 'phone',
      maxWidth: '150px',
      cell: row => <>{(row.phone) ? `${row.phone}` : '-'}</>
    },
    {
      name: 'Address',
      selector: 'Address',
      maxWidth: '150px',
      cell: row => <>{(row.address) ? `${row.address}` : '-'}</>
    },
    {
      name: 'Actions',
      selector: 'actions',
      minWidth: '200px',
      center: true,
      cell: row => (
        <>

          <Button.Ripple outline color='secondary' size='sm' onClick={() => { setEditInfo(row); setViewModal(!viewModal) }}>
            <Eye size={14} />
          </Button.Ripple> &nbsp;
          <Button.Ripple outline color='info' size='sm' onClick={() => handleEdit(row)}>
            <Edit size={14} />
          </Button.Ripple> &nbsp;
          <Button.Ripple outline color='danger' size='sm' onClick={() => handleDelete(row)}>
            <Trash2 size={14} />
          </Button.Ripple>
        </>
      )
    }
  ]

  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='Manage Customers' breadCrumbParent='Customers' breadCrumbActive='List' />
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
            data={customersList}
            subHeaderComponent={
              <CustomHeader
                handlePerPage={handlePerPage}
                rowsPerPage={rowsPerPage}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleFilter={handleFilter}
                handleReset={handleReset}
                setCurrentPage={setCurrentPage}
                getUserList={getUserList}
                handleAdd={handleAdd}
              />
            }
          />
        </div>
      </Card>


      {/* {Add Customer} */}
      <Modal isOpen={addUserModal} toggle={() => setAddUserModal(!addUserModal)} size={'sm'}>
        <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>{editInfo ? 'Edit Details' : 'Add Customer'}</ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit(AddCustomers)}>

            <FormGroup>
              <Label for='name'>Name <span className='text-danger'>*</span></Label>
              <Input
                type='text'
                id='name'
                name='name'
                value={name}
                onChange={e => setName(e.target.value)}
                innerRef={register({ required: true })}
                invalid={errors.name && true}
                placeholder='Enter Name'
              />
            </FormGroup>
            <FormGroup >

              <Label className='form-label' for='email'>
                Email <span className='text-danger'>*</span>
              </Label>
              <Input
                type='email'
                id='email'
                name='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                innerRef={register({ required: true })}
                invalid={errors.email && true}
                placeholder='Enter Email'
              />

              {errors.password && (
                <small className='text-danger'>{errors.password.message}</small>
              )}
            </FormGroup>
            <FormGroup>
              <Label for='phone'>Phone Number<span className='text-danger'>*</span></Label>
              <Input
                id='phone'
                name='phone'
                value={phone}
                onChange={e => setPhone(e.target.value)}
                innerRef={register({ required: true })}
                invalid={errors.phone && true}
                placeholder='Enter Phone Number'
              />
            </FormGroup>
            <FormGroup>
              <Label for='address'>Address<span className='text-danger'>*</span></Label>
              <Input
                id='address'
                name='address'
                value={address}
                onChange={e => setAddress(e.target.value)}
                innerRef={register({ required: true })}
                invalid={errors.address && true}
                placeholder='Enter Address'
              />
            </FormGroup>
            <ModalFooter>
              <Button disabled={submitting} color='primary'>
                {(submitting) ? <> <Spinner color='white' size='sm' /> </> : 'Save'}
              </Button>
              <Button color='secondary' onClick={() => setAddUserModal(!addUserModal)}>
                Cancel
              </Button>
            </ModalFooter>
          </Form>
        </ModalBody>
      </Modal>

      {/******* VIEW CLIENT DETAIL ********/}
      <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-centered' size="sm">
        <ModalHeader toggle={() => setViewModal(!viewModal)}>View Customer Details</ModalHeader>
        <ModalBody>
          <Row>
            <Col md='12'>
              <dl className='view-recipient'>
                <Row>
                  <Col md='12'><strong>ID</strong> <dd>{editInfo && editInfo.id ? editInfo.id : '-'}</dd></Col>
                  <Col md='12'><strong>Name</strong> <dd>{editInfo && editInfo.name ? editInfo.name : '-'}</dd></Col>
                  <Col md='12'><strong>Email</strong> <dd>{editInfo && editInfo.email ? editInfo.email : '-'}</dd></Col>
                  <Col md='12'><strong>Phone Number</strong> <dd>{editInfo && editInfo.phone ? `${editInfo.phone}` : '-'}</dd></Col>
                  <Col md='12'><strong>Address</strong> <dd>{editInfo && editInfo.address ? `${editInfo.address}` : '-'}</dd></Col>
                </Row>
              </dl>

            </Col>
          </Row>
        </ModalBody>
      </Modal>

    </Fragment>
  )
}

export default CustomersList
