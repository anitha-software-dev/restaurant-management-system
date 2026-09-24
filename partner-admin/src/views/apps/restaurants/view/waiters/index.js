// ** React Imports
import { Fragment, useEffect, useRef, useState } from 'react'

// ** Invoice List Sidebar
import { useParams, useHistory } from 'react-router-dom'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Search, RefreshCcw } from 'react-feather'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Form, ModalFooter, UncontrolledTooltip, FormGroup, Spinner } from 'reactstrap'
import { OpenNotification, validateRestaurant } from '@src/views/components/Helper'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Spinners from '@components/spinner/Loading-spinner'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, refEqual, Timestamp, updateDoc, where, deleteField } from 'firebase/firestore'
import { db } from '@src/configs/firebaseConfig'

const MySwal = withReactContent(Swal)

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm } from 'react-hook-form'
import { GiRoundTable } from 'react-icons/gi'
import { FiUserCheck } from 'react-icons/fi'
import { useDispatch } from 'react-redux'

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
                                <Button color='secondary' outline onClick={() => {
                                    if (searchTerm !== '' && searchTerm.length > 2) {
                                        getWaitersList({ searchTerm, page: 1 }); setCurrentPage(1)
                                    }
                                }}>
                                    <Search size={11} />
                                </Button>
                            </InputGroupAddon>
                        </InputGroup>
                    </div>
                    <Button.Ripple className='mr-1' color='secondary' title="Reset" onClick={() => handleReset()}>
                        <RefreshCcw size={14} />
                    </Button.Ripple>
                </Col>
            </Row>
        </div>
    )
}

const WaitersList = () => {

    const { id } = useParams()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [totalRecords, setTotalRecords] = useState(0)
    const [itemsList, setItemsList] = useState([])
    const [viewModal, setViewModal] = useState(false)
    const [editInfo, setEditInfo] = useState(null)
    const [loading, setLoading] = useState(false)
    const [tablesList, setTablesList] = useState([])
    const [table, setTable] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [code, setCode] = useState('')

    const fileInputRef = useRef(null)
    const history = useHistory()

    const { register, control, setValue, watch, handleSubmit, formState: { errors }, reset } = useForm()
    const dispatch = useDispatch()

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

            const baseQuery = query(collectionRef, where('restaurantId', '==', id))

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
    }, [id])


    useEffect(() => {
        const auth = localStorage.getItem('auth')
        if (!auth) {
            console.error('Token not found. Redirecting to login.')
            OpenNotification('error', 'Error', 'Please login again!')
            history.push('/login')
        } else {
            setCode(JSON.parse(auth))
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
            const baseQuery = query(collectionRef, where('restaurantId', '==', id))

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
    }, [id])

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

        const token = localStorage.getItem('token')
        if (!token) {
            console.error('Token not found. Redirecting to login.')
            OpenNotification('error', 'Error', 'Please login again!')
            history.push('/login')
        }

        try {

            const itemRef = doc(db, 'waiters', editInfo.id)

            await updateDoc(itemRef, {
                table: data.table,
                updatedAt: Timestamp.now()
            })
            setViewModal(false)
            getWaitersList()
            OpenNotification('success', 'Success!', 'Table Assigned successfully')
        } catch (error) {
            console.error("Error assigning table:", error)
            OpenNotification('error', 'Error', 'Failed to assign table.')
        }
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
        //     name: 'Assigned Table',
        //     selector: 'table',
        //     cell: row => <>{(row.table) ? `Table ${getTableNumber(row.table)}` : '-'}</>
        // },
        {
            name: 'Assigned',
            selector: 'table',
            cell: row => <>{(row.qr) ? getTableNumber(row.qr) : '-'}</>
        },
        {
            name: 'Actions',
            selector: 'actions',
            minWidth: '200px',
            center: true,
            cell: (row, index) => (
                <>

                    <Button.Ripple outline color='secondary' id={`waiter-view-${index + 1}`} size='sm' onClick={() => { setEditInfo(row); setViewModal(!viewModal) }}>
                        <FiUserCheck />
                    </Button.Ripple>
                    <UncontrolledTooltip placement='top' target={`waiter-view-${index + 1}`}>
                        ASSIGN TABLE
                    </UncontrolledTooltip>
                </>
            )
        }
    ]

    return (
        <Fragment>
            <div
                className="d-none justify-content-center align-items-center w-100"
            >
                <Card className=" d-none justify-content-center w-100 py-1 mb-0">
                    <span className='ml-2' tag="h6">Waiter Code: <span style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{code.waiterCode}</span> </span>
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
                            />
                        }
                    />
                </div>
            </Card>

            {/******* Assign Table DETAIL ********/}
            {/* <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-top' size="sm">
                <ModalHeader toggle={() => setViewModal(!viewModal)}>Assign Table</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit(handleTable)}>
                        <Row>
                            <Col md={12}>
                                <FormGroup >
                                    <Label for="table">
                                        Table <span className='text-danger'>*</span>
                                    </Label>
                                    <CustomInput
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
                                        {tablesList && tablesList.length > 0 && tablesList.map(table => (<option value={table.id}>Table {table.number}</option>))}
                                    </CustomInput>
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
            </Modal> */}

            {/******* Assign Table DETAIL ********/}
            <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-top' size="sm">
                <ModalHeader toggle={() => setViewModal(!viewModal)}>Assign to Waiter</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit(handleTable)}>
                        <Row>
                            <Col md={12}>
                                <FormGroup >
                                    <CustomInput
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
                                    </CustomInput>
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
