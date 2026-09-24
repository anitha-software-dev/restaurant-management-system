// ** React Imports
import { Fragment, useEffect, useState } from 'react'
import classnames from 'classnames'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Trash2, Search, Eye, RefreshCcw } from 'react-feather'
import { Edit } from 'react-feather/dist'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Form, ModalFooter, FormGroup, Spinner, UncontrolledTooltip } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import { OpenNotification } from '@src/views/components/Helper'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Spinners from '@components/spinner/Loading-spinner'
import InputPasswordToggle from '@components/input-password-toggle'
import NumberInput from '@components/number-input'

const MySwal = withReactContent(Swal)

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm } from 'react-hook-form'
import { collection, getDocs, query, Timestamp, addDoc, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore'
import CryptoJS from "crypto-js"
import { v4 as uuidv4 } from 'uuid'
import { db } from '../../../configs/firebaseConfig'
import { useHistory } from 'react-router-dom'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, handleFilter, searchTerm, setSearchTerm, handleReset, setCurrentPage, getFranchiseList, handleAdd }) => {
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
                                        getFranchiseList({ searchTerm, page: 1 })
                                        setCurrentPage(1)
                                    }
                                }}
                            />
                            <InputGroupAddon addonType='append'>
                                <Button color='secondary' outline onClick={() => {
                                    if (searchTerm !== '' && searchTerm.length > 2) {
                                        getFranchiseList({ searchTerm, page: 1 }); setCurrentPage(1)
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

const FranchiseList = () => {

    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [totalRecords, setTotalRecords] = useState(0)
    const [franchiseList, setFranchiseList] = useState([])
    const [viewModal, setViewModal] = useState(false)
    const [editInfo, setEditInfo] = useState(null)
    const [loading, setLoading] = useState(false)
    const [addUserModal, setAddUserModal] = useState(false)
    const [images, setImages] = useState(null)
    const [isUploaded, setIsUploaded] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [franchisee, setFranchisee] = useState(0)

    const { register, errors, handleSubmit, trigger, setValue, reset } = useForm()
    const history = useHistory()

    const getFranchiseList = async (param = {}) => {
        setLoading(true)
        try {
            const collectionRef = collection(db, 'franchises')
            let results = []

            // Extract parameters with default values
            const searchKeyword = param?.reset ? '' : (param?.search || searchTerm)
            const page = param?.reset ? 1 : (param?.page || currentPage)
            const limitCount = param?.reset ? 10 : (param?.limit || rowsPerPage)

            const token = localStorage.getItem('token')
            if (!token) {
                console.error('Token not found. Redirecting to login.')
                OpenNotification('error', 'Error', 'Please login again!')
                history.push('/login')
            }

            const baseQuery = query(collectionRef, where('restaurantId', '==', token))

            const querySnapshot = await getDocs(baseQuery, orderBy('createdAt', 'desc'))
            const docs = querySnapshot.docs.map(doc => {
                const data = doc.data()
                const { password, ...rest } = data
                return { ...rest, id: doc.id }
            })

            // Filter results based on searchKeyword
            if (searchKeyword.length >= 3) {
                results = docs.filter(doc => doc.name?.toLowerCase().includes(searchKeyword.toLowerCase()))
            } else {
                results = docs
            }

            // Paginate the results
            const startIndex = (page - 1) * limitCount
            const paginatedResults = results.slice(startIndex, startIndex + limitCount)

            // Update state
            setFranchiseList(paginatedResults)
            setTotalRecords(results.length)
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getFranchiseList()
    }, [])

    const handlePagination = page => {
        setCurrentPage(page.selected + 1)
        getFranchiseList({ page: page.selected + 1 })
    }

    const handlePerPage = e => {
        const value = parseInt(e.currentTarget.value)
        setRowsPerPage(value)
        setCurrentPage(1)
        getFranchiseList({ limit: value, page: 1 })
    }

    const handleFilter = val => {
        getFranchiseList()
    }

    const handleReset = () => {
        setSearchTerm('')
        setCurrentPage(1)
        setRowsPerPage(10)
        getFranchiseList({ reset: true })
    }

    const validateGST = (gstNumber) => {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
        return gstRegex.test(gstNumber)
    }

    function validatePhoneNumber(phoneNumber) {
        const regex = /^\+?(\d{1,4})?[-.\s]?(\(?\d{2,4}\)?)?[-.\s]?\d{3,4}[-.\s]?\d{4,6}$/
        return regex.test(phoneNumber)
    }

    const onSubmit = async (obj) => {
        setSubmitting(true)
        const collectionRef = collection(db, 'franchises')

        try {
            if (obj.contactNumber && validatePhoneNumber(obj.contactNumber) === false) {
                OpenNotification('error', 'Oops!', 'Please enter valid phone number')
                return false
            }
            // if (obj.gstNumber && validateGST(obj.gstNumber) === false) {
            //     OpenNotification('error', 'Oops!', 'Please enter valid GST number')
            //     return false
            // }

            const token = localStorage.getItem('token')
            if (!token) {
                console.error('Token not found. Redirecting to login.')
                OpenNotification('error', 'Error', 'Please login again!')
                history.push('/login')
                return
            }
            const params = {
                name: obj.name,
                contactName: obj.contactName,
                contactNumber: obj.contactNumber,
                address: obj.address,
                // gstNumber: obj.gstNumber,
                description: obj.description
            }

            if (editInfo) {
                params.updatedAt = Timestamp.now()
                const docRef = doc(collectionRef, editInfo.id)
                await updateDoc(docRef, params)
                OpenNotification('success', 'Success', 'Franchise details updated successfully!')
            } else {

                params.email = obj.contactEmail
                params.password = CryptoJS.MD5(obj.password).toString()
                params.createdAt = Timestamp.now()
                params.restaurantId = token

                await addDoc(collectionRef, params)
                OpenNotification('success', 'Success', 'Franchise added successfully!')
            }

            // Reset modal state
            setAddUserModal(false)
            setImages(null)
            setIsUploaded(null)
            getFranchiseList()
            reset()
        } catch (error) {
            console.error('Error saving Franchise:', error)
            OpenNotification('error', 'Oops!', 'Failed to save Franchise details!')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAdd = () => {
        setEditInfo(null)
        setImages(null)
        setIsUploaded(null)
        setAddUserModal(true)
    }

    const handleEdit = (row) => {
        setTimeout(() => {
            setValue('name', row.name)
            setValue('contactName', row.contactName)
            setValue('contactNumber', row.contactNumber)
            setValue('contactEmail', row.email)
            setValue('address', row.address)
            // setValue('gstNumber', row.gstNumber)
            setValue('franchise', row.franchise)
            setValue('description', row.description)
            setImages(row.logo)
        }, 500)
        setEditInfo(row)
        const num = (row.franchise) ? parseInt(row.franchise) : 0
        setFranchisee(num)
        setAddUserModal(true)
    }

    { /* DELETE FRANCHISE */ }
    const handleDelete = (row) => {
        return MySwal.fire({
            title: 'Are you sure?',
            text: "You want to delete this franchise!",
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
                    const docRef = doc(db, 'franchises', row.id)

                    deleteDoc(docRef).then(() => {
                        OpenNotification('success', 'Deleted!', 'Franchise deleted successfully!')
                        getFranchiseList()
                    }).catch((error) => {
                        console.error("Error deleting document: ", error)
                    })
                } catch (error) {
                    console.error('Error deleting Franchise:', error)
                    OpenNotification('error', 'Oops!', 'Failed to delete Franchise details.')
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
            name: 'Name',
            selector: 'name',
            cell: row => <>{(row.name) ? row.name : ''}</>
        },
        {
            name: 'Contact Details',
            selector: 'ownerdetails',
            cell: row => <>
                <div className='d-flex flex-column'>
                    <span className='text-dark font-weight-bold'>{(row.contactName) ? row.contactName : ''}</span>
                    <small className='text-truncate mb-0'>{(row.contactNumber) ? row.contactNumber : ''}</small>
                </div>
            </>
        },
        {
            name: 'Address',
            selector: 'address',
            cell: row => <>{(row.address) ? row.address : ''}</>
        },

        {
            name: 'Actions',
            selector: 'actions',
            minWidth: '200px',
            center: true,
            cell: (row, index) => (
                <>
                    <Button.Ripple outline color='secondary' id={`button-view-${index + 1}`} size='sm' onClick={() => { setEditInfo(row); setViewModal(!viewModal) }}>
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

    return (
        <Fragment>
            <Breadcrumbs breadCrumbTitle='Manage Franchise' breadCrumbParent='Franchise' breadCrumbActive='List' />
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
                        data={franchiseList}
                        subHeaderComponent={
                            <CustomHeader
                                handlePerPage={handlePerPage}
                                rowsPerPage={rowsPerPage}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                handleFilter={handleFilter}
                                handleReset={handleReset}
                                setCurrentPage={setCurrentPage}
                                getFranchiseList={getFranchiseList}
                                handleAdd={handleAdd}
                            />
                        }
                    />
                </div>
            </Card>


            {/* ADD FRANCHISE */}
            <Modal isOpen={addUserModal} toggle={() => setAddUserModal(!addUserModal)} size={'md'}>
                <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>{editInfo ? 'Edit' : 'Add'} Franchise</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <FormGroup>
                            <Label for='name'>Franchise Name <span className='text-danger'>*</span></Label>
                            <Input
                                id='name'
                                name='name'
                                innerRef={register({ required: true })}
                                placeholder='Enter Franchise Name'
                                className={classnames({
                                    'is-invalid': errors.name
                                })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for='contactName'>Contact Person Name <span className='text-danger'>*</span></Label>
                            <Input
                                id='contactName'
                                name='contactName'
                                innerRef={register({ required: true })}
                                placeholder='Enter Person Name'
                                className={classnames({
                                    'is-invalid': errors.contactName
                                })}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label for='contactNumber'>Phone Number<span className='text-danger'>*</span></Label>
                            <Input
                                id='contactNumber'
                                name='contactNumber'
                                innerRef={register({ required: true })}
                                placeholder='Enter Phone Number'
                                className={classnames({
                                    'is-invalid': errors.contactNumber
                                })}
                            />
                        </FormGroup>
                        <FormGroup >
                            <Label className='form-label' for='email'>
                                Franchise Email <span className='text-danger'>*</span>
                            </Label>
                            <Input
                                type='email'
                                id='contactEmail'
                                name='contactEmail'
                                innerRef={register({ required: true })}
                                placeholder='Enter Email'
                                className={classnames({
                                    'is-invalid': errors.contactEmail
                                })}
                                readOnly={editInfo}
                            />
                        </FormGroup>

                        {(editInfo === null) &&
                            <FormGroup >

                                <Label className='form-label' for='password'>
                                    Password <span className='text-danger'>*</span>
                                </Label>
                                <InputPasswordToggle
                                    id='password'
                                    name='password'
                                    classNames='input-group-merge'
                                    placeholder="Enter Password"
                                    innerRef={register({ required: true })}
                                    className={classnames({
                                        'is-invalid': errors.password
                                    })}
                                />

                                {errors.password && (
                                    <small className='text-danger'>{errors.password.message}</small>
                                )}
                            </FormGroup>
                        }

                        <FormGroup>
                            <Label for='address'>Address</Label>
                            <Input
                                id='address'
                                name='address'
                                innerRef={register({ required: false })}
                                placeholder='Enter Address' className={classnames({
                                    'is-invalid': errors.address
                                })}
                            />
                        </FormGroup>

                        {/* <FormGroup>
                            <Label for='gstNumber'>GST Number</Label>
                            <Input
                                id='gstNumber'
                                name='gstNumber'
                                innerRef={register({ required: false })}
                                placeholder='Enter GST Number'
                                className={classnames({
                                    'is-invalid': errors.gstNumber
                                })}
                            />
                        </FormGroup> */}

                        <FormGroup>
                            <Label for='description'>About Franchise</Label>
                            <Input
                                type="textarea"
                                id='description'
                                name='description'
                                rows="5"
                                innerRef={register({ required: false })}
                                placeholder='Enter About Franchise' className={classnames({
                                    'is-invalid': errors.description
                                })}
                            />
                        </FormGroup>

                        <ModalFooter>
                            <Button disabled={submitting} color='primary'>
                                {(submitting) ? <> <Spinner color='white' size='sm' /> </> : 'Submit'}
                            </Button>
                            <Button color='secondary' onClick={() => setAddUserModal(!addUserModal)}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </Form>
                </ModalBody>
            </Modal>

            {/******* VIEW FRANCHISE DETAIL ********/}
            <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-centered' size="sm">
                <ModalHeader toggle={() => setViewModal(!viewModal)}>View Franchise</ModalHeader>
                <ModalBody>
                    <Row>
                        <Col md='12'>
                            <dl className='view-recipient'>
                                <Row>
                                    <Col md='12'><strong>Franchise Name</strong> <dd>{editInfo && editInfo.name ? editInfo.name : '-'}</dd></Col>
                                    <Col md='12'><strong>Contact Person Name</strong> <dd>{editInfo && editInfo.contactName ? editInfo.contactName : '-'}</dd></Col>
                                    <Col md='12'><strong>Franchise Email</strong> <dd>{editInfo && editInfo.email ? editInfo.email : '-'}</dd></Col>
                                    <Col md='12'><strong>Phone Number</strong> <dd>{editInfo && editInfo.contactNumber ? editInfo.contactNumber : '-'}</dd></Col>
                                    <Col md='12'><strong>Address</strong> <dd>{editInfo && editInfo.address ? editInfo.address : '-'}</dd></Col>
                                    {/* <Col md='12'><strong>GST Number</strong> <dd>{editInfo && editInfo.gstNumber ? editInfo.gstNumber : '-'}</dd></Col> */}
                                </Row>
                            </dl>

                        </Col>
                    </Row>
                </ModalBody>
            </Modal>

        </Fragment>
    )
}

export default FranchiseList
