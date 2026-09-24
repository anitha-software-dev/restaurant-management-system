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
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../../../../configs/firebaseConfig'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, searchTerm, setSearchTerm, handleReset, setCurrentPage, getCategoriesList, handleAdd }) => {
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
                    getCategoriesList({ searchTerm, page: 1 })
                    setCurrentPage(1)
                  }
                }}
              />
              <InputGroupAddon addonType='append'>
                <Button color='secondary' outline onClick={() => {
                  if (searchTerm !== '' && searchTerm.length > 2) {
                    getCategoriesList({ searchTerm, page: 1 }); setCurrentPage(1)
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
            Add Category
          </Button.Ripple>
        </Col>
      </Row>
    </div>
  )
}

const Categories = () => {

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [categories, setCategories] = useState([])
  const [viewModal, setViewModal] = useState(false)
  const [editInfo, setEditInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [addUserModal, setAddUserModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, control, watch, handleSubmit, setValue, formState: { errors }, reset } = useForm()
  const history = useHistory()


  const getCategoriesList = async (param = {}) => {
    setLoading(true)
    try {
      const collectionRef = collection(db, 'categories')
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
      const baseQuery = query(collectionRef, where('restaurantId', '==', token))

      const querySnapshot = await getDocs(baseQuery, orderBy('createdAt', 'desc'))
      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data()
        const { password, ...rest } = data
        return { ...rest, id: doc.id }
      })

      if (searchKeyword.length >= 3) {
        results = docs.filter(doc => doc.categoryName?.toLowerCase().includes(searchKeyword.toLowerCase()))
      } else {
        results = docs
      }

      const startIndex = (page - 1) * limitCount
      const paginatedResults = results.slice(startIndex, startIndex + limitCount)

      setCategories(paginatedResults)
      setTotalRecords(results.length)
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getCategoriesList()
  }, [])

  const handlePagination = page => {
    setCurrentPage(page.selected + 1)
    getCategoriesList({ page: page.selected + 1 })
  }

  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    setRowsPerPage(value)
    setCurrentPage(1)
    getCategoriesList({ limit: value, page: 1 })
  }

  const handleReset = () => {
    setSearchTerm('')
    setCurrentPage(1)
    setRowsPerPage(10)
    getCategoriesList({ reset: true })
  }

  const AddCategory = async (data) => {
    setSubmitting(true)

    try {

      const newCategory = {
        categoryName: data.name
      }

      const token = localStorage.getItem('token')
      if (token) {
        newCategory.restaurantId = token
      } else {
        console.error('Token not found. Redirecting to login.')
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
      }

      if (editInfo) {

        const categoryRef = doc(db, 'categories', editInfo.id)

        newCategory.updatedAt = Timestamp.now()


        await updateDoc(categoryRef, newCategory)
        getCategoriesList()

        OpenNotification('success', 'Success!', 'Category updated successfully')
      } else {

        newCategory.createdAt = Timestamp.now()

        const docRef = await addDoc(collection(db, 'categories'), newCategory)
        getCategoriesList()

        OpenNotification('success', 'Success!', 'Category added successfully')
      }

      setEditInfo(null)

    } catch (error) {
      console.error('Error adding/updating category:', error)
      OpenNotification('error', 'Oops!', 'Failed to add/update category')
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
        setValue('name', editInfo.categoryName)
      }, 500)
    }
  }, [editInfo, addUserModal])

  const handleEdit = (row) => {
    setEditInfo(row)
    setAddUserModal(!addUserModal)
  }

  { /* DELETE Category */ }
  const handleDelete = (row) => {

    return MySwal.fire({
      title: 'Are you sure?',
      text: "You want to delete this Category!",
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
          const docRef = doc(db, 'categories', row.id)

          deleteDoc(docRef).then(() => {
            OpenNotification('success', 'Deleted!', 'Category deleted successfully!')
            getCategoriesList()
          }).catch((error) => {
            console.error("Error deleting document: ", error)
          })
        } catch (error) {
          console.error('Error deleting category:', error)
          OpenNotification('error', 'Oops!', 'Failed to delete category')
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
      name: 'Categories',
      selector: 'categories',
      cell: row => <>{(row.categoryName) ? row.categoryName : '-'}</>
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
          </Button.Ripple> &nbsp;&nbsp;
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
      <Breadcrumbs breadCrumbTitle='Manage Categories' breadCrumbParent='Categories' breadCrumbActive='List' />
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
            data={categories}
            subHeaderComponent={
              <CustomHeader
                handlePerPage={handlePerPage}
                rowsPerPage={rowsPerPage}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleReset={handleReset}
                setCurrentPage={setCurrentPage}
                getCategoriesList={getCategoriesList}
                handleAdd={handleAdd}
              />
            }
          />
        </div>
      </Card>


      {/* {Add Category} */}
      <Modal isOpen={addUserModal} toggle={() => setAddUserModal(!addUserModal)} size={'sm'}>
        <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>{editInfo ? 'Edit' : 'Add'} Category</ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit(AddCategory)}>

            <FormGroup>
              <Label for='name'>Category Name <span className='text-danger'>*</span></Label>
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

    </Fragment>
  )
}

export default Categories
