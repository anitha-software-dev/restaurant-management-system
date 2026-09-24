// ** React Imports
import { Fragment, useEffect, useState, useRef } from 'react'

// ** Invoice List Sidebar
import { useHistory } from 'react-router-dom'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Trash2, Search, Eye, RefreshCcw } from 'react-feather'
import { Edit } from 'react-feather/dist'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Form, ModalFooter, FormGroup, Spinner, UncontrolledTooltip } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import { OpenNotification, validateRestaurant } from '@src/views/components/Helper'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Spinners from '@components/spinner/Loading-spinner'
import Config from '@src/configs/config.json'

const MySwal = withReactContent(Swal)

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm } from 'react-hook-form'
import { collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, updateDoc, where, setDoc } from 'firebase/firestore'
import { db } from '../../../../configs/firebaseConfig'
import { IoMdDownload } from 'react-icons/io'
import { QRCodeCanvas } from 'qrcode.react'
import { useDispatch } from 'react-redux'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, searchTerm, setSearchTerm, handleReset, setCurrentPage, getTablesList, handleAdd }) => {
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
                                <Button color='secondary' style={{ height: "2.7rem" }} outline onClick={() => {
                                    if (searchTerm !== '' && searchTerm.length > 0) {
                                        getTablesList({ searchTerm, page: 1 }); setCurrentPage(1)
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
                                    if (e.key === 'Enter' && searchTerm.trim() !== '' && searchTerm.length > 0) {
                                        getTablesList({ searchTerm, page: 1 })
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
                        Add QR
                    </Button.Ripple>
                </Col>
            </Row>
        </div>
    )
}

const TablesList = () => {

    const qrRef = useRef()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [totalRecords, setTotalRecords] = useState(0)
    const [tablesList, setTablesList] = useState([])
    const [viewModal, setViewModal] = useState(false)
    const [editInfo, setEditInfo] = useState(null)
    const [loading, setLoading] = useState(false)
    const [addUserModal, setAddUserModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [type, setType] = useState('')

    const { register, control, watch, handleSubmit, setValue, formState: { errors }, reset } = useForm()
    const history = useHistory()
    const dispatch = useDispatch()

    const getTablesList = async (param = {}) => {
        setLoading(true)
        try {
            // await validateRestaurant()
            validateRestaurant(dispatch, history).catch(console.error)
            const collectionRef = collection(db, 'partnerqrs')
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

            if (searchKeyword.length >= 1) {
                results = docs.filter(doc => doc.number?.toLowerCase().includes(searchKeyword.toLowerCase()))
            } else {
                results = docs
            }

            const startIndex = (page - 1) * limitCount
            const paginatedResults = results.slice(startIndex, startIndex + limitCount)

            setTablesList(paginatedResults)
            setTotalRecords(results.length)
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getTablesList()
    }, [])

    const handlePagination = page => {
        setCurrentPage(page.selected + 1)
        getTablesList({ page: page.selected + 1 })
    }

    const handlePerPage = e => {
        const value = parseInt(e.currentTarget.value)
        setRowsPerPage(value)
        setCurrentPage(1)
        getTablesList({ limit: value, page: 1 })
    }

    const handleReset = () => {
        setSearchTerm('')
        setCurrentPage(1)
        setRowsPerPage(10)
        getTablesList({ reset: true })
    }

    const AddTable = async (data) => {
        setSubmitting(true)

        try {
            const token = localStorage.getItem('token')
            if (!token) {
                console.error('Token not found. Redirecting to login.')
                OpenNotification('error', 'Error', 'Please login again!')
                history.push('/login')
                return
            }

            // await validateRestaurant()
            validateRestaurant(dispatch, history).catch(console.error)

            // Validate if the table number already exists
            const collectionRef = collection(db, 'partnerqrs')
            const validationQuery = query(
                collectionRef,
                where('restaurantId', '==', token),
                where('number', '==', data.number)
            )

            const validationSnapshot = await getDocs(validationQuery)
            if (!validationSnapshot.empty) {
                OpenNotification('error', 'OOPS!', `QR number ${data.number} already exists!`)
                setSubmitting(false)
                return
            }

            const newTable = {
                type: data.type,
                number: data.number,
                restaurantId: token
            }

            if (editInfo) {
                const tableRef = doc(db, 'partnerqrs', editInfo.id)

                newTable.updatedAt = Timestamp.now()

                await updateDoc(tableRef, newTable)
                OpenNotification('success', 'Success!', 'QR updated successfully')
            } else {
                newTable.createdAt = Timestamp.now()

                // Add a new document
                const newDocRef = doc(collectionRef)
                newTable.url = newDocRef.id

                await setDoc(newDocRef, newTable)
                OpenNotification('success', 'Success!', 'QR added successfully')
            }

            // Refresh table list and reset form
            getTablesList()
            setEditInfo(null)
        } catch (error) {
            console.error('Error adding/updating QR:', error)
            OpenNotification('error', 'Oops!', 'Failed to add/update QR')
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
                setValue('number', editInfo.number)
                setValue('type', editInfo.type)
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
            text: "You want to delete this QR!",
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
                    // await validateRestaurant()
                    validateRestaurant(dispatch, history).catch(console.error)
                    const docRef = doc(db, 'partnerqrs', row.id)

                    deleteDoc(docRef).then(() => {
                        OpenNotification('success', 'Deleted!', 'QR deleted successfully!')
                        getTablesList()
                    }).catch((error) => {
                        console.error("Error deleting document: ", error)
                    })
                } catch (error) {
                    console.error('Error deleting category:', error)
                    OpenNotification('error', 'Oops!', 'Failed to delete QR')
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
            name: 'Number',
            selector: 'number',
            cell: row => <>{(row.number) ? `${row.type} ${row.number}` : '-'}</>
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
                    </Button.Ripple> &nbsp; &nbsp;
                    <Button.Ripple outline color='info' id={`button-edit-${index + 1}`} size='sm' onClick={() => handleEdit(row)}>
                        <Edit size={14} />
                    </Button.Ripple> &nbsp;&nbsp;
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
            <Breadcrumbs breadCrumbTitle='Manage QR Codes' breadCrumbParent='QR Codes' breadCrumbActive='List' />
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
                        data={tablesList}
                        subHeaderComponent={
                            <CustomHeader
                                handlePerPage={handlePerPage}
                                rowsPerPage={rowsPerPage}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                handleReset={handleReset}
                                setCurrentPage={setCurrentPage}
                                getTablesList={getTablesList}
                                handleAdd={handleAdd}
                            />
                        }
                    />
                </div>
            </Card>


            {/* {Add Table} */}
            <Modal isOpen={addUserModal} toggle={() => setAddUserModal(!addUserModal)} size={'sm'}>
                <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>{editInfo ? 'Edit' : 'Add'} QR</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit(AddTable)}>
                        <FormGroup >
                            <Label for="type">
                                QR Type <span className='text-danger'>*</span>
                            </Label>
                            <CustomInput
                                className='form-control'
                                type='select'
                                id='type'
                                name='type'
                                value={type}
                                onChange={(e) => { setType(e.target.value) }}
                                innerRef={register({ required: true })}
                                invalid={errors.type && true}
                            >
                                <option value="">
                                    Select QR Type
                                </option>
                                <option value="Room">Room</option>
                                <option value="Table">Table</option>
                                <option value="Villa">Villa</option>
                            </CustomInput>
                        </FormGroup>
                        {(type) &&
                            <FormGroup>
                                <Label for='number'>{type} Number <span className='text-danger'>*</span></Label>
                                <Input
                                    id='number'
                                    name='number'
                                    type='number'
                                    min='0'
                                    innerRef={register({
                                        required: "This field is required",
                                        validate: (value) => /^[0-9]+$/.test(value) || "Only positive numbers are allowed"
                                    })}
                                    invalid={errors.number && true}
                                    placeholder='Enter Number'
                                    onKeyDown={(e) => {
                                        const allowedKeys = [
                                            "Backspace",
                                            "ArrowLeft",
                                            "ArrowRight",
                                            "Delete",
                                            "Tab"
                                        ]
                                        if (
                                            !allowedKeys.includes(e.key) &&
                                            (e.key < "0" || e.key > "9")
                                        ) {
                                            e.preventDefault()
                                        }
                                    }}
                                />
                            </FormGroup>
                        }

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

            {/* View Table */}
            {editInfo && (
                <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-centered' size="sm">
                    <ModalHeader toggle={() => setViewModal(!viewModal)}>View Details</ModalHeader>
                    <ModalBody>
                        <Row>
                            <Col md='12' className="mb-1"><strong style={{ fontWeight: 'bold' }}>Number</strong> <dd style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{editInfo && editInfo.number ? `${editInfo?.type} ${editInfo.number}` : '-'}</dd></Col>
                            {editInfo.url &&
                                <Col md='12' className="mb-1 d-flex flex-column"><strong style={{ fontWeight: 'bold' }}>QR Code</strong>
                                    <div className="mt-1 qrcode" style={{ width: "200px", height: "200px", display: "flex", border: "2px solid #dfdfdfdf" }} ref={qrRef}>
                                        <QRCodeCanvas
                                            value={(editInfo && `${Config.SITE_URL}${editInfo.url}`)}
                                            level='L'
                                            size="512"
                                            includeMargin={true}
                                            marginSize={2}
                                        />
                                    </div>
                                    <span
                                        onClick={async () => {
                                            const canvas = qrRef.current.querySelector("canvas")
                                            const url = canvas.toDataURL("image/png")
                                            const link = document.createElement("a")
                                            link.href = url
                                            link.download = "qrcode.png"
                                            link.click()
                                        }}
                                        className="cursor-pointer mt-1 d-flex align-items-center"
                                        style={{ width: '150px', color: 'rgba(0, 0, 0, 0.87)' }}
                                    >
                                        <IoMdDownload size={14} />&nbsp;Download
                                    </span>
                                </Col>
                            }
                        </Row>
                    </ModalBody>
                </Modal>
            )}

        </Fragment>
    )
}

export default TablesList
