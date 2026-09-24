// ** React Imports
import { Fragment, useEffect, useRef, useState } from 'react'

// ** Invoice List Sidebar
import { Link, useHistory } from 'react-router-dom'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Trash2, Search, Eye, RefreshCcw, Settings } from 'react-feather'
import { Edit } from 'react-feather/dist'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Form, ModalFooter, FormGroup, Spinner, UncontrolledTooltip, CardHeader, CardBody } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import { formatPhoneNumber, OpenNotification, validateRestaurant } from '@src/views/components/Helper'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Spinners from '@components/spinner/Loading-spinner'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import AsyncSelect from 'react-select/async'

const MySwal = withReactContent(Swal)

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm } from 'react-hook-form'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, refEqual, Timestamp, updateDoc, where, deleteField } from 'firebase/firestore'
import { db, storage } from '../../../../configs/firebaseConfig'
import { v4 as uuidv4 } from 'uuid'
import { FiUserCheck } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { handleLogout } from '@store/actions/auth'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, searchTerm, setSearchTerm, handleReset, setCurrentPage, getWaitersList, setEditInfo, handleAdd }) => {
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
                        <InputGroup className='h-100'>
                            <Input
                                id='search-invoice'
                                type='text'

                                value={searchTerm}
                                placeholder="Search"
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && searchTerm.trim() !== '' && searchTerm.length > 2) {
                                        getWaitersList({ searchTerm, page: 1 })
                                        setCurrentPage(1)
                                    }
                                }}
                            />
                            <InputGroupAddon addonType='append'>
                                <Button color='secondary' style={{ height: "2.72rem" }} outline onClick={() => {
                                    if (searchTerm !== '' && searchTerm.length > 2) {
                                        getWaitersList({ searchTerm, page: 1 }); setCurrentPage(1)
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
                    <Button.Ripple color='primary' onClick={() => {
                        setEditInfo(null)
                        handleAdd()
                    }}>
                        Add New
                    </Button.Ripple>
                </Col>
            </Row>
        </div>
    )
}

const WaitersList = () => {

    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [totalRecords, setTotalRecords] = useState(0)
    const [itemsList, setItemsList] = useState([])
    const [viewModal, setViewModal] = useState(false)
    const [editInfo, setEditInfo] = useState(null)
    const [loading, setLoading] = useState(false)
    const [addUserModal, setAddUserModal] = useState(false)
    const [type, setType] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [images, setImages] = useState([])
    const [menusList, setMenusList] = useState([])
    const [tablesList, setTablesList] = useState([])
    const [halfPortion, setHalfPortion] = useState(false)
    const [categories, setCategories] = useState([])
    const [subCategories, setSubCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedSubCategory, setSelectedSubCategory] = useState('')
    const [filteredSubCategories, setFilteredSubCategories] = useState([])
    const [vegType, setVegType] = useState(['Veg', 'Non Veg'])
    const [selectedVegType, setSelectedVegType] = useState('')
    const [code, setCode] = useState('')
    const [table, setTable] = useState('')
    const [takeaway, setTakeaway] = useState(false)
    const [selectedTables, setSelectedTables] = useState([])
    const [portions, setPortions] = useState({
        full: true,
        half: false,
        quarter: false
    })

    const fileInputRef = useRef(null)
    const history = useHistory()

    const { register, control, setValue, watch, handleSubmit, formState: { errors }, reset } = useForm()
    const dispatch = useDispatch()

    // const validateRestaurant = async () => {
    //     const token = localStorage.getItem('token')
    //     if (!token) {
    //         console.error('Token not found. Redirecting to login.')
    //         OpenNotification('error', 'Error', 'Please login again!')
    //         history.push('/login')
    //         throw new Error('Token not found')
    //     }

    //     const restaurantRef = doc(db, 'restaurants', token)
    //     const restaurantSnapshot = await getDoc(restaurantRef)

    //     if (!restaurantSnapshot.exists()) {
    //         dispatch(handleLogout())
    //         console.error('Restaurant not found. Redirecting to login.')
    //         OpenNotification('error', 'Error', 'Your restaurant no longer exists. Please log in again.')
    //         history.push('/login')
    //         throw new Error('Restaurant not found')
    //     }
    // }

    const getTablesList = async (param = {}) => {

        try {
            const collectionRef = collection(db, 'partnerqrs')

            const token = localStorage.getItem('token')
            if (!token) {
                console.error('Token not found. Redirecting to login.')
                OpenNotification('error', 'Error', 'Please login again!')
                history.push('/login')
                return
            }

            const baseQuery = query(collectionRef, where('restaurantId', '==', token))

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

    useEffect(() => {
        getTablesList()
    }, [])


    useEffect(() => {
        const auth = localStorage.getItem('auth')
        if (!auth) {
            console.error('Token not found. Redirecting to login.')
            OpenNotification('error', 'Error', 'Please login again!')
            history.push('/login')
        } else {
            setCode(JSON.parse(auth))
            // console.log("auth", JSON.parse(auth))
        }
    }, [])

    const getWaitersList = async (param = {}) => {
        setLoading(true)
        try {
            // await validateRestaurant()
            validateRestaurant(dispatch, history).catch(console.error)
            const collectionRef = collection(db, 'waiters')
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
                results = docs.filter(doc => doc.name?.toLowerCase().includes(searchKeyword.toLowerCase()))
            } else {
                results = docs
            }

            const startIndex = (page - 1) * limitCount
            const paginatedResults = results.slice(startIndex, startIndex + limitCount)

            setItemsList(paginatedResults)
            setTotalRecords(results.length)
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getWaitersList()
    }, [])

    const handlePagination = page => {
        setCurrentPage(page.selected + 1)
        getWaitersList({ page: page.selected + 1 })
    }

    const handlePerPage = e => {
        const value = parseInt(e.currentTarget.value)
        setRowsPerPage(value)
        setCurrentPage(1)
        getWaitersList({ limit: value, page: 1 })
    }

    const handleReset = () => {
        setSearchTerm('')
        setCurrentPage(1)
        setRowsPerPage(10)
        getWaitersList({ reset: true })
    }


    const generateUniqueCode = async (field, length) => {
        const generateCode = () => {
            return Math.floor(Math.random() * Math.pow(10, length))
        }

        let isUnique = false
        let code = ""

        while (!isUnique) {
            code = generateCode()
            const collectionRef = collection(db, 'waiters')
            const querySnapshot = await getDocs(query(collectionRef, where(field, "==", code)))

            if (querySnapshot.empty) {
                isUnique = true
            }
        }

        return code
    }

    const AddWaiter = async (data) => {

        setSubmitting(true)

        try {
            // await validateRestaurant()
            validateRestaurant(dispatch, history).catch(console.error)
            const newWaiter = {
                name: data.name,
                phone_number: data.phone,
                accept_takeaway: takeaway
            }

            const token = localStorage.getItem('token')
            if (!token) {
                console.error('Token not found. Redirecting to login.')
                OpenNotification('error', 'Error', 'Please login again!')
                history.push('/login')
            }

            if (editInfo) {
                try {

                    const itemRef = doc(db, 'waiters', editInfo.id)

                    await updateDoc(itemRef, {
                        ...newWaiter,
                        updatedAt: Timestamp.now()
                    })

                    getWaitersList()
                    OpenNotification('success', 'Success!', 'Waiter details updated successfully')
                } catch (error) {
                    console.error("Error updating item:", error)
                    OpenNotification('error', 'Error', 'Failed to update the details.')
                }
            } else {

                newWaiter.restaurantId = token
                newWaiter.createdAt = Timestamp.now()
                newWaiter.waiterCode = await generateUniqueCode("waiterCode", 4)
                // console.log('New Waiter:', newWaiter)

                const docRef = await addDoc(collection(db, 'waiters'), newWaiter)
                getWaitersList()

                OpenNotification('success', 'Success!', 'Waiter details added successfully')
            }

            setAddUserModal(false)
            setEditInfo(null)
        } catch (error) {
            console.error('Error adding/updating details:', error)
            OpenNotification('error', 'Error', 'Something went wrong.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAdd = () => {
        setTakeaway(false)
        setSelectedSubCategory('')
        setSelectedCategory('')
        setSelectedVegType('')
        setSelectedVegType('')
        setPortions({ full: true, half: false, quarter: false })
        setEditInfo(null)
        setType('')
        setHalfPortion(false)
        setImages('')
        setPortions({ full: false, half: false, quarter: false })
        setAddUserModal(!addUserModal)
    }

    useEffect(() => {
        if (editInfo) {
            setTimeout(() => {
                setValue('name', editInfo.name)
                setValue('phone', editInfo.phone_number)
                setValue('table', editInfo.table)
                setTakeaway(editInfo.accept_takeaway)

            }, 500)
        }
    }, [addUserModal, editInfo])

    const handleEdit = (row) => {
        setTable(row && row.table)
        setEditInfo(row)
        setAddUserModal(!addUserModal)
    }

    { /* DELETE Item */ }
    const handleDelete = (row) => {

        return MySwal.fire({
            title: 'Are you sure?',
            text: "You want to delete this Waiter's details!",
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
                    const docRef = doc(db, 'waiters', row.id)
                    // await validateRestaurant()
                    validateRestaurant(dispatch, history).catch(console.error)
                    deleteDoc(docRef).then(() => {
                        getWaitersList()
                        OpenNotification('success', 'Deleted!', 'Waiter details deleted successfully!')
                    }).catch((error) => {
                        console.error("Error deleting document: ", error)
                    })
                } catch (error) {
                    console.error('Error deleting Item:', error)
                    OpenNotification('error', 'Oops!', 'Failed to delete Waiter details.')
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

    const getTableNumber = (val) => {

        const table = tablesList.find(table => table.id === val)
        if (table) {
            return `${table.type} ${table.number}`
        }
        return null
    }

    const handleTable = async (data) => {

        if (selectedTables.length === 0) return

        const token = localStorage.getItem('token')
        if (!token) {
            console.error('Token not found. Redirecting to login.')
            OpenNotification('error', 'Error', 'Please login again!')
            history.push('/login')
        }

        try {

            const itemRef = doc(db, 'waiters', editInfo.id)

            await updateDoc(itemRef, {
                qr: selectedTables,
                updatedAt: Timestamp.now()
            })
            setViewModal(false)
            getWaitersList()
            OpenNotification('success', 'Success!', 'Assigned successfully')
        } catch (error) {
            console.error("Error assigning:", error)
            OpenNotification('error', 'Error', 'Failed to assign.')
        }
    }

    const allTableOptions = tablesList.map(t => ({
        value: t.id,
        label: `${t.type} ${t.number}`
    }))

    const loadTableOptions = (inputValue, callback) => {
        const filtered = allTableOptions.filter(opt => opt.label.toLowerCase().includes(inputValue.toLowerCase())
        )
        callback(filtered)
    }

    // Handle select change
    const handleTableChange = (selectedOptions) => {
        setSelectedTables(selectedOptions || [])
        setValue('table', (selectedOptions || []).map(opt => opt.value)) // store array of IDs in form
    }


    const columns = [
        {
            name: 'code',
            selector: 'code',
            cell: row => <>{(row.waiterCode) ? row.waiterCode : '-'}</>
        },
        {
            name: 'Name',
            selector: 'name',
            cell: row => <>{(row.name) ? row.name : '-'}</>
        },
        {
            name: 'Phone Number',
            selector: 'phone',
            cell: row => <>{(row.phone_number) ? row.phone_number : '-'}</>
        },
        // {
        //     name: 'Assigned',
        //     selector: 'table',
        //     cell: row => <>{(row.qr) ? getTableNumber(row.qr) : '-'}</>
        // },
        {
            name: 'Assigned',
            selector: 'table',
            cell: row => (
                <>
                    {Array.isArray(row.qr) && row.qr.length > 0 ? row.qr.map(item => item.label).join(', ') : '-'}
                </>
            )
        },
        {
            name: 'Actions',
            selector: 'actions',
            minWidth: '200px',
            center: true,
            cell: (row, index) => (
                <>

                    <Button.Ripple outline color='secondary' id={`button-view-${index + 1}`} size='sm' onClick={() => { setEditInfo(row); setViewModal(!viewModal); setSelectedTables(row.qr) }}>
                        <FiUserCheck size={15} />
                    </Button.Ripple> &nbsp;&nbsp;

                    <Button.Ripple outline color='info' id={`button-edit-${index + 1}`} size='sm' onClick={() => handleEdit(row)}>
                        <Edit size={14} />
                    </Button.Ripple> &nbsp;&nbsp;
                    <Button.Ripple outline color='danger' id={`button-delete-${index + 1}`} size='sm' onClick={() => handleDelete(row)}>
                        <Trash2 size={14} />
                    </Button.Ripple>

                    <UncontrolledTooltip placement='top' target={`button-view-${index + 1}`}>
                        ASSIGN TABLE
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
            <Breadcrumbs breadCrumbTitle='Manage Waiters' breadCrumbParent='Waiters' breadCrumbActive='List' />

            {/* <div
                className="d-flex justify-content-center align-items-center w-100"
            >
                <Card className=" d-flex justify-content-center w-100 py-1">
                    <span className='ml-2' tag="h6">Waiter Code: <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{code.waiterCode}</span> </span>
                </Card>
            </div> */}
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
                        data={itemsList}
                        subHeaderComponent={
                            <CustomHeader
                                handlePerPage={handlePerPage}
                                rowsPerPage={rowsPerPage}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                handleReset={handleReset}
                                setCurrentPage={setCurrentPage}
                                getWaitersList={getWaitersList}
                                setEditInfo={setEditInfo}
                                handleAdd={handleAdd}
                            />
                        }
                    />
                </div>
            </Card>


            {/* {Add Waiter Details} */}
            <Modal isOpen={addUserModal} toggle={() => setAddUserModal(!addUserModal)} size={'md'}>
                <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>{editInfo ? 'Edit Details' : 'Add Waiter Details'}</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit(AddWaiter)}>
                        <Row>

                            <Col md={12}>
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
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label for='phone'>Phone Number</Label>
                                    <Input
                                        id='phone'
                                        name='phone'
                                        innerRef={register({ required: false })}
                                        invalid={errors.phone && true}
                                        placeholder='Enter Phone Number'
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12} >
                                <FormGroup >

                                    <CustomInput
                                        style={{
                                            accentColor: '#f9791d',
                                            cursor: 'pointer'
                                        }}
                                        className='mr-1'
                                        id={`takeaway`}
                                        name={`takeaway`}
                                        innerRef={register}
                                        label={'Accept Takeaway Orders'}
                                        type="checkbox"
                                        checked={takeaway}
                                        onChange={(e) => setTakeaway(e.target.checked)}
                                    />

                                </FormGroup>
                            </Col>

                        </Row>
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

            {/******* Assign Table DETAIL ********/}
            <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-top' size="sm">
                <ModalHeader toggle={() => setViewModal(!viewModal)}>Assign Table</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit(handleTable)}>
                        <Row>
                            <Col md={12}>
                                <FormGroup >

                                    <AsyncSelect
                                        isMulti
                                        cacheOptions
                                        defaultOptions={allTableOptions}
                                        loadOptions={loadTableOptions}
                                        placeholder="Select Tables..."
                                        value={selectedTables}
                                        onChange={handleTableChange}
                                    />


                                    {/* <CustomInput
                                        className='form-control'
                                        type='select'
                                        id='table'
                                        name='table'
                                        value={table}
                                        onChange={(e) => { setTable(e.target.value); setValue('table', e.target.value) }}
                                        innerRef={register({ required: true })}
                                        invalid={errors.table && true}
                                    >
                                        <option value="">
                                            Select
                                        </option>
                                        {tablesList && tablesList.length > 0 && tablesList.map(table => (<option value={table.id}>{table.type} {table.number}</option>))}
                                    </CustomInput> */}
                                </FormGroup>
                            </Col>

                        </Row>
                        <ModalFooter>
                            <Button disabled={submitting} color='primary'>
                                {(submitting) ? <> <Spinner color='white' size='sm' /> </> : 'Save'}
                            </Button>
                            <Button color='secondary' onClick={() => setViewModal(!viewModal)}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </Form>
                </ModalBody>
            </Modal>

        </Fragment>
    )
}

export default WaitersList
