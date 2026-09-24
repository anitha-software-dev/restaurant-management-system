// ** React Imports
import { Fragment, useEffect, useState, useRef } from 'react'

// ** Invoice List Sidebar
import { useHistory, useParams } from 'react-router-dom'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Search, Eye, RefreshCcw } from 'react-feather'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, UncontrolledTooltip } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import { OpenNotification, validateRestaurant } from '@src/views/components/Helper'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Spinners from '@components/spinner/Loading-spinner'

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm } from 'react-hook-form'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '@src/configs/firebaseConfig'
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
                            <Input
                                id='search-invoice'
                                type='text'
                                value={searchTerm}
                                placeholder="Enter Table Number"
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && searchTerm.trim() !== '' && searchTerm.length > 0) {
                                        getTablesList({ searchTerm, page: 1 })
                                        setCurrentPage(1)
                                    }
                                }}
                            />
                            <InputGroupAddon addonType='append'>
                                <Button color='secondary' outline onClick={() => {
                                    if (searchTerm !== '' && searchTerm.length > 0) {
                                        getTablesList({ searchTerm, page: 1 }); setCurrentPage(1)
                                    }
                                }}>
                                    <Search size={12} />
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

const TablesList = () => {

    const { id } = useParams()
    const qrRef = useRef()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [totalRecords, setTotalRecords] = useState(0)
    const [tablesList, setTablesList] = useState([])
    const [viewModal, setViewModal] = useState(false)
    const [editInfo, setEditInfo] = useState(null)
    const [loading, setLoading] = useState(false)

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
            const baseQuery = query(collectionRef, where('restaurantId', '==', id), orderBy('createdAt', 'desc'))

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
    }, [id])

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
                    <Button.Ripple outline color='secondary' id={`table-view-${index + 1}`} size='sm' onClick={() => { setEditInfo(row); setViewModal(!viewModal) }}>
                        <Eye size={14} />
                    </Button.Ripple>
                    <UncontrolledTooltip placement='top' target={`table-view-${index + 1}`}>
                        VIEW
                    </UncontrolledTooltip>
                </>
            )
        }
    ]

    return (
        <Fragment>
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
                            />
                        }
                    />
                </div>
            </Card>

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
                                            value={(editInfo && editInfo.url)}
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
