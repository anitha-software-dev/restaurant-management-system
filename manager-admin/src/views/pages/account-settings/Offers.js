// ** React Imports
import { Fragment, useEffect, useState } from 'react'
import classnames from 'classnames'

// ** Invoice List Sidebar
import { Link, useHistory } from 'react-router-dom'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Trash2, Search, Eye, RefreshCcw, Settings } from 'react-feather'
import { Edit } from 'react-feather/dist'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Form, ModalFooter, FormGroup, Spinner, UncontrolledTooltip, Badge } from 'reactstrap'
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
import { useDispatch } from 'react-redux'
import { handleLogout } from '@store/actions/auth'
import { db, storage } from '../../../configs/firebaseConfig'
import { v4 as uuidv4 } from 'uuid'
import { ref, uploadBytes } from 'firebase/storage'
import Config from '@src/configs/config.json'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, searchTerm, setSearchTerm, handleReset, setCurrentPage, getTaxesList, handleAdd }) => {
  return (
    <div className='invoice-list-table-header w-100 px-1 py-1'>
      <Row className='align-items-center'>
        <Col lg='6' md='6' sm='12' className='d-flex align-items-center'>
          <h4 className='mb-0' style={{ fontWeight: 600, color: '#334155' }}>Offers and Promotions List</h4>
        </Col>
        <Col
          lg='6' md='6' sm='12'
          className='d-flex align-items-center justify-content-md-end justify-content-start mt-md-0 mt-1'
        >
          <Button.Ripple color='primary' onClick={() => handleAdd()} style={{ borderRadius: '12px', padding: '0.6rem 1.5rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(85, 126, 230, 0.3)' }}>
            Add New
          </Button.Ripple>
        </Col>
      </Row>
    </div>
  )
}

const OffersList = () => {

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [taxesList, setTaxesList] = useState([])
  const [viewModal, setViewModal] = useState(false)
  const [editInfo, setEditInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [addUserModal, setAddUserModal] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [images, setImages] = useState([])

  const { register, control, setValue, watch, handleSubmit, formState: { errors }, reset } = useForm()
  const history = useHistory()
  const dispatch = useDispatch()


  const getTaxesList = async () => {
    setLoading(true)

    try {
      // Validate user session (optional)
      validateRestaurant(dispatch, history).catch(console.error)

      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token not found. Redirecting to login.')
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
        return
      }

      const collectionRef = collection(db, 'offers')

      // Fetch all taxes for the current restaurant
      const baseQuery = query(collectionRef, where('restaurantId', '==', token))
      const querySnapshot = await getDocs(baseQuery)

      const taxes = querySnapshot.docs.map(doc => {
        const data = doc.data()
        const { password, ...rest } = data
        return { ...rest, id: doc.id }
      })

      setTaxesList(taxes)
      setTotalRecords(taxes.length)

    } catch (error) {
      console.error('Error fetching taxes:', error)
      OpenNotification('error', 'Oops!', 'Failed to fetch taxes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getTaxesList()
  }, [])

  const handlePagination = page => {
    setCurrentPage(page.selected + 1)
    getTaxesList({ page: page.selected + 1 })
  }

  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    setRowsPerPage(value)
    setCurrentPage(1)
    getTaxesList({ limit: value, page: 1 })
  }

  const handleReset = () => {
    setSearchTerm('')
    setCurrentPage(1)
    setRowsPerPage(10)
    getTaxesList({ reset: true })
  }

  const AddOffer = async (data) => {
    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')

      // Validate if the menu already exists
      const collectionRef = collection(db, 'offers')
      const validationQuery = query(
        collectionRef,
        where('restaurantId', '==', token),
        where('title', '==', data.title)
      )

      const validationSnapshot = await getDocs(validationQuery)
      if (!editInfo && !validationSnapshot.empty) {
        OpenNotification('error', 'OOPS!', `${data.title} offer already exists!`)
        setSubmitting(false)
        return
      }

      const newTax = {
        title: data.title,
        description: data.description,
        image: images
      }

      if (token) {
        newTax.restaurantId = token
      } else {
        console.error('Token not found. Redirecting to login.')
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
      }

      if (editInfo) {

        const taxRef = doc(db, 'offers', editInfo.id)

        newTax.updatedAt = Timestamp.now()
        newTax.status = data.status

        await updateDoc(taxRef, newTax)
        getTaxesList()

        OpenNotification('success', 'Success!', 'Offer updated successfully')
      } else {

        newTax.status = 1
        newTax.createdAt = Timestamp.now()
        console.log('newTax', newTax)
        const docRef = await addDoc(collection(db, 'offers'), newTax)
        getTaxesList()

        OpenNotification('success', 'Success!', 'Offer added successfully')
      }

      // setName('')
      setEditInfo(null)

    } catch (error) {
      console.error('Error adding/updating tax:', error)
      OpenNotification('error', 'Oops!', 'Failed to add/update tax')
    } finally {
      setSubmitting(false)
      setAddUserModal(false)
    }
  }

  const handleAdd = () => {
    setImages(null)
    setEditInfo(null)
    setAddUserModal(!addUserModal)
  }

  useEffect(() => {
    if (editInfo) {
      setTimeout(() => {
        setValue('title', editInfo.title)
        setValue('description', editInfo.description)
        setImages(editInfo && editInfo.image)
      }, 500)
    }
  }, [editInfo, addUserModal])

  const handleEdit = (row) => {
    setEditInfo(row)
    setAddUserModal(!addUserModal)
  }

  const handleView = (row) => {
    setEditInfo(row)
    setViewModal(!viewModal)
  }

  { /* DELETE Menu */ }
  const handleDelete = (row) => {

    return MySwal.fire({
      title: 'Are you sure?',
      text: "You want to delete this offer!",
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
          const docRef = doc(db, 'offers', row.id)

          validateRestaurant(dispatch, history).catch(console.error)
          deleteDoc(docRef).then(() => {
            OpenNotification('success', 'Deleted!', 'Offer deleted successfully!')
            getTaxesList()
          }).catch((error) => {
            console.error("Error deleting document: ", error)
          })
        } catch (error) {
          console.error('Error deleting offer:', error)
          OpenNotification('error', 'Oops!', 'Failed to delete offer')
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
      name: 'Title',
      selector: 'title',
      cell: row => <>{(row.title) ? row.title : '-'}</>
    },
    {
      name: 'Status',
      selector: 'status',
      center: true,
      cell: row => (
        row.status ? (
          <Badge color="success">Active</Badge>
        ) : (
          <Badge color="warning">Closed</Badge>
        )
      )
    },
    {
      name: 'Actions',
      selector: 'actions',
      minWidth: '200px',
      center: true,
      cell: (row, index) => (
        <>
          <Button.Ripple outline color='secondary' id={`button-view-${index + 1}`} size='sm' onClick={() => handleView(row)}>
            <Eye size={14} />
          </Button.Ripple> &nbsp;
          <Button.Ripple outline color='info' id={`button-edit-${index + 1}`} size='sm' onClick={() => handleEdit(row)}>
            <Edit size={14} />
          </Button.Ripple> &nbsp;
          <Button.Ripple outline color='danger' id={`button-delete-${index + 1}`} size='sm' onClick={() => handleDelete(row)}>
            <Trash2 size={14} />
          </Button.Ripple>

          <UncontrolledTooltip placement='top' target={`button-view-${index + 1}`}>
            VIEW
          </UncontrolledTooltip>
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
  const handleSingleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const fileExtension = file.name.split('.').pop()
      const uniqueFileName = `${uuidv4()}.${fileExtension}`
      const storageRef = ref(storage, `images/${uniqueFileName}`)

      await uploadBytes(storageRef, file)

      // 🔥 Always replace existing image
      setImages([uniqueFileName])
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  const handleSelectButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <Fragment>
      {/* <Breadcrumbs breadCrumbTitle='Manage Menus' breadCrumbParent='Menus' breadCrumbActive='List' /> */}
      <Card>
        <div className='invoice-list-dataTable mb-3'>
          <DataTable
            noHeader
            // pagination
            subHeader
            responsive
            paginationServer
            columns={columns}
            sortIcon={<ChevronDown />}
            className='react-dataTable'
            progressPending={loading}
            progressComponent={<div className="py-5 d-flex align-items-center"><Spinners className="w-14 text-secondary mr-1" /></div>}
            // paginationComponent={CustomPagination}
            data={taxesList}
            subHeaderComponent={
              <CustomHeader
                handlePerPage={handlePerPage}
                rowsPerPage={rowsPerPage}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleReset={handleReset}
                setCurrentPage={setCurrentPage}
                getTaxesList={getTaxesList}
                handleAdd={handleAdd}
              />
            }
          />
        </div>
      </Card>


      <Modal
        isOpen={addUserModal}
        toggle={() => setAddUserModal(!addUserModal)}
        size="md"
      >
        <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>
          {editInfo ? 'Edit' : 'Add'} Offer
        </ModalHeader>

        <ModalBody>
          <Form onSubmit={handleSubmit(AddOffer)}>

            {/* Title */}
            <FormGroup>
              <Label for="title">
                Title <span className="text-danger">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                innerRef={register({ required: true })}
                placeholder="Enter Title"
                className={classnames({ 'is-invalid': errors.title })}
              />
            </FormGroup>

            {/* Description */}
            <FormGroup>
              <Label for="description">
                Description <span className="text-danger">*</span>
              </Label>
              <Input
                id="description"
                name="description"
                type="textarea"
                rows="3"
                innerRef={register({ required: true })}
                placeholder="Enter Description"
                className={classnames({ 'is-invalid': errors.description })}
              />
            </FormGroup>

            {editInfo && (
              <FormGroup>
                <Label className="d-block">Status</Label>

                <div className="d-flex align-items-center gap-1">
                  <span className="mr-1 text-muted">Inactive</span>

                  <CustomInput
                    type="switch"
                    id="status"
                    name="status"
                    innerRef={register()}
                    defaultChecked={editInfo?.status === true}
                  />

                  <span className="ml-1 text-success">Active</span>
                </div>
              </FormGroup>
            )}

            {/* Image Upload */}
            <FormGroup>
              <Label>
                Image <span className="text-danger">*</span>
              </Label>

              <Input
                type="file"
                accept="image/*"
                onChange={handleSingleImageUpload}
              />

              {images && images.length > 0 && (
                <div className="mt-2">
                  <img
                    src={`${Config.MEDIA_URL}${images[0]}?alt=media`}
                    alt="Preview"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '5px',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
            </FormGroup>

            <ModalFooter>
              <Button disabled={submitting} color="primary">
                {submitting ? <Spinner color="white" size="sm" /> : 'Save'}
              </Button>
              <Button
                color="secondary"
                onClick={() => setAddUserModal(!addUserModal)}
              >
                Cancel
              </Button>
            </ModalFooter>

          </Form>
        </ModalBody>
      </Modal>

      {/******* VIEW Menu DETAIL ********/}
      <Modal
        isOpen={viewModal}
        toggle={() => setViewModal(!viewModal)}
        className="modal-dialog-centered"
        size="sm"
      >
        <ModalHeader toggle={() => setViewModal(!viewModal)}>
          Offer Details
        </ModalHeader>

        <ModalBody>
          {/* Image */}
          <div className="text-center mb-3">
            {editInfo?.image?.length > 0 ? (
              <img
                src={`${Config.MEDIA_URL}${editInfo.image[0]}?alt=media`}
                alt="Offer"
                style={{
                  width: '160px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '6px'
                }}
              />
            ) : (
              <span className="text-muted">No Image</span>
            )}
          </div>

          {/* Title */}
          <Row className="mb-2">
            <Col xs="5"><strong>Title</strong></Col>
            <Col xs="7">{editInfo?.title || '-'}</Col>
          </Row>

          {/* Status */}
          <Row className="mb-2">
            <Col xs="5"><strong>Status</strong></Col>
            <Col xs="7">
              <Badge color={editInfo?.status ? 'success' : 'warning'}>
                {editInfo?.status ? 'Active' : 'Closed'}
              </Badge>
            </Col>
          </Row>

          {/* Description */}
          <Row>
            <Col xs="12">
              <strong>Description</strong>
              <p className="mb-0 mt-1 text-muted" style={{ fontSize: '13px' }}>
                {editInfo?.description || '-'}
              </p>
            </Col>
          </Row>
        </ModalBody>
      </Modal>

    </Fragment>
  )
}

export default OffersList
