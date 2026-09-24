// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** Invoice List Sidebar
import { Link, useHistory } from 'react-router-dom'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Trash2, Search, Eye, RefreshCcw, Clock, Tag, User, AlertCircle } from 'react-feather'
import { Edit } from 'react-feather/dist'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Form, ModalFooter, FormGroup, Spinner, UncontrolledTooltip, Badge } from 'reactstrap'
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
import { addDoc, collection, deleteDoc, doc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../../../../configs/firebaseConfig'
import { useDispatch } from 'react-redux'
import { setChefWarning } from '../../../../redux/actions/common'
import { TbChefHat } from 'react-icons/tb'
import AsyncSelect from "react-select/async"

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, searchTerm, setSearchTerm, handleReset, setCurrentPage, getItemsList, setEditInfo, handleAdd, menusList, filterMenu, setFilterMenu }) => {
    return (
        <div className='invoice-list-table-header w-100 mr-1 ml-50 mt-2 mb-75'>
            <Row>
                <Col xl='2' className='d-flex align-items-center p-0'>
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

                <Col xl='4' className='d-flex align-items-center justify-content-center p-0'>
                    <CustomInput
                        className='form-control ml-2 w-50'
                        type='select'
                        id='userType'
                        value={filterMenu}
                        onChange={(e) => {
                            setFilterMenu(e.target.value)
                            setCurrentPage(1)
                            getItemsList({ filterMenu: e.target.value, page: 1 })
                        }}
                    >
                        <option value=''>All</option>
                        {menusList && menusList.length > 0 && menusList.map(menu => (<option value={menu.id}>{menu.name}</option>))}
                    </CustomInput>
                </Col>
                <Col
                    xl='6'
                    className='d-flex align-items-sm-center justify-content-lg-end justify-content-start flex-lg-nowrap flex-wrap flex-sm-row flex-column pr-lg-1 p-0 mt-lg-0 mt-1'
                >
                    <div className='mr-1'>
                        <InputGroup>
                            <InputGroupAddon addonType='prepend'>
                                <Button color='secondary' style={{ height: "2.7rem" }} outline onClick={() => {
                                    if (searchTerm !== '' && searchTerm.length > 2) {
                                        getItemsList({ searchTerm, page: 1 }); setCurrentPage(1)
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
                                        getItemsList({ searchTerm, page: 1 })
                                        setCurrentPage(1)
                                    }
                                }}
                            />
                        </InputGroup>
                    </div>
                    <Button.Ripple className='mr-1' color='secondary' title="Reset" onClick={() => handleReset()}>
                        <RefreshCcw size={14} />
                    </Button.Ripple>

                    <Button.Ripple color='primary' tag={Link} to={`/item/add`}>
                        Add New
                    </Button.Ripple>
                </Col>
            </Row>
        </div>
    )
}

const ItemsList = () => {

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
    const [halfPortion, setHalfPortion] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedSubCategory, setSelectedSubCategory] = useState('')
    const [selectedVegType, setSelectedVegType] = useState('')
    const [currencySymbol, setCurrencySymbol] = useState('')
    const [currency, setCurrency] = useState('')
    const [taxesList, setTaxesList] = useState()
    const [selectedTaxes, setSelectedTaxes] = useState([])
    const [filterMenu, setFilterMenu] = useState('')
    const [chefModal, setChefModal] = useState(false)
    const [activeImageIdx, setActiveImageIdx] = useState(0)

    const ColoredIcon = ({ icon: Icon, bg = '#eef2f7', color = '#6e6b7b' }) => (
        <span
            className='d-inline-flex align-items-center justify-content-center mr-50'
            style={{ width: 26, height: 26, borderRadius: 6, background: bg }}
        >
            <Icon size={14} color={color} />
        </span>
    )
    const [chefsList, setChefsList] = useState([])
    const [selectedChef, setSelectedChef] = useState([])
    const [portions, setPortions] = useState({
        full: true,
        half: false,
        quarter: false
    })

    const history = useHistory()

    const { setValue, handleSubmit, formState: { errors }, reset } = useForm()
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

        } catch (error) {
            console.error('Error fetching taxes:', error)
            OpenNotification('error', 'Oops!', 'Failed to fetch taxes')
        } finally {
            setLoading(false)
        }
    }

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

            const baseQuery = query(collectionRef, where('restaurantId', '==', token))

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

    const getChefsList = async (param = {}) => {
        try {
            const collectionRef = collection(db, 'chefs')

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

            setChefsList(docs)
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {

        }
    }

    useEffect(() => {
        getMenusList()
        getTaxesList()
        getChefsList()
    }, [])

    const getItemsList = async (param = {}) => {
        setLoading(true)
        try {
            validateRestaurant(dispatch, history).catch(console.error)
            const collectionRef = collection(db, 'items')
            const results = []

            const searchKeyword = param?.reset ? '' : (param?.search || searchTerm)
            const page = param?.reset ? 1 : (param?.page || currentPage)
            const limitCount = param?.reset ? 10 : (param?.limit || rowsPerPage)
            const menuFilter = param.hasOwnProperty('filterMenu') ? param.filterMenu : (param.reset ? '' : filterMenu)

            const token = localStorage.getItem('token')
            if (!token) {
                console.error('Token not found. Redirecting to login.')
                OpenNotification('error', 'Error', 'Please login again!')
                history.push('/login')
                return
            }

            // Only 1 where clause to avoid index error
            const q = query(collectionRef, where('restaurantId', '==', token))
            const querySnapshot = await getDocs(q)

            let docs = querySnapshot.docs.map(doc => {
                const data = doc.data()
                const { password, ...rest } = data
                return { ...rest, id: doc.id }
            })

            // ✅ Manual filter by type (menuFilter)
            if (menuFilter !== '') {
                docs = docs.filter(doc => doc.type === menuFilter)
            }

            // ✅ Manual search
            if (searchKeyword.length >= 3) {
                docs = docs.filter(doc => doc.name?.toLowerCase().includes(searchKeyword.toLowerCase())
                )
            }

            // ✅ Manual sort by createdAt (desc)
            docs.sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0
                const bTime = b.createdAt?.seconds || 0
                return bTime - aTime
            })

            // ✅ Pagination
            const startIndex = (page - 1) * limitCount
            const paginatedResults = docs.slice(startIndex, startIndex + limitCount)

            setItemsList(paginatedResults)
            setTotalRecords(docs.length)

            const hasMissingChef = docs.some((item) => !item.chefId)
            dispatch(setChefWarning(hasMissingChef))
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getItemsList()
    }, [])

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
        setFilterMenu('')
        getItemsList({ reset: true })
    }

    const AddItem = async (data) => {

        setSubmitting(true)

        if (!data.fullPortion && !data.halfPortion && !data.quarterPortion) {
            OpenNotification('error', 'OOPS!', 'Please select at least one portion option.')
            setSubmitting(false)
            return
        }

        if (!images || images.length === 0) {
            OpenNotification('error', 'OOPS!', 'Please upload at least one image.')
            setSubmitting(false)
            return
        }
        // await validateRestaurant()
        validateRestaurant(dispatch, history).catch(console.error)
        const token = localStorage.getItem('token')

        try {

            const newItem = {
                name: data.name,
                type,
                description: data.description,
                estimated_time: data.time,
                full_price: data.fullPrice ? data.fullPrice : 0,
                is_full_portion: data.fullPortion,
                is_half_portion: data.halfPortion,
                is_quarter_portion: data.quarterPortion,
                half_price: data.halfPrice ? data.halfPrice : 0,
                quarter_price: data.quarterPrice ? data.quarterPrice : 0,
                status: data.status ? 1 : 0,
                veg_type: data.vegtype,
                taxes: selectedTaxes,
                images
            }

            if (token) {
                newItem.restaurantId = token
            } else {
                console.error('Token not found. Redirecting to login.')
                OpenNotification('error', 'Error', 'Please login again!')
                history.push('/login')
            }

            if (editInfo) {
                try {

                    const itemRef = doc(db, 'items', editInfo.id)

                    await updateDoc(itemRef, {
                        ...newItem,
                        updatedAt: Timestamp.now()
                    })

                    getItemsList()
                    OpenNotification('success', 'Success!', 'Item updated successfully')
                } catch (error) {
                    console.error("Error updating item:", error)
                    OpenNotification('error', 'Error', 'Failed to update the item.')
                }
            } else {

                // Validate if the table number already exists
                const collectionRef = collection(db, 'items')
                const validationQuery = query(
                    collectionRef,
                    where('restaurantId', '==', token),
                    where('name', '==', data.name)
                )

                const validationSnapshot = await getDocs(validationQuery)
                if (!validationSnapshot.empty) {
                    OpenNotification('error', 'OOPS!', `${data.name} Item already exists!`)
                    setSubmitting(false)
                    return // Exit early if the table already exists
                }

                newItem.status = 1
                newItem.createdAt = Timestamp.now()

                const docRef = await addDoc(collection(db, 'items'), newItem)
                getItemsList()

                OpenNotification('success', 'Success!', 'Item added successfully')
            }

            setAddUserModal(false)
            setType('')
            setEditInfo(null)
        } catch (error) {
            console.error('Error adding/updating Item:', error)
            OpenNotification('error', 'Error', 'Something went wrong.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAdd = () => {
        setSelectedSubCategory('')
        setSelectedCategory('')
        setSelectedVegType('')
        setSelectedVegType('')
        setPortions({ full: true, half: false, quarter: false })
        setEditInfo(null)
        setType('')
        setHalfPortion(false)
        setImages('')
        setSelectedTaxes([])
        setPortions({ full: false, half: false, quarter: false })
        setAddUserModal(!addUserModal)
    }

    useEffect(() => {
        if (!editInfo) {
            setTimeout(() => {
                setPortions({
                    full: true,
                    half: false,
                    quarter: false
                })
            }, 500)
        } else {
            setPortions({
                full: editInfo.is_full_portion,
                half: editInfo.is_half_portion,
                quarter: editInfo.is_quarter_portion
            })
        }
    }, [addUserModal, editInfo])

    useEffect(() => {
        if (editInfo) {
            setTimeout(() => {
                setValue('name', editInfo.name)
                setValue('type', editInfo.type)
                setValue('description', editInfo.description)
                setValue('time', editInfo.estimated_time)
                setValue('fullPortion', editInfo.is_full_portion)
                setValue('halfPortion', editInfo.is_half_portion)
                setValue('quarterPortion', editInfo.is_quarter_portion)
                setHalfPortion(editInfo.is_half_portion)
                setValue('fullPrice', editInfo.full_price)
                setValue('halfPrice', editInfo.half_price)
                setValue('quarterPrice', editInfo.quarter_price)
                setValue('price', editInfo.price)
                setValue('status', editInfo.status)
                setValue('vegtype', editInfo.veg_type)
                setSelectedVegType(editInfo.veg_type)
                setSelectedTaxes(editInfo.taxes || [])
                setPortions({
                    full: editInfo.is_full_portion,
                    half: editInfo.is_half_portion,
                    quarter: editInfo.is_quarter_portion
                })
            }, 500)
        }
    }, [addUserModal, editInfo])

    const handleEdit = (row) => {
        setType(row && row.type)
        setImages(row && row.images)
        setEditInfo(row)
        setAddUserModal(!addUserModal)
    }

    const getPrice = (row) => {
        if (!row) {
            return ''
        }

        if (row.is_full_portion) {
            return row.full_price
        } else if (row.is_half_portion) {
            return row.half_price
        } else if (row.is_quarter_portion) {
            return row.quarter_price
        }
        return ''
    }

    { /* DELETE Item */ }
    const handleDelete = (row) => {

        return MySwal.fire({
            title: 'Are you sure?',
            text: "You want to delete this Item!",
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
                    const docRef = doc(db, 'items', row.id)
                    validateRestaurant(dispatch, history).catch(console.error)
                    deleteDoc(docRef).then(() => {
                        getItemsList()
                        OpenNotification('success', 'Deleted!', 'Item deleted successfully!')
                    }).catch((error) => {
                        console.error("Error deleting document: ", error)
                    })
                } catch (error) {
                    console.error('Error deleting Item:', error)
                    OpenNotification('error', 'Oops!', 'Failed to delete Item details.')
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

    const getTypeName = (val) => {
        const menuItem = menusList.find(menu => menu.id === val)
        if (menuItem) {
            return menuItem.name
        }
        return null
    }

    const getTaxNames = (ids) => {
        if (!ids || !Array.isArray(ids) || !taxesList || taxesList.length === 0) return []
        return taxesList
            .filter(tax => ids.includes(tax.id))
            .map(tax => `${tax.taxName} (${tax.taxValue}%)`)
    }

    const handleAssignChef = async (data) => {

        setSubmitting(true)

        validateRestaurant(dispatch, history).catch(console.error)
        const token = localStorage.getItem('token')

        try {

            const newItem = {
                chefId: selectedChef

            }

            if (token) {
                newItem.restaurantId = token
            } else {
                console.error('Token not found. Redirecting to login.')
                OpenNotification('error', 'Error', 'Please login again!')
                history.push('/login')
            }

            if (editInfo) {
                try {

                    const itemRef = doc(db, 'items', editInfo.id)

                    await updateDoc(itemRef, {
                        ...newItem,
                        updatedAt: Timestamp.now()
                    })
                    OpenNotification('success', 'Success!', 'Item updated successfully')
                    setChefModal(false)
                    getItemsList()
                } catch (error) {
                    console.error("Error updating item:", error)
                    OpenNotification('error', 'Error', 'Failed to update the item.')
                }
            } else {

            }

            setSelectedChef([])
            setEditInfo(null)
        } catch (error) {
            console.error('Error adding/updating Item:', error)
            OpenNotification('error', 'Error', 'Something went wrong.')
        } finally {
            setSubmitting(false)
        }
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
            minWidth: '240px',
            center: true,
            cell: (row, index) => (
                <>
                    <Button.Ripple outline color='secondary' id={`button-chef-${index + 1}`} size='sm' onClick={() => { setEditInfo(row); setSelectedChef(row?.chefId); setChefModal(!chefModal) }}>
                        <TbChefHat size={14} />
                    </Button.Ripple> &nbsp;
                    <Button.Ripple outline color='secondary' id={`button-view-${index + 1}`} size='sm' onClick={() => { setEditInfo(row); setActiveImageIdx(0); setViewModal(!viewModal) }}>
                        <Eye size={14} />
                    </Button.Ripple> &nbsp;
                    <Link to={`/item/edit/${row.id}`}>
                        <Button.Ripple outline color='info' id={`button-edit-${index + 1}`} size='sm' onClick={() => handleEdit(row)}>
                            <Edit size={14} />
                        </Button.Ripple>
                    </Link> &nbsp;
                    <Button.Ripple outline color='danger' id={`button-delete-${index + 1}`} size='sm' onClick={() => handleDelete(row)}>
                        <Trash2 size={14} />
                    </Button.Ripple>

                    <UncontrolledTooltip placement='top' target={`button-chef-${index + 1}`}>
                        ASSIGN CHEF
                    </UncontrolledTooltip>
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
            <Breadcrumbs breadCrumbTitle='Manage Items' breadCrumbParent='Items' breadCrumbActive='List' />
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
                                handleAdd={handleAdd}
                                menusList={menusList}
                                filterMenu={filterMenu}
                                setFilterMenu={setFilterMenu}
                            />
                        }
                    />
                </div>
            </Card>

            {/******* VIEW Item DETAIL ********/}

            <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-centered modal-lg' contentClassName="rounded-lg shadow-lg border-0">
                <ModalHeader toggle={() => setViewModal(!viewModal)} className="border-bottom-0 pb-0 pt-2 px-3">
                    <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Item Details</span>
                </ModalHeader>
                <ModalBody className="pb-4 px-3">
                    <div className="px-1">
                        {/* Hero section: Name, Type, Status */}
                        <div className='d-flex align-items-start justify-content-between mb-2'>
                            <div>
                                <h1 className='mb-0 font-weight-bolder' style={{ color: '#1e293b', fontSize: '2rem' }}>{editInfo?.name || '-'}</h1>
                                <div className='font-weight-bold mt-50' style={{ color: '#94a3b8', fontSize: '1rem' }}>{editInfo?.type ? getTypeName(editInfo.type) : '-'}</div>
                            </div>
                            <div>
                                <Badge color={editInfo?.status ? 'light-success' : 'light-secondary'} className="px-2 py-1" style={{ borderRadius: '6px', fontWeight: 700, fontSize: '12px' }}>
                                    {editInfo?.status ? 'Available' : 'Not Available'}
                                </Badge>
                            </div>
                        </div>

                        {/* Price */}
                        <div className='d-flex align-items-baseline mb-3'>
                            <h2 className='font-weight-bolder mb-0' style={{ color: '#1e293b', fontSize: '1.75rem' }}>
                                {(currency || currencySymbol)} {parseFloat(getPrice(editInfo) || 0).toFixed(2)}
                            </h2>
                            <span className='ml-1 font-weight-bold' style={{ color: '#94a3b8', fontSize: '14px' }}>starting</span>
                        </div>

                        {/* Meta Badges Row */}
                        <Row className='mb-4'>
                            <Col md="4">
                                <div className='d-flex align-items-center'>
                                    <ColoredIcon icon={Clock} bg={'#f0f8ff'} color={'#5A3EFB'} />
                                    <span className="font-weight-bold" style={{ color: '#94a3b8', fontSize: '14px' }}>{editInfo?.estimated_time ? `${editInfo.estimated_time} mins` : '-'}</span>
                                </div>
                            </Col>
                            <Col md="4">
                                <div className='d-flex align-items-center'>
                                    <ColoredIcon icon={Tag} bg={'#fff4e6'} color={'#f9791d'} />
                                    <span className="font-weight-bold" style={{ color: '#94a3b8', fontSize: '14px' }}>{editInfo?.veg_type || '-'}</span>
                                </div>
                            </Col>
                            <Col md="4">
                                <div className='d-flex align-items-center'>
                                    <ColoredIcon icon={User} bg={'#eafaf2'} color={'#28c76f'} />
                                    {(() => {
                                        if (!editInfo?.chefId || editInfo.chefId.length === 0) {
                                            return <span className="font-weight-bold" style={{ color: '#94a3b8', fontSize: '14px' }}>-</span>
                                        }
                                        const selectedChefs = chefsList?.filter(chef => editInfo.chefId.includes(chef.id))
                                        return selectedChefs && selectedChefs.length > 0 ? (
                                            <span className="font-weight-bold" style={{ color: '#94a3b8', fontSize: '14px' }}>{selectedChefs.map(c => c.name).join(', ')}</span>
                                        ) : (
                                            <span className="font-weight-bold" style={{ color: '#94a3b8', fontSize: '14px' }}>-</span>
                                        )
                                    })()}
                                </div>
                            </Col>
                        </Row>

                        {/* Description */}
                        <div className='mb-4'>
                            <h6 className='font-weight-bold d-flex align-items-center mb-1' style={{ color: '#475569' }}>
                                <ColoredIcon icon={AlertCircle} bg={'#f3e8ff'} color={'#5A3EFB'} />
                                About this item
                            </h6>
                            <div style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>{editInfo?.description || '-'}</div>
                        </div>

                        {/* Portions & Prices + Taxes */}
                        <Row className='mb-3'>
                            <Col md="6" className='mb-1 mb-md-0'>
                                <div className='position-relative' style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem', paddingTop: '1.5rem', marginTop: '10px' }}>
                                    <label className='position-absolute' style={{ top: '-10px', left: '12px', background: '#fff', padding: '0 8px', color: '#64748b', fontSize: '12px', fontWeight: 700 }}>
                                        Portions & Prices
                                    </label>

                                    {editInfo?.is_full_portion && (
                                        <div className='d-flex justify-content-between align-items-center mb-50'>
                                            <span style={{ color: '#64748b', fontSize: '14px' }}>Full</span>
                                            <span className='font-weight-bolder' style={{ color: '#1e293b' }}>{(currency || currencySymbol)} {parseFloat(editInfo.full_price).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {editInfo?.is_half_portion && (
                                        <div className='d-flex justify-content-between align-items-center mb-50'>
                                            <span style={{ color: '#64748b', fontSize: '14px' }}>Half</span>
                                            <span className='font-weight-bolder' style={{ color: '#1e293b' }}>{(currency || currencySymbol)} {parseFloat(editInfo.half_price).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {editInfo?.is_quarter_portion && (
                                        <div className='d-flex justify-content-between align-items-center'>
                                            <span style={{ color: '#64748b', fontSize: '14px' }}>Quarter</span>
                                            <span className='font-weight-bolder' style={{ color: '#1e293b' }}>{(currency || currencySymbol)} {parseFloat(editInfo.quarter_price).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {!editInfo?.is_full_portion && !editInfo?.is_half_portion && !editInfo?.is_quarter_portion && (
                                        <div className='text-muted' style={{ fontSize: '14px' }}>-</div>
                                    )}
                                </div>
                            </Col>

                            <Col md="6">
                                <div className='position-relative h-100' style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem', paddingTop: '1.5rem', marginTop: '10px' }}>
                                    <label className='position-absolute' style={{ top: '-10px', left: '12px', background: '#fff', padding: '0 8px', color: '#64748b', fontSize: '12px', fontWeight: 700 }}>
                                        Taxes
                                    </label>
                                    <div style={{ color: '#1e293b', fontSize: '14px', fontWeight: 500 }}>
                                        {editInfo?.taxes?.length > 0 ? getTaxNames(editInfo.taxes).join(', ') : '-'}
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {/* Additional Information */}
                        <div className="mb-4 mt-2">
                            <h6 className="font-weight-bold mb-3" style={{ color: '#64748b', fontSize: '13px' }}>Additional Information</h6>
                            {editInfo?.additional_info?.length > 0 ? (
                                <Row>
                                    {editInfo.additional_info.map((info, index) => (
                                        <Col md="6" key={index} className="mb-2">
                                            <div className="position-relative h-100" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem', paddingTop: '1.5rem', marginTop: '10px' }}>

                                                {/* Title Label overlapping top-left */}
                                                <label className='position-absolute' style={{ top: '-10px', left: '12px', background: '#fff', padding: '0 8px', color: '#1e293b', fontSize: '13px', fontWeight: 700, textTransform: 'capitalize' }}>
                                                    {info.title}
                                                </label>

                                                {/* Exclusive Badge Floating inside right */}
                                                <div className="position-absolute" style={{ top: '-12px', right: '12px' }}>
                                                    <span className={`badge`} style={{ borderRadius: '6px', fontSize: "11px", fontWeight: 700, padding: '4px 10px', background: info.exclusive ? '#f9791d' : '#94a3b8', color: '#fff' }}>
                                                        {info.exclusive ? "Exclusive" : "Non Exclusive"}
                                                    </span>
                                                </div>

                                                {/* Options */}
                                                {(info.options || []).length > 0 ? (
                                                    <ul className="mb-0 pl-3">
                                                        {info.options.map((opt, i) => (
                                                            <li key={i} className="mb-25">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <span style={{ textTransform: "capitalize", color: '#475569', fontSize: '13px', fontWeight: 600 }}>{opt.option}</span>
                                                                    {info.include_price && opt.price !== undefined && opt.price !== "" && (
                                                                        <span className="font-weight-bold" style={{ color: '#94a3b8', fontSize: '13px' }}>{(currency || currencySymbol)} {parseFloat(opt.price).toFixed(2)}</span>
                                                                    )}
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="text-muted" style={{ fontSize: '14px' }}>-</div>
                                                )}
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <div className="text-muted" style={{ fontSize: '14px' }}>-</div>
                            )}
                        </div>

                        {/* Availability */}
                        <div className="mb-4">
                            <h6 className="font-weight-bold mb-3" style={{ color: '#64748b', fontSize: '13px' }}>Item Availability</h6>
                            {editInfo?.availability?.length > 0 ? (
                                <div className="p-0">
                                    {editInfo.availability.map((slot, index) => (
                                        <div key={index} className='d-flex align-items-center mb-1 pb-50' style={{ borderBottom: index !== editInfo.availability.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                                            <Clock size={16} className='mr-1' style={{ color: '#475569' }} />
                                            <span className='font-weight-bold mr-2' style={{ minWidth: 100, color: '#1e293b', fontSize: '13px' }}>{slot.day}</span>
                                            <span className='font-weight-bold' style={{ color: '#94a3b8', fontSize: '13px' }}>{slot.start || '-'} - {slot.end || '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-muted" style={{ fontSize: '14px' }}>-</div>
                            )}
                        </div>

                        {/* Gallery */}
                        {editInfo?.images?.length > 0 && (
                            <Row>
                                <Col md="12">
                                    <h6 className='font-weight-bold mb-3' style={{ color: '#64748b', fontSize: '13px' }}>Gallery</h6>
                                    <Row>
                                        {editInfo.images.map((image, index) => (
                                            <Col key={index} xs="6" md="3" className="mb-1">
                                                <div className='position-relative rounded overflow-hidden shadow-sm' style={{ height: '120px', border: '1px solid #e2e8f0' }}>
                                                    <img
                                                        src={`${Config.MEDIA_URL}${image}?alt=media`}
                                                        alt={`Item ${index + 1}`}
                                                        className="img-fluid"
                                                        style={{ height: '120px', objectFit: 'cover', width: '100%' }}
                                                    />
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </Col>
                            </Row>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            <Modal isOpen={chefModal} toggle={() => setChefModal(!chefModal)} size={'md'}>
                <ModalHeader toggle={() => setChefModal(!chefModal)}>Assign Chef</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit(handleAssignChef)}>
                        <Row>

                            <Col md={12}>
                                <FormGroup>
                                    <Label for="chef">
                                        Chefs <span className="text-danger">*</span>
                                    </Label>
                                    <AsyncSelect
                                        id="chef"
                                        isMulti
                                        cacheOptions
                                        defaultOptions={chefsList.map(chef => ({
                                            value: chef.id,
                                            label: chef.name
                                        }))}
                                        loadOptions={(inputValue, callback) => {
                                            const filtered = chefsList
                                                .filter(chef => chef.name.toLowerCase().includes(inputValue.toLowerCase())
                                                )
                                                .map(chef => ({
                                                    value: chef.id,
                                                    label: chef.name
                                                }))
                                            callback(filtered)
                                        }}
                                        placeholder="Select Chefs..."
                                        value={chefsList
                                            .filter(chef => (selectedChef || []).includes(chef.id))
                                            .map(chef => ({ value: chef.id, label: chef.name }))
                                        }
                                        onChange={selected => {
                                            const ids = selected ? selected.map(item => item.value) : []
                                            setSelectedChef(ids)
                                            setValue("chef", ids)
                                        }}
                                        classNamePrefix="react-select"
                                    />
                                    {errors.chef && (
                                        <div className="invalid-feedback d-block">Chef is required</div>
                                    )}
                                </FormGroup>
                            </Col>

                        </Row>
                        <ModalFooter>
                            <Button disabled={submitting} color='primary'>
                                {(submitting) ? <> <Spinner color='white' size='sm' /> </> : 'Save'}
                            </Button>
                            <Button color='secondary' onClick={() => setChefModal(!chefModal)}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </Form>
                </ModalBody>
            </Modal>
        </Fragment>
    )
}

export default ItemsList
