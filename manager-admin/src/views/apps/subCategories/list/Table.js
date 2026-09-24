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
const CustomHeader = ({ handlePerPage, rowsPerPage, searchTerm, setSearchTerm, handleReset, setCurrentPage, getSubCategoriesList, handleAdd }) => {
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
              <InputGroupAddon addonType='prepend'>
                <Button color='secondary' outline onClick={() => {
                  if (searchTerm !== '' && searchTerm.length > 2) {
                    getSubCategoriesList({ searchTerm, page: 1 }); setCurrentPage(1)
                  }
                }}>
                  <Search size={14} />
                </Button>
              </InputGroupAddon>
              <Input
                id='search-invoice'
                type='text'
                value={searchTerm}
                placeholder="Search"
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchTerm.trim() !== '' && searchTerm.length > 2) {
                    getSubCategoriesList({ searchTerm, page: 1 })
                    setCurrentPage(1)
                  }
                }}
              />
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

const SubCategories = () => {

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [editInfo, setEditInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [addUserModal, setAddUserModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const { register, control, watch, handleSubmit, setValue, formState: { errors }, reset } = useForm()
  const history = useHistory()


  const getCategoriesList = async () => {
    try {
      const collectionRef = collection(db, 'categories')

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

      setCategories(docs)
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {

    }
  }

  const getSubCategoriesList = async (param = {}) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token not found. Redirecting to login.')
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
        return
      }

      // Fetch categories with specific restaurantId
      const categoriesQuery = query(
        collection(db, 'categories'),
        where('restaurantId', '==', token)
      )
      const categoriesSnapshot = await getDocs(categoriesQuery)
      const categoriesMap = categoriesSnapshot.docs.reduce((acc, doc) => {
        const data = doc.data()
        acc[doc.id] = data.categoryName // Map categoryId to categoryName
        return acc
      }, {})

      // Defaulting values for search, page, and limit
      const searchKeyword = param?.reset ? '' : (param?.search || searchTerm)
      const page = param?.reset ? 1 : (param?.page || currentPage)
      const limitCount = param?.reset ? 10 : (param?.limit || rowsPerPage)

      // Fetch subcategories with specific restaurantId
      const subcategoriesQuery = query(
        collection(db, 'subcategories'),
        where('restaurantId', '==', token)
      )
      const subcategoriesSnapshot = await getDocs(subcategoriesQuery)
      let subcategories = subcategoriesSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          categoryId: data.categoryId,
          categoryName: categoriesMap[data.categoryId] || 'Unknown'
        }
      })

      // Filter results based on search
      if (searchKeyword.length >= 3) {
        subcategories = subcategories.filter((sub) => sub.name.toLowerCase().includes(searchKeyword.toLowerCase())
        )
      }

      // Paginate results
      const startIndex = (page - 1) * limitCount
      const paginatedSubcategories = subcategories.slice(startIndex, startIndex + limitCount)

      setSubCategories(paginatedSubcategories)
      setTotalRecords(subcategories.length)
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      OpenNotification('error', 'Oops!', 'Failed to fetch categories and subcategories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getSubCategoriesList()
    getCategoriesList()
  }, [])

  const handlePagination = page => {
    setCurrentPage(page.selected + 1)
    getSubCategoriesList({ page: page.selected + 1 })
  }

  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    setRowsPerPage(value)
    setCurrentPage(1)
    getSubCategoriesList({ limit: value, page: 1 })
  }

  const handleReset = () => {
    setSearchTerm('')
    setCurrentPage(1)
    setRowsPerPage(10)
    getSubCategoriesList({ reset: true })
  }

  const handleAdd = () => {
    setSelectedCategory('')
    setValue('category', '')
    setEditInfo(null)
    setAddUserModal(!addUserModal)
  }

  useEffect(() => {
    if (editInfo) {
      setTimeout(() => {
        setValue('subCatName', editInfo.name)
        setSelectedCategory(editInfo.categoryId)
        setValue('subCatName', editInfo.name, { shouldValidate: true })
        setValue('category', editInfo.categoryId, { shouldValidate: true })
      }, 500)
    }
  }, [editInfo, addUserModal])

  const handleEdit = (row) => {
    setEditInfo(row)
    setAddUserModal(!addUserModal)
  }

  const AddSubCategory = async (data) => {
    setSubmitting(true)

    try {

      if (editInfo) {

        const categoryRef = doc(db, 'subcategories', editInfo.id)

        const newSubCategory = {
          name: data.subCatName,
          categoryId: editInfo.categoryId,
          updatedAt: Timestamp.now()
        }

        const token = localStorage.getItem('token')
        if (token) {
          newSubCategory.restaurantId = token
        } else {
          console.error('Token not found. Redirecting to login.')
          OpenNotification('error', 'Error', 'Please login again!')
          history.push('/login')
        }

        await updateDoc(categoryRef, newSubCategory)
        getSubCategoriesList()

        OpenNotification('success', 'Success!', 'Sub Category updated successfully')
      } else {

        const newSubCategory = {
          name: data.subCatName,
          categoryId: selectedCategory,
          createdAt: Timestamp.now()
        }

        const token = localStorage.getItem('token')
        if (token) {
          newSubCategory.restaurantId = token
        } else {
          console.error('Token not found. Redirecting to login.')
          OpenNotification('error', 'Error', 'Please login again!')
          history.push('/login')
        }

        const docRef = await addDoc(collection(db, 'subcategories'), newSubCategory)
        getSubCategoriesList()

        OpenNotification('success', 'Success!', 'Sub Category added successfully')
      }

      setEditInfo(null)

    } catch (error) {
      console.error('Error adding/updating Sub Category:', error)
      OpenNotification('error', 'Oops!', 'Failed to add/update Sub Category')
    } finally {
      setSubmitting(false)
      setAddUserModal(false)
    }
  }

  { /* DELETE Category */ }
  const handleDelete = (row) => {

    return MySwal.fire({
      title: 'Are you sure?',
      text: "You want to delete this Sub Category!",
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
          const docRef = doc(db, 'subcategories', row.id)

          deleteDoc(docRef).then(() => {
            OpenNotification('success', 'Deleted!', 'Sub Category deleted successfully!')
            getSubCategoriesList()
          }).catch((error) => {
            console.error("Error deleting document: ", error)
          })
        } catch (error) {
          console.error('Error deleting category:', error)
          OpenNotification('error', 'Oops!', 'Failed to delete Sub Category')
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
      name: 'name',
      selector: 'name',
      cell: row => <>{(row.name) ? row.name : '-'}</>
    },
    {
      name: 'Category',
      selector: 'category',
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
      <Breadcrumbs breadCrumbTitle='Manage Sub Categories' breadCrumbParent='Sub Categories' breadCrumbActive='List' />
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
            data={subCategories}
            subHeaderComponent={
              <CustomHeader
                handlePerPage={handlePerPage}
                rowsPerPage={rowsPerPage}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleReset={handleReset}
                setCurrentPage={setCurrentPage}
                getSubCategoriesList={getSubCategoriesList}
                handleAdd={handleAdd}
              />
            }
          />
        </div>
      </Card>


      {/* {Add SubCategory} */}
      <Modal isOpen={addUserModal} toggle={() => setAddUserModal(!addUserModal)} size={'sm'}>
        <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>{editInfo ? 'Edit' : 'Add'} Sub Category</ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit(AddSubCategory)}>

            <FormGroup  >
              <Label for="category">
                Category <span className='text-danger'>*</span>
              </Label>
              <CustomInput
                disabled={editInfo}
                className='form-control'
                type='select'
                id='category'
                name='category'
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setValue('category', e.target.value) }}
                {...register('category', { required: !editInfo ? 'Category is required' : false })}
              >
                <option defaultValue={''} hidden>
                  Select
                </option>
                {categories && categories.length > 0 && categories.map(category => (<option value={category.id}>{category.categoryName}</option>))}
              </CustomInput>
              {errors.category && <p className="text-danger">{errors.category.message}</p>}
            </FormGroup>

            <FormGroup>
              <Label for='subCatName'>Sub Category Name <span className='text-danger'>*</span></Label>
              <Input
                id='subCatName'
                name='subCatName'
                innerRef={register({ required: true })}
                invalid={errors.subCatName && true}
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

    </Fragment >
  )
}

export default SubCategories
