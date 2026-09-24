// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** Invoice List Sidebar
import { useHistory, useParams } from 'react-router-dom'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Search, Eye, RefreshCcw } from 'react-feather'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, UncontrolledTooltip } from 'reactstrap'
import { OpenNotification, validateRestaurant } from '@src/views/components/Helper'
import Spinners from '@components/spinner/Loading-spinner'
import Config from '@src/configs/config.json'

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm } from 'react-hook-form'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '@src/configs/firebaseConfig'
import { useDispatch } from 'react-redux'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, searchTerm, setSearchTerm, handleReset, setCurrentPage, getItemsList }) => {
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
                                        getItemsList({ searchTerm, page: 1 })
                                        setCurrentPage(1)
                                    }
                                }}
                            />
                            <InputGroupAddon addonType='append'>
                                <Button color='secondary' outline onClick={() => {
                                    if (searchTerm !== '' && searchTerm.length > 2) {
                                        getItemsList({ searchTerm, page: 1 }); setCurrentPage(1)
                                    }
                                }}>
                                    <Search size={13} />
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

const ItemsList = () => {

    const { id } = useParams()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [totalRecords, setTotalRecords] = useState(0)
    const [itemsList, setItemsList] = useState([])
    const [viewModal, setViewModal] = useState(false)
    const [editInfo, setEditInfo] = useState(null)
    const [loading, setLoading] = useState(false)
    const [menusList, setMenusList] = useState([])
    const [categories, setCategories] = useState([])
    const [subCategories, setSubCategories] = useState([])
    const [currencySymbol, setCurrencySymbol] = useState('')
    const [currency, setCurrency] = useState('')

    const history = useHistory()

    const { } = useForm()
    const dispatch = useDispatch()

    const getMenusList = async (param = {}) => {

        try {
            const collectionRef = collection(db, 'menus')

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

            setMenusList(docs)
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {

        }
    }

    useEffect(() => {
        getMenusList()
        // getCategoriesList()
        // getSubCategoriesList()
    }, [id])

    const getItemsList = async (param = {}) => {
        setLoading(true)
        try {
            // await validateRestaurant()
            validateRestaurant(dispatch, history).catch(console.error)
            const collectionRef = collection(db, 'items')
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
        getItemsList()
    }, [id])

    useEffect(() => {
        const authData = localStorage.getItem('auth')
        if (authData) {
            try {
                const parsedAuth = JSON.parse(authData)
                const symbol = parsedAuth?.currency?.symbol
                if (symbol) {
                    setCurrency(symbol)
                }
            } catch (error) {
                console.error('Failed to parse auth data:', error)
            }
        }
    }, [])

    const getCurrencyData = async () => {
        try {
            const collectionRef = collection(db, 'configurations')
            const querySnapshot = await getDocs(query(collectionRef))

            let symbol = ''

            querySnapshot.forEach(docSnapshot => {
                const data = docSnapshot.data()

                if (data.currency?.symbol) {
                    symbol = data.currency.symbol
                }
            })

            if (symbol) {
                setCurrencySymbol(symbol)
            }
        } catch (error) {
            console.error('Error fetching currency data:', error)
        }
    }

    useEffect(() => {
        getCurrencyData()
    }, [])

    const handlePagination = page => {
        setCurrentPage(page.selected + 1)
        getItemsList({ page: page.selected + 1 })
    }

    const handlePerPage = e => {
        const value = parseInt(e.currentTarget.value)
        setRowsPerPage(value)
        setCurrentPage(1)
        getItemsList({ limit: value, page: 1 })
    }

    const handleReset = () => {
        setSearchTerm('')
        setCurrentPage(1)
        setRowsPerPage(10)
        getItemsList({ reset: true })
    }

    const getPrice = (row) => {
        if (row.is_full_portion) {
            return row.full_price
        } else if (row.is_half_portion) {
            return row.half_price
        } else if (row.is_quarter_portion) {
            return row.quarter_price
        }
        return ''
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

    const getTypeName = (val) => {
        const menuItem = menusList.find(menu => menu.id === val)
        if (menuItem) {
            return menuItem.name
        }
        return null
    }

    const columns = [
        {
            name: 'Name',
            selector: 'name',
            cell: row => <>{(row.name) ? row.name : '-'}</>
        },
        {
            name: 'Type of Item',
            selector: 'type',
            cell: row => <>{(row.type) ? getTypeName(row.type) : '-'}</>
        },
        {
            name: 'Price',
            selector: 'price',
            cell: row => <>{(row) ? `${currency ? currency : currencySymbol} ${parseFloat(getPrice(row)).toFixed(2)}` : '-'}</>
        },
        {
            name: 'Preparation Time',
            selector: 'time',
            cell: row => <>{(row.estimated_time) ? `${row.estimated_time} Minutes` : '-'}</>
        },
        {
            name: 'Actions',
            selector: 'actions',
            minWidth: '200px',
            center: true,
            cell: (row, index) => (
                <>

                    <Button.Ripple outline color='secondary' id={`items-view-${index + 1}`} size='sm' onClick={() => { setEditInfo(row); setViewModal(!viewModal) }}>
                        <Eye size={14} />
                    </Button.Ripple>

                    <UncontrolledTooltip placement='top' target={`items-view-${index + 1}`}>
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
                        data={itemsList}
                        subHeaderComponent={
                            <CustomHeader
                                handlePerPage={handlePerPage}
                                rowsPerPage={rowsPerPage}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                handleReset={handleReset}
                                setCurrentPage={setCurrentPage}
                                getItemsList={getItemsList}
                                setEditInfo={setEditInfo}
                            />
                        }
                    />
                </div>
            </Card>

            {/******* VIEW Item DETAIL ********/}
            <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-centered' size="md">
                <ModalHeader toggle={() => setViewModal(!viewModal)}><strong>View Details</strong></ModalHeader>
                <ModalBody>
                    <Row>
                        <Col md='12'>
                            <dl className='view-recipient'>
                                <Row>
                                    <Col md='12'><strong style={{ fontWeight: 'bold' }}>Type of Item</strong> <dd style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{editInfo && editInfo.type ? getTypeName(editInfo.type) : '-'}</dd></Col>
                                    <Col md='12'><strong style={{ fontWeight: 'bold' }}>Name</strong> <dd style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{editInfo && editInfo.name ? editInfo.name : '-'}</dd></Col>
                                    <Col md='12'><strong style={{ fontWeight: 'bold' }}>Description</strong> <dd style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{editInfo && editInfo.description ? editInfo.description : '-'}</dd></Col>
                                    <Col md='12'><strong style={{ fontWeight: 'bold' }}>Type (Veg/Non Veg)</strong> <dd style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{editInfo && editInfo.veg_type ? editInfo.veg_type : '-'}</dd></Col>
                                    <Col md="12">
                                        <strong style={{ fontWeight: 'bold' }}>Prices</strong>
                                        <dd style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                                            <div className="price-container">
                                                {editInfo && editInfo.is_full_portion && <span className='mr-1'>Full: {currency ? currency : currencySymbol} {parseFloat(editInfo.full_price).toFixed(2)}</span>}
                                                {editInfo && editInfo.is_half_portion && <span className='mr-1'>Half:{currency ? currency : currencySymbol}  {parseFloat(editInfo.half_price).toFixed(2)}</span>}
                                                {editInfo && editInfo.is_quarter_portion && <span>Quarter: {currency ? currency : currencySymbol}  {parseFloat(editInfo.quarter_price).toFixed(2)}</span>}
                                            </div>
                                        </dd>
                                    </Col>
                                    <Col md='12'><strong style={{ fontWeight: 'bold' }}>Estimated Preparation Time</strong> <dd style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{editInfo && editInfo.estimated_time ? `${editInfo.estimated_time} Minutes` : '-'}</dd></Col>
                                    <Col md='12'><strong style={{ fontWeight: 'bold' }}>Status</strong> <dd style={{ color: 'rgba(0, 0, 0, 0.87)' }}>{editInfo && editInfo.status ? `Active` : 'InActive'}</dd></Col>
                                    <Col md="12">
                                        <strong style={{ fontWeight: 'bold' }}>Images</strong>
                                        <dd>
                                            {editInfo && editInfo.images && editInfo.images.length > 0 && (
                                                <div className="image-gallery mt-1">
                                                    {editInfo.images.map((image, index) => (
                                                        <img
                                                            key={index}
                                                            src={`${Config.MEDIA_URL}${image}?alt=media`}
                                                            alt={`Item Image ${index + 1}`}
                                                            style={{
                                                                width: '100px',
                                                                height: '100px',
                                                                objectFit: 'cover',
                                                                marginRight: '10px',
                                                                marginBottom: '10px',
                                                                border: '1px solid #ccc',
                                                                padding: '5px',
                                                                borderRadius: '5px',
                                                                boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.1)'
                                                            }}
                                                        />
                                                    ))}
                                                </div>
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

export default ItemsList
