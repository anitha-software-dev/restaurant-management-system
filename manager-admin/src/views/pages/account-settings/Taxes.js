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
import { useDispatch } from 'react-redux'
import { handleLogout } from '@store/actions/auth'
import { db } from '../../../configs/firebaseConfig'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, searchTerm, setSearchTerm, handleReset, setCurrentPage, getTaxesList, handleAdd }) => {
    return (
        <div className='invoice-list-table-header w-100 px-1 py-1'>
            <Row className='align-items-center'>
                <Col lg='6' md='6' sm='12' className='d-flex align-items-center'>
                    <h4 className='mb-0' style={{ fontWeight: 600, color: '#334155' }}>Taxes List</h4>
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

const TaxesList = () => {

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

            const collectionRef = collection(db, 'taxes')

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

    const AddTax = async (data) => {
        setSubmitting(true)

        try {
            const token = localStorage.getItem('token')

            // Validate if the menu already exists
            const collectionRef = collection(db, 'taxes')
            const validationQuery = query(
                collectionRef,
                where('restaurantId', '==', token),
                where('taxName', '==', data.taxName)
            )

            const validationSnapshot = await getDocs(validationQuery)
            if (!editInfo && !validationSnapshot.empty) {
                OpenNotification('error', 'OOPS!', `${data.taxName} tax already exists!`)
                setSubmitting(false)
                return
            }

            const newTax = {
                taxName: data.taxName,
                taxValue: data.taxValue
            }

            if (token) {
                newTax.restaurantId = token
            } else {
                console.error('Token not found. Redirecting to login.')
                OpenNotification('error', 'Error', 'Please login again!')
                history.push('/login')
            }

            if (editInfo) {

                const taxRef = doc(db, 'taxes', editInfo.id)

                newTax.updatedAt = Timestamp.now()

                await updateDoc(taxRef, newTax)
                getTaxesList()

                OpenNotification('success', 'Success!', 'Tax updated successfully')
            } else {

                newTax.createdAt = Timestamp.now()
                console.log('newTax', newTax)
                const docRef = await addDoc(collection(db, 'taxes'), newTax)
                getTaxesList()

                OpenNotification('success', 'Success!', 'Tax added successfully')
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
        setEditInfo(null)
        setAddUserModal(!addUserModal)
    }

    useEffect(() => {
        if (editInfo) {
            setTimeout(() => {
                setValue('taxName', editInfo.taxName)
                setValue('taxValue', editInfo.taxValue)
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
            text: "You want to delete this tax!",
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
                    const docRef = doc(db, 'taxes', row.id)

                    validateRestaurant(dispatch, history).catch(console.error)
                    deleteDoc(docRef).then(() => {
                        OpenNotification('success', 'Deleted!', 'Tax deleted successfully!')
                        getTaxesList()
                    }).catch((error) => {
                        console.error("Error deleting document: ", error)
                    })
                } catch (error) {
                    console.error('Error deleting tax:', error)
                    OpenNotification('error', 'Oops!', 'Failed to delete tax')
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
            name: 'Tax Name',
            selector: 'name',
            cell: row => <>{(row.taxName) ? row.taxName : '-'}</>
        },
        {
            name: 'Tax Value',
            selector: 'value',
            center: true,
            cell: row => <>{(row.taxValue) ? `${row.taxValue}%` : '-'}</>
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


            {/* {Add Menu} */}
            <Modal isOpen={addUserModal} toggle={() => setAddUserModal(!addUserModal)} size={'sm'}>
                <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>{editInfo ? 'Edit' : 'Add'} Tax</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit(AddTax)}>

                        <FormGroup>
                            <Label for='taxName'>Tax Name <span className='text-danger'>*</span></Label>
                            <Input
                                id='taxName'
                                name='taxName'
                                innerRef={register({ required: true })}
                                placeholder='Enter Tax Name'
                                className={classnames({
                                    'is-invalid': errors.taxName
                                })}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label for='taxValue'>Tax Value (%) <span className='text-danger'>*</span></Label>
                            <Input
                                id='taxValue'
                                name='taxValue'
                                type='number'
                                step='0.01'
                                innerRef={register({ required: true })}
                                placeholder='Enter Tax Value'
                                className={classnames({
                                    'is-invalid': errors.taxValue
                                })}
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

export default TaxesList
