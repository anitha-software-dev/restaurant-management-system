// ** React Imports
import { Fragment, useEffect, useRef, useState } from 'react'

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
import { FaPlus } from "react-icons/fa6"
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import Config from '@src/configs/config.json'

const MySwal = withReactContent(Swal)

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm } from 'react-hook-form'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, refEqual, Timestamp, updateDoc, where } from 'firebase/firestore'
import { db, storage } from '../../../../configs/firebaseConfig'
import { v4 as uuidv4 } from 'uuid'
import { IoIosCloseCircleOutline } from "react-icons/io"
import { useDispatch } from 'react-redux'
import { handleLogout } from '@store/actions/auth'

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
                                <Button color='secondary' style={{ height: "2.7rem" }} outline onClick={() => {
                                    if (searchTerm !== '' && searchTerm.length > 2) {
                                        getItemsList({ searchTerm, page: 1 }); setCurrentPage(1)
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
    const [categories, setCategories] = useState([])
    const [subCategories, setSubCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedSubCategory, setSelectedSubCategory] = useState('')
    const [filteredSubCategories, setFilteredSubCategories] = useState([])
    const [vegType, setVegType] = useState(['Veg', 'Non Veg'])
    const [selectedVegType, setSelectedVegType] = useState('')
    const [currencySymbol, setCurrencySymbol] = useState('')
    const [currency, setCurrency] = useState('')
    const [taxesList, setTaxesList] = useState()
    const [selectedTaxes, setSelectedTaxes] = useState([])
    const [filterMenu, setFilterMenu] = useState('')
    const [portions, setPortions] = useState({
        full: true,
        half: false,
        quarter: false
    })

    const fileInputRef = useRef(null)
    const history = useHistory()

    const { register, control, setValue, watch, handleSubmit, formState: { errors }, reset } = useForm()
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

    const getCategoriesList = async () => {
        try {
            const collectionRef = collection(db, 'categories')

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

            setCategories(docs)
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {

        }
    }

    const getSubCategoriesList = async () => {
        try {
            const collectionRef = collection(db, 'subcategories')

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

            setSubCategories(docs)
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {

        }
    }

    useEffect(() => {
        getMenusList()
        getCategoriesList()
        getSubCategoriesList()
        getTaxesList()
    }, [])

    // useEffect(() => {
    //     if (selectedCategory) {
    //         const filtered = subCategories.filter(
    //             (subcategory) => subcategory.categoryId === selectedCategory
    //         )
    //         setFilteredSubCategories(filtered)
    //     } else {
    //         setFilteredSubCategories([])
    //     }
    // }, [selectedCategory, subCategories])

    // const getItemsList = async (param = {}) => {
    //     setLoading(true)
    //     try {
    //         // await validateRestaurant()
    //         validateRestaurant(dispatch, history).catch(console.error)
    //         const collectionRef = collection(db, 'items')
    //         let results = []

    //         const searchKeyword = param?.reset ? '' : (param?.search || searchTerm)
    //         const page = param?.reset ? 1 : (param?.page || currentPage)
    //         const limitCount = param?.reset ? 10 : (param?.limit || rowsPerPage)
    //         const menuFilter = param?.reset ? '' : (param?.filterMenu || filterMenu)

    //         const token = localStorage.getItem('token')
    //         if (!token) {
    //             console.error('Token not found. Redirecting to login.')
    //             OpenNotification('error', 'Error', 'Please login again!')
    //             history.push('/login')
    //         }

    //         // Build the base query
    //         // const baseQuery = query(collectionRef, where('restaurantId', '==', token), orderBy('createdAt', 'desc'))
    //         // Build Firestore query
    //         let q = query(collectionRef, where('restaurantId', '==', token))

    //         if (menuFilter) {
    //             q = query(q, where('type', '==', param.filterMenu || filterMenu))
    //         }

    //         // q = query(q, orderBy('createdAt', 'desc'))

    //         const querySnapshot = await getDocs(q)
    //         const docs = querySnapshot.docs.map(doc => {
    //             const data = doc.data()
    //             const { password, ...rest } = data
    //             return { ...rest, id: doc.id }
    //         })
    //         if (searchKeyword.length >= 3) {
    //             results = docs.filter(doc => doc.name?.toLowerCase().includes(searchKeyword.toLowerCase()))
    //         } else {
    //             results = docs
    //         }

    //         const startIndex = (page - 1) * limitCount
    //         const paginatedResults = results.slice(startIndex, startIndex + limitCount)

    //         setItemsList(paginatedResults)
    //         setTotalRecords(results.length)
    //     } catch (error) {
    //         console.error('Error fetching lists:', error)
    //     } finally {
    //         setLoading(false)
    //     }
    // }

    const getItemsList = async (param = {}) => {
        setLoading(true)
        try {
            validateRestaurant(dispatch, history).catch(console.error)
            const collectionRef = collection(db, 'items')
            const results = []

            const searchKeyword = param?.reset ? '' : (param?.search || searchTerm)
            const page = param?.reset ? 1 : (param?.page || currentPage)
            const limitCount = param?.reset ? 10 : (param?.limit || rowsPerPage)
            // const menuFilter = param?.reset ? '' : (param?.filterMenu || filterMenu)
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
                return bTime - aTime // descending
            })

            // ✅ Pagination
            const startIndex = (page - 1) * limitCount
            const paginatedResults = docs.slice(startIndex, startIndex + limitCount)

            setItemsList(paginatedResults)
            setTotalRecords(docs.length)
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getItemsList()
    }, [])
    console.log(editInfo)
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
                // category: data.category,
                // subCategory: data.subcategory,
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
                // setValue('category', editInfo.category)
                setValue('description', editInfo.description)
                // setSelectedSubCategory(editInfo.subCategory)
                // setValue('subcategory', editInfo.subCategory)
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
        // setSelectedCategory(row && row.category)
        setType(row && row.type)
        setImages(row && row.images)
        setEditInfo(row)
        setAddUserModal(!addUserModal)
    }

    const handleMultipleImageUpload = async (e) => {
        const files = Array.from(e.target.files) // Convert FileList to an array

        // Restrict uploads to 5 images
        if (images.length + files.length > 5) {
            alert('You can only upload up to 5 images.')
            return
        }

        try {
            const uploadedImages = await Promise.all(
                files.map(async (file) => {
                    const fileExtension = file.name.split('.').pop()
                    const uniqueFileName = `${uuidv4()}.${fileExtension}`
                    const storageRef = ref(storage, `images/${uniqueFileName}`)

                    await uploadBytes(storageRef, file)

                    return uniqueFileName // Store file name or URL in state
                })
            )

            setImages((prevImages) => [...prevImages, ...uploadedImages])
        } catch (error) {
            console.error('Error uploading files:', error)
        }
    }

    const handleRemoveImage = (index) => {
        setImages((prevImages) => prevImages.filter((_, i) => i !== index))
    }

    const handleSelectButtonClick = () => {
        fileInputRef.current.click()
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
                    // await validateRestaurant()
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
    const getCategoryName = (val) => {

        const categoryItem = categories.find(category => category.id === val)
        if (categoryItem) {
            return categoryItem.categoryName
        }
        return null
    }

    const getSubCategoryName = (subCategoryId, categoryId) => {
        const filteredSubcategories = subCategories.filter((subCategory) => subCategory.categoryId === categoryId
        )
        const subCategoryItem = filteredSubcategories.find((subCategory) => subCategory.id === subCategoryId
        )
        return subCategoryItem ? subCategoryItem.name : null
    }

    const handleCheckboxChange = (portion) => {
        setPortions((prevState) => ({
            ...prevState,
            [portion]: !prevState[portion]
        }))
        setValue(portion, !portions[portion])
    }

    const getTaxNames = (ids) => {
        if (!ids || !Array.isArray(ids) || !taxesList || taxesList.length === 0) return []
        return taxesList
            .filter(tax => ids.includes(tax.id))
            .map(tax => `${tax.taxName} (${tax.taxValue}%)`)
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


            {/* {Add Item} */}
            <Modal isOpen={addUserModal} toggle={() => setAddUserModal(!addUserModal)} size={'md'}>
                <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>{editInfo ? 'Edit Details' : 'Add Item'}</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit(AddItem)}>
                        <Row>
                            <Col md={12}>
                                <FormGroup >
                                    <Label for="type">
                                        Type of Item <span className='text-danger'>*</span>
                                    </Label>
                                    <CustomInput
                                        className='form-control'
                                        type='select'
                                        id='type'
                                        name='type'
                                        value={type}
                                        onChange={(e) => { setType(e.target.value); setValue('type', e.target.value) }}
                                        innerRef={register({ required: true })}
                                        invalid={errors.type && true}
                                    >
                                        <option value="">
                                            Select
                                        </option>
                                        {menusList && menusList.length > 0 && menusList.map(menu => (<option value={menu.id}>{menu.name}</option>))}
                                    </CustomInput>
                                </FormGroup>
                            </Col>
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
                                    <Label for='description'>Description <span className='text-danger'>*</span></Label>
                                    <Input
                                        type='textarea'
                                        id='description'
                                        name='description'
                                        innerRef={register({ required: true })}
                                        invalid={errors.description && true}
                                        placeholder='Enter Description'
                                        rows='4'
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12} className="mt-0 mb-1">
                                <Label className='mb-1'>Portion Option(s)</Label>
                                <FormGroup className='d-flex'>
                                    {['full', 'half', 'quarter'].map((portion) => (
                                        <CustomInput
                                            style={{
                                                accentColor: '#f9791d',
                                                cursor: 'pointer'
                                            }}
                                            className='mr-1'
                                            key={portion}
                                            id={`${portion}Portion`}
                                            name={`${portion}Portion`}
                                            innerRef={register}
                                            label={portion.charAt(0).toUpperCase() + portion.slice(1)}
                                            type="checkbox"
                                            checked={portions[portion]}
                                            onChange={() => handleCheckboxChange(portion)}
                                        />
                                    ))}
                                </FormGroup>
                            </Col>
                            {portions.full && (
                                <Col md={12}>
                                    <FormGroup>
                                        <Label for='fullPrice'>Full Price ({currency ? currency : currencySymbol}) <span className='text-danger'>*</span></Label>
                                        <Input
                                            type='number'
                                            id='fullPrice'
                                            name='fullPrice'
                                            placeholder='Enter Full Price'
                                            min='0'
                                            step='0.01'
                                            innerRef={register({
                                                required: true,
                                                min: { value: 0 },
                                                pattern: {
                                                    value: /^\d*(\.\d{0,2})?$/
                                                }
                                            })}
                                            invalid={errors.fullPrice && true}
                                        />
                                    </FormGroup>
                                </Col>
                            )}

                            {/* Conditional Half Price Input */}
                            {portions.half && (
                                <Col md={12}>
                                    <FormGroup>
                                        <Label for='halfPrice'>Half Price ({currency ? currency : currencySymbol}) <span className='text-danger'>*</span></Label>
                                        <Input
                                            type='number'
                                            id='halfPrice'
                                            name='halfPrice'
                                            placeholder='Enter Half Price'
                                            min='0'
                                            step='0.01'
                                            innerRef={register({
                                                required: true,
                                                min: { value: 0 },
                                                pattern: {
                                                    value: /^\d*(\.\d{0,2})?$/
                                                }
                                            })}
                                            invalid={errors.halfPrice && true}
                                        />
                                    </FormGroup>
                                </Col>
                            )}

                            {/* Conditional Quarter Price Input */}
                            {portions.quarter && (
                                <Col md={12}>
                                    <FormGroup>
                                        <Label for='quarterPrice'>Quarter Price ({currency ? currency : currencySymbol}) <span className='text-danger'>*</span></Label>
                                        <Input
                                            type='number'
                                            id='quarterPrice'
                                            name='quarterPrice'
                                            placeholder='Enter Quarter Price'
                                            min='0'
                                            step='0.01'
                                            innerRef={register({
                                                required: true,
                                                min: { value: 0 },
                                                pattern: {
                                                    value: /^\d*(\.\d{0,2})?$/
                                                }
                                            })}
                                            invalid={errors.quarterPrice && true}
                                        />
                                    </FormGroup>
                                </Col>
                            )}

                            <Col md={12} className="mt-0 mb-1">
                                <Label className='mb-1'>Taxes</Label>
                                <FormGroup className='d-flex flex-wrap'>
                                    {taxesList && taxesList.length > 0 ? taxesList.map((tax) => {
                                        const isChecked = selectedTaxes.includes(tax.id)

                                        return (
                                            <CustomInput
                                                key={tax.id}
                                                id={`tax_${tax.id}`}
                                                name={`tax_${tax.id}`}
                                                type="checkbox"
                                                label={`${tax.taxName} (${tax.taxValue}%)`}
                                                checked={isChecked}
                                                onChange={() => {
                                                    const updated = isChecked ? selectedTaxes.filter(id => id !== tax.id) : [...selectedTaxes, tax.id]                // add if checked

                                                    setSelectedTaxes(updated)
                                                    setValue('selectedTaxes', updated) // register under one field
                                                }}
                                                className="mr-2"
                                                style={{
                                                    accentColor: '#f9791d',
                                                    cursor: 'pointer',
                                                    marginBottom: '5px'
                                                }}
                                            />
                                        )
                                    }) : (
                                        <p className="text-muted">No taxes found</p>
                                    )}
                                </FormGroup>
                            </Col>


                            <Col md={12}>
                                <FormGroup  >
                                    <Label className='form-label' for='time'>
                                        Estimated Preparation Time (In Mins) <span className='text-danger'>*</span>
                                    </Label>
                                    <Input
                                        id='time'
                                        name='time'
                                        type='number'
                                        min='0'
                                        innerRef={register({
                                            required: "This field is required",
                                            validate: (value) => /^[0-9]+$/.test(value) || "Only positive numbers are allowed"
                                        })}
                                        invalid={errors.time && true}
                                        placeholder='Enter Minutes'
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
                            </Col>

                            <Col md={6} className={!editInfo ? 'd-none' : 'd-flex align-items-center '}>
                                <FormGroup className={!editInfo ? 'd-none' : 'd-flex align-items-center mt-2'}>
                                    <Label className='form-label mr-1 ' for='status'>
                                        Availability:
                                    </Label>
                                    <CustomInput
                                        type="switch"
                                        id="status"
                                        name="status"
                                        innerRef={register({ required: false })}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup >
                                    <Label for="vegtype">
                                        Type (Veg/Non Veg) <span className='text-danger'>*</span>
                                    </Label>
                                    <CustomInput
                                        className='form-control'
                                        type='select'
                                        id='vegtype'
                                        name='vegtype'
                                        value={selectedVegType}
                                        onChange={(e) => { setSelectedVegType(e.target.value); setValue('vegtype', e.target.value) }}
                                        innerRef={register({ required: true })}
                                        invalid={errors.vegtype && true}
                                    >
                                        <option value="">
                                            Select
                                        </option>
                                        {vegType && vegType.length > 0 && vegType.map(type => (<option value={type}>{type}</option>))}
                                    </CustomInput>
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label for="images">Images:</Label>
                                    <div className="d-flex flex-wrap">
                                        {images && images.length > 0 && images.map((image, index) => (
                                            <div key={index} className="image-preview mr-1" style={{ position: 'relative' }}>
                                                <img
                                                    src={`${Config.MEDIA_URL}${image}?alt=media`}
                                                    alt={`Preview ${index + 1}`}
                                                    style={{
                                                        width: '80px',
                                                        marginRight: '10px',
                                                        marginTop: '10px',
                                                        borderRadius: '5px'
                                                    }}
                                                />
                                                <div
                                                    onClick={() => handleRemoveImage(index)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        right: 0,
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        cursor: 'pointer',
                                                        height: 20,
                                                        width: 20,
                                                        background: "#fff"
                                                    }}
                                                >
                                                    <IoIosCloseCircleOutline color='red' size={20} />
                                                </div>
                                            </div>
                                        ))}
                                        {images.length < 5 && (
                                            <div
                                                onClick={handleSelectButtonClick}
                                                style={{
                                                    border: '2px dashed #ccc',
                                                    padding: '20px',
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    borderRadius: '5px',
                                                    width: '100px',
                                                    marginTop: '10px'
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: 'bold',
                                                        lineHeight: '40px',
                                                        display: 'inline-block'
                                                    }}
                                                >
                                                    <FaPlus size={24} color="primary" />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <Input
                                        id="images"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        style={{ display: 'none' }}
                                        onChange={handleMultipleImageUpload}
                                        innerRef={fileInputRef}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <ModalFooter>
                            <Button disabled={submitting} color='primary' type="submit">
                                {(submitting) ? <> <Spinner color='white' size='sm' /> </> : 'Save'}
                            </Button>
                            <Button color='secondary' onClick={() => setAddUserModal(!addUserModal)}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </Form>
                </ModalBody>
            </Modal>

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
                                                {editInfo && editInfo.is_half_portion && <span className='mr-1'>Half: {currency ? currency : currencySymbol} {parseFloat(editInfo.half_price).toFixed(2)}</span>}
                                                {editInfo && editInfo.is_quarter_portion && <span>Quarter: {currency ? currency : currencySymbol} {parseFloat(editInfo.quarter_price).toFixed(2)}</span>}
                                            </div>
                                        </dd>
                                    </Col>
                                    <Col md='12'>
                                        <strong style={{ fontWeight: 'bold' }}>Taxes</strong>
                                        <dd style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                                            {
                                                editInfo?.taxes?.length > 0 ? getTaxNames(editInfo.taxes).join(', ') : '-'
                                            }
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
