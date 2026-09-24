// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** Invoice List Sidebar
import { Link, useHistory } from 'react-router-dom'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Trash2, Search, Eye, RefreshCcw, Settings } from 'react-feather'
import { Edit } from 'react-feather/dist'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Form, ModalFooter, FormGroup, Spinner, UncontrolledTooltip } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import { Service } from '@src/services/Service'
import { formatPhoneNumber, OpenNotification, validateRestaurant } from '@src/views/components/Helper'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Spinners from '@components/spinner/Loading-spinner'
import InputPasswordToggle from '@components/input-password-toggle'

const MySwal = withReactContent(Swal)

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm } from 'react-hook-form'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../../../../configs/firebaseConfig'
import { useDispatch } from 'react-redux'
import { handleLogout } from '@store/actions/auth'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, searchTerm, setSearchTerm, handleReset, setCurrentPage, getMenusList, handleAdd }) => {
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
                    getMenusList({ searchTerm, page: 1 })
                    setCurrentPage(1)
                  }
                }}
              />
              <InputGroupAddon addonType='append'>
                <Button color='secondary' style={{ height: "2.8rem" }} outline onClick={() => {
                  if (searchTerm !== '' && searchTerm.length > 2) {
                    getMenusList({ searchTerm, page: 1 }); setCurrentPage(1)
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

const MenusList = () => {

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [menusList, setMenusList] = useState([])
  const [viewModal, setViewModal] = useState(false)
  const [editInfo, setEditInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [addUserModal, setAddUserModal] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register, control, setValue, watch, handleSubmit, formState: { errors }, reset } = useForm()
  const history = useHistory()
  const dispatch = useDispatch()


  const getMenusList = async (param = {}) => {
    setLoading(true)
    try {

      validateRestaurant(dispatch, history).catch(console.error)

      const collectionRef = collection(db, 'menus')
      let results = []

      const searchKeyword = param?.reset ? '' : (param?.search || searchTerm)
      const page = param?.reset ? 1 : (param?.page || currentPage)
      const limitCount = param?.reset ? 10 : (param?.limit || rowsPerPage)

      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token not found. Redirecting to login.')
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
      }

      // Build the base query
      const baseQuery = query(collectionRef, where('restaurantId', '==', token), orderBy('createdAt', 'desc'))

      const querySnapshot = await getDocs(baseQuery)
      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data()
        const { password, ...rest } = data
        return { ...rest, id: doc.id }
      })
      if (searchKeyword.length >= 3) {
        results = docs.filter(doc => doc.name?.toLowerCase().includes(searchKeyword.toLowerCase()))
      } else {
        results = docs
      }

      const startIndex = (page - 1) * limitCount
      const paginatedResults = results.slice(startIndex, startIndex + limitCount)

      setMenusList(paginatedResults)
      setTotalRecords(results.length)
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getMenusList()
  }, [])

  const handlePagination = page => {
    setCurrentPage(page.selected + 1)
    getMenusList({ page: page.selected + 1 })
  }

  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    setRowsPerPage(value)
    setCurrentPage(1)
    getMenusList({ limit: value, page: 1 })
  }

  const handleReset = () => {
    setSearchTerm('')
    setCurrentPage(1)
    setRowsPerPage(10)
    getMenusList({ reset: true })
  }

  const AddMenu = async (data) => {
    setSubmitting(true)

    try {

      validateRestaurant(dispatch, history).catch(console.error)
      const token = localStorage.getItem('token')


      // Validate if the menu already exists
      const collectionRef = collection(db, 'menus')
      const validationQuery = query(
        collectionRef,
        where('restaurantId', '==', token),
        where('name', '==', data.name)
      )

      const validationSnapshot = await getDocs(validationQuery)
      if (!validationSnapshot.empty) {
        OpenNotification('error', 'OOPS!', `${data.name} Menu already exists!`)
        setSubmitting(false)
        return // Exit early if the table already exists
      }

      const newMenu = {
        name: data.name
      }

      if (token) {
        newMenu.restaurantId = token
      } else {
        console.error('Token not found. Redirecting to login.')
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
      }

      if (editInfo) {

        const menuRef = doc(db, 'menus', editInfo.id)

        newMenu.updatedAt = Timestamp.now()

        await updateDoc(menuRef, newMenu)
        getMenusList()

        OpenNotification('success', 'Success!', 'Menu updated successfully')
      } else {

        newMenu.createdAt = Timestamp.now()

        const docRef = await addDoc(collection(db, 'menus'), newMenu)
        getMenusList()

        OpenNotification('success', 'Success!', 'Menu added successfully')
      }

      setName('')
      setEditInfo(null)

    } catch (error) {
      console.error('Error adding/updating category:', error)
      OpenNotification('error', 'Oops!', 'Failed to add/update menu')
    } finally {
      setSubmitting(false)
      setAddUserModal(false)
    }
  }

  const handleAdd = () => {
    setEditInfo(null)
    setAddUserModal(!addUserModal)
  }

  useEffect(() => {
    if (editInfo) {
      setTimeout(() => {
        setValue('name', editInfo.name)
      }, 500)
    }
  }, [editInfo, addUserModal])

  const handleEdit = (row) => {
    setEditInfo(row)
    setAddUserModal(!addUserModal)
  }

  { /* DELETE Menu */ }
  const handleDelete = (row) => {

    return MySwal.fire({
      title: 'Are you sure?',
      text: "You want to delete this Menu!",
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
          const docRef = doc(db, 'menus', row.id)

          validateRestaurant(dispatch, history).catch(console.error)
          deleteDoc(docRef).then(() => {
            OpenNotification('success', 'Deleted!', 'Menu deleted successfully!')
            getMenusList()
          }).catch((error) => {
            console.error("Error deleting document: ", error)
          })
        } catch (error) {
          console.error('Error deleting menu:', error)
          OpenNotification('error', 'Oops!', 'Failed to delete menu')
        }
      }
    })
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
      name: 'Name',
      selector: 'name',
      cell: row => <>{(row.name) ? row.name : '-'}</>
    },
    {
      name: 'Actions',
      selector: 'actions',
      minWidth: '200px',
      center: true,
      cell: (row, index) => (
        <>
          <Button.Ripple outline color='info' id={`button-edit-${index + 1}`} size='sm' onClick={() => handleEdit(row)}>
            <Edit size={14} />
          </Button.Ripple> &nbsp;
          <Button.Ripple outline color='danger' id={`button-delete-${index + 1}`} size='sm' onClick={() => handleDelete(row)}>
            <Trash2 size={14} />
          </Button.Ripple>

          <UncontrolledTooltip placement='top' target={`button-edit-${index + 1}`}>
            EDIT
          </UncontrolledTooltip>
          <UncontrolledTooltip placement='top' target={`button-delete-${index + 1}`}>
            DELETE
          </UncontrolledTooltip>
        </>
      )
    }
  ]

  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='Manage Menus' breadCrumbParent='Menus' breadCrumbActive='List' />
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
            data={menusList}
            subHeaderComponent={
              <CustomHeader
                handlePerPage={handlePerPage}
                rowsPerPage={rowsPerPage}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleReset={handleReset}
                setCurrentPage={setCurrentPage}
                getMenusList={getMenusList}
                handleAdd={handleAdd}
              />
            }
          />
        </div>
      </Card>


      {/* {Add Menu} */}
      <Modal isOpen={addUserModal} toggle={() => setAddUserModal(!addUserModal)} size={'sm'}>
        <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>{editInfo ? 'Edit' : 'Add'} Menu</ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit(AddMenu)}>

            <FormGroup>
              <Label for='name'>Name <span className='text-danger'>*</span></Label>
              <Input
                id='name'
                name='name'
                innerRef={register({ required: true })}
                invalid={errors.name && true}
                placeholder='Enter Name'
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

      {/******* VIEW Menu DETAIL ********/}
      <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-centered' size="sm">
        <ModalHeader toggle={() => setViewModal(!viewModal)}>View Menu Details</ModalHeader>
        <ModalBody>
          <Row>
            <Col md='12'>
              <dl className='view-recipient'>
                <Row>
                  <Col md='12'><strong>Name</strong> <dd>{editInfo && editInfo.name ? editInfo.name : '-'}</dd></Col>
                  <Col md='12'><strong>Category</strong> <dd>{editInfo && editInfo.categories ? editInfo.categories : '-'}</dd></Col>
                  <Col md='12'><strong>Price</strong> <dd>{editInfo && editInfo.price ? `$ ${editInfo.price}` : '-'}</dd></Col>
                  <Col md="12">
                    <strong>Images</strong>
                    <dd>
                      {editInfo && editInfo.images && editInfo.images.length > 0 ? (
                        <div className="image-gallery">
                          {editInfo.images.map((img, index) => (
                            <img
                              key={index}
                              src={img}
                              alt={`Menu Image ${index + 1}`}
                              style={{ width: '100px', marginRight: '10px', marginBottom: '10px' }}
                            />
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </dd>
                  </Col>
                </Row>
              </dl>

            </Col>
          </Row>
        </ModalBody>
      </Modal>

    </Fragment>
  )
}

export default MenusList
