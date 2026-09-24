// ** React Imports
import { Fragment, useEffect, useState, useRef } from 'react'
import classnames from 'classnames'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Trash2, Search, Eye, RefreshCcw, Settings, MoreVertical, LogIn } from 'react-feather'
import { Edit } from 'react-feather/dist'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Form, ModalFooter, FormGroup, Spinner, UncontrolledTooltip, DropdownToggle, DropdownMenu, DropdownItem, UncontrolledDropdown, FormFeedback } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import { OpenNotification } from '@src/views/components/Helper'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Spinners from '@components/spinner/Loading-spinner'
import InputPasswordToggle from '@components/input-password-toggle'
import NumberInput from '@components/number-input'
import 'react-image-crop/dist/ReactCrop.css'

import Currencies from '../../../../../src/configs/currencies.json'
import AsyncSelect from 'react-select/async'
import { FaHistory, FaWallet } from 'react-icons/fa'

const MySwal = withReactContent(Swal)

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm, Controller } from 'react-hook-form'
import { collection, getDocs, query, Timestamp, addDoc, updateDoc, deleteDoc, doc, orderBy, where, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../../../configs/firebaseConfig'
import Config from '@src/configs/config.json'
import CryptoJS from "crypto-js"
import { v4 as uuidv4 } from 'uuid'
import ReactCrop, { Crop } from 'react-image-crop'
import ResetPasswordModal from '../../../components/ResetPassword'
import { Link } from 'react-router-dom/cjs/react-router-dom.min'

// ** Table Header
const CustomHeader = ({ handlePerPage, rowsPerPage, handleFilter, searchTerm, setSearchTerm, handleReset, setCurrentPage, getRestaurantList, handleAdd, userType, setUserType, isRestaurant, setIsRestaurant }) => {

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

        <Col
          xl='10'
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
                    getRestaurantList({ searchTerm, page: 1 })
                    setCurrentPage(1)
                  }
                }}
              />
              <InputGroupAddon addonType='append'>
                <Button color='secondary' outline onClick={() => {
                  if (searchTerm !== '' && searchTerm.length > 2) {
                    getRestaurantList({ searchTerm, page: 1 }); setCurrentPage(1)
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

          <Button.Ripple color='primary' onClick={() => handleAdd()}>
            Add New
          </Button.Ripple>
        </Col>
      </Row>
    </div>
  )
}

const RestaurantList = () => {

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [restaurantsList, setRestaurantsList] = useState([])
  const [viewModal, setViewModal] = useState(false)
  const [editInfo, setEditInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [addUserModal, setAddUserModal] = useState(false)
  const [images, setImages] = useState(null)
  const [isUploaded, setIsUploaded] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [franchisee, setFranchisee] = useState(0)
  const [isRestaurant, setIsRestaurant] = useState(true)
  const [userType, setUserType] = useState('')

  const [image, setImage] = useState(null)
  const [imgSrc, setImgSrc] = useState(null)
  const [crop, setCrop] = useState({
    unit: '%',
    width: 100,
    height: 20
  })
  const [completedCrop, setCompletedCrop] = useState(null)
  const [croppedImage, setCroppedImage] = useState(null)
  const imgRef = useRef(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const previewCanvasRef = useRef(null)
  const handleCloseCropModal = () => setShowCropModal(false)

  const [selectedCurrency, setSelectedCurrency] = useState(null)
  const [partnersList, setPartnersList] = useState([])
  const [walletModal, setWalletModal] = useState(false)
  const [resetPasswordModal, setResetPasswordModal] = useState(false)

  const { register, control, watch, errors, handleSubmit, trigger, setValue, reset } = useForm()
  const {
    register: registerWallet,
    handleSubmit: handleWalletSubmit,
    watch: watchWallet,
    formState: { errors: walletErrors },
    reset: resetWalletForm,
    setValue: setWalletValue // ✅ Add this line!
  } = useForm()

  const walletValue = watchWallet('addbalance')

  const getPartnersList = async () => {
    setLoading(true)
    try {
      const collectionRef = collection(db, 'restaurants')
      const baseQuery = query(
        collectionRef,
        where('isRestaurant', '==', false)
      )

      const querySnapshot = await getDocs(baseQuery)

      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data()
        const { password, ...rest } = data
        return { ...rest, id: doc.id }
      })

      setPartnersList(docs)
    } catch (error) {
      console.error('Error fetching partners list:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRestaurantList = async (param = {}) => {
    setLoading(true)
    try {
      const collectionRef = collection(db, 'restaurants')
      let results = []

      // Extract parameters with default values
      const searchKeyword = param?.reset ? '' : (param?.search || searchTerm)
      const page = param?.reset ? 1 : (param?.page || currentPage)
      const limitCount = param?.reset ? 10 : (param?.limit || rowsPerPage)
      const userFilter = param?.reset ? '' : (param.userType !== undefined ? param.userType : userType)

      // Build the base query
      // const baseQuery = query(collectionRef, orderBy('createdAt', 'desc'))
      // let baseQuery = query(collectionRef, where('createdBy', '==', 'admin'))
      let baseQuery = query(collectionRef, where('isRestaurant', '==', true))

      if (userFilter === "Restaurant") {
        baseQuery = query(baseQuery, where('isRestaurant', '==', true))
      } else if (userFilter === "Partner") {
        baseQuery = query(baseQuery, where('isRestaurant', '==', false))
      }

      // Fetch documents from Firestore
      // const querySnapshot = await getDocs(baseQuery)
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
      setRestaurantsList(paginatedResults)
      setTotalRecords(results.length)

    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getPartnersList()
    getRestaurantList()
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result)

        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (crop) => {
    setCompletedCrop(crop)
  }

  const uploadCroppedImage = async (file) => {

    const uniqueFileName = file.name ? `${uuidv4()}.${file.name.split('.').pop()}` : `${uuidv4()}.png`

    const storageRef = ref(storage, `images/${uniqueFileName}`)

    await uploadBytes(storageRef, file)

    setIsUploaded(uniqueFileName)

    setImage(uniqueFileName)
  }

  const getCroppedImage = () => {
    if (!imgRef.current || !completedCrop?.width || !completedCrop?.height) {
      return
    }

    const canvas = previewCanvasRef.current
    const image = imgRef.current
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const ctx = canvas.getContext('2d')
    canvas.width = completedCrop.width
    canvas.height = completedCrop.height

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    )

    canvas.toBlob(async (blob) => {
      const croppedUrl = URL.createObjectURL(blob)
      setCroppedImage(croppedUrl)

      await uploadCroppedImage(blob)
      handleCloseCropModal()
    })
  }

  const handlePagination = page => {
    setCurrentPage(page.selected + 1)
    getRestaurantList({ page: page.selected + 1 })
  }

  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    setRowsPerPage(value)
    setCurrentPage(1)
    getRestaurantList({ limit: value, page: 1 })
  }

  const handleFilter = val => {
    getRestaurantList()
  }

  const handleReset = () => {
    setSearchTerm('')
    setCurrentPage(1)
    setRowsPerPage(10)
    setUserType('')
    getRestaurantList({ reset: true })
  }

  const openWalletModal = (row) => {
    setEditInfo(row)
    setWalletModal(true)

  }

  const onSubmitWalletForm = async (data) => {
    setSubmitting(true)
    const addedAmount = parseFloat(data.addbalance)
    if (isNaN(addedAmount) || addedAmount <= 0) {
      OpenNotification("error", "Invalid Amount", "Please enter a valid positive number")
      setSubmitting(false)
      return
    }

    const collectionRef = collection(db, "restaurants")
    const walletRef = collection(db, "walletTransaction")

    if (editInfo && editInfo.id) {
      try {
        // 🔹 Fetch latest balance from Firestore
        const docRef = doc(collectionRef, editInfo.id)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          OpenNotification("error", "Error", "Restaurant not found!")
          setSubmitting(false)
          return
        }

        const restaurantData = docSnap.data()
        const existingBalance = parseFloat(restaurantData.walletBalance || 0)
        const updatedBalance = existingBalance + addedAmount

        // 🔹 Update wallet balance
        await updateDoc(docRef, { walletBalance: updatedBalance })

        // 🔹 Add wallet transaction
        const token = localStorage.getItem("token")
        if (!token) {
          OpenNotification("error", "Error", "Please login again!")
          setSubmitting(false)
          return
        }

        const walletTransaction = {
          fromId: token,
          toId: editInfo.id,
          from: "superadmin",
          to: "restaurant",
        
          amount: addedAmount,
          currency: editInfo.currency,
          updatedAt: Timestamp.now()
        }

        await addDoc(walletRef, walletTransaction)

        OpenNotification("success", "Success", isRestaurant ? "Restaurant wallet updated successfully!" : "Partner wallet updated successfully!")
        setSubmitting(false)
        setWalletModal(false)
        getRestaurantList()
        resetWalletForm()
      } catch (error) {
        setSubmitting(false)
        console.error("Error updating wallet:", error)
        OpenNotification("error", "Oops!", "Failed to update wallet!")
      }
    }
  }


  function validatePhoneNumber(phoneNumber) {
    const regex = /^\+?(\d{1,4})?[-.\s]?(\(?\d{2,4}\)?)?[-.\s]?\d{3,4}[-.\s]?\d{4,6}$/
    return regex.test(phoneNumber)
  }

  const generateUniqueCode = async (field, length) => {
    const generateCode = () => {
      return Math.floor(Math.random() * Math.pow(10, length))
    }

    let isUnique = false
    let code = ""

    while (!isUnique) {
      code = generateCode()
      const collectionRef = collection(db, 'restaurants')
      const querySnapshot = await getDocs(query(collectionRef, where(field, "==", code)))

      if (querySnapshot.empty) {
        isUnique = true
      }
    }

    return code
  }

  const loadCurrencyOptions = (inputValue, callback) => {
    const filteredOptions = Currencies
      .filter(currency => currency.name.toLowerCase().includes(inputValue.toLowerCase()))
      .map(currency => ({
        label: `${currency.name} (${currency.symbol})`,
        value: currency.code,
        symbol: currency.symbol
      }))

    callback(filteredOptions)
  }

  const handleCurrencyChange = (selectedOption) => {
    if (selectedOption) {
      setSelectedCurrency(selectedOption)
      setValue('currency', selectedOption)
    }
  }


  const onSubmit = async (obj) => {
    setSubmitting(true)
    const collectionRef = collection(db, 'restaurants')
    const walletRef = collection(db, "walletTransaction")

    try {
      if (obj.contactNumber && validatePhoneNumber(obj.contactNumber) === false) {
        OpenNotification('error', 'Oops!', 'Please enter valid phone number')
        return false
      }

      const params = {
        name: obj.name,
        contactName: obj.contactName ? obj.contactName : "",
        contactNumber: obj.contactNumber,
        address: obj.address,
        franchise: franchisee

      }

      if (isUploaded) {
        params.logo = isUploaded
      }

      params.currency = {
        name: obj.currency?.label ? obj.currency.label.split(' (')[0] : obj.currency?.name || "",
        symbol: obj.currency.symbol,
        value: obj.currency.value
      }

      if (editInfo) {
        const docRef = doc(collectionRef, editInfo.id)
        await updateDoc(docRef, params)
        OpenNotification('success', 'Success', isRestaurant ? 'Restaurant details updated successfully!' : 'Partner details updated successfully!')

      } else {

        params.walletBalance = parseFloat(obj.walletBalance || 0)
        params.email = obj.contactEmail
        params.password = CryptoJS.MD5(obj.password).toString()
        params.createdAt = Timestamp.now()
        params.role = "superadmin"
        params.isRestaurant = isRestaurant
        params.createdBy = "admin"
        params.restaurantCode = await generateUniqueCode("restaurantCode", 6)
        params.waiterCode = await generateUniqueCode("waiterCode", 4)

        const token = localStorage.getItem('token')
        if (!token) {
          OpenNotification('error', 'Error', 'Please login again!')
          setLoading(false)
          return
        }

        const restaurantDocRef = await addDoc(collectionRef, params)
        const walletTransaction = {
          fromId: token,
          toId: restaurantDocRef.id,
          from: "superadmin",
          to: 'restaurant',
            toName: obj.name,
          amount: parseFloat(obj.walletBalance || 0),
          currency: {
            name: obj.currency?.label ? obj.currency.label.split(' (')[0] : obj.currency?.name || "",
            symbol: obj.currency.symbol,
            value: obj.currency.value
          },
          createdAt:Timestamp.now(),
          updatedAt: Timestamp.now()
        }

        await addDoc(walletRef, walletTransaction)
        OpenNotification('success', 'Success', isRestaurant ? 'Restaurant added successfully!' : 'Partner added successfully!')

      }

      setImage(null)
      setCroppedImage(null)
      setAddUserModal(false)
      setImages(null)
      setIsUploaded(null)
      getRestaurantList()
      reset()
    } catch (error) {
      console.error('Error saving restaurant:', error)
      OpenNotification('error', 'Oops!', 'Failed to save restaurant details!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdd = () => {
    setCroppedImage(null)
    setFranchisee(1)
    setEditInfo(null)
    setImage(null)
    setIsUploaded(null)
    setAddUserModal(true)
    setIsRestaurant(true)
  }

  const handleEdit = (row) => {

    setCompletedCrop(null)
    setCroppedImage(null)
    setImgSrc(null)
    setImage(null)

    setTimeout(() => {
      setValue("name", row.name)
      setValue("contactName", row.contactName)
      setValue("contactNumber", row.contactNumber)
      setValue("contactEmail", row.email)
      setValue("address", row.address)
      setValue("franchise", row.franchise)
      setValue("description", row.description)
      setImage(row.logo)

      const typeValue = row.isRestaurant ? "Restaurant" : "Partner"
      setValue("type", typeValue)
      setIsRestaurant(row.isRestaurant)

      if (row.isRestaurant) {
        setValue("taxName", row.taxName)
        setValue("taxValue", row.taxValue)
      }

      if (row.walletBalance !== undefined) {
        setValue("walletBalance", row.walletBalance.toString())
      }

      if (row.currency && typeof row.currency === "object") {
        const selectedCurrencyOption = {
          label: `${row.currency.name} (${row.currency.symbol})`,
          value: row.currency.value,
          symbol: row.currency.symbol
        }

        setSelectedCurrency(selectedCurrencyOption)
        setValue("currency", {
          name: row.currency.name,
          symbol: row.currency.symbol,
          value: row.currency.value
        })
      } else {
        setSelectedCurrency(null)
        setValue("currency", null)
      }

    }, 500)

    setEditInfo(row)

    const num = row.franchise ? parseInt(row.franchise) : 0
    setFranchisee(num)
    setAddUserModal(true)
  }

  { /* DELETE RESTAURANTS */ }
  const handleDelete = (row) => {
    return MySwal.fire({
      title: 'Are you sure?',
      text: "You want to delete this restaurant!",
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
          const docRef = doc(db, 'restaurants', row.id)

          deleteDoc(docRef).then(() => {
            OpenNotification('success', 'Deleted!', isRestaurant ? 'Restaurant deleted successfully!' : 'Partner deleted successfully!')
            getRestaurantList()
          }).catch((error) => {
            console.error("Error deleting document: ", error)
          })
        } catch (error) {
          console.error('Error deleting Restaurant:', error)
          OpenNotification('error', 'Oops!', 'Failed to delete Restaurant details.')
        }
      }
    })
  }

  const handleLoginToPanel = (row) => {
    return MySwal.fire({
      title: 'Are you sure?',
      text: "You want to login this panel!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Login',
      customClass: {
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-outline-secondary ml-1'
      },
      buttonsStyling: false
    }).then(async (result) => {
      if (result.value) {
        try {
          // 🔐 Generate a unique 16-digit token
          const rawUuid = uuidv4().replace(/-/g, '').slice(0, 16)
          const docRef = doc(db, 'restaurants', row.id)

          // 📝 Update the restaurant with the SSO token
          await updateDoc(docRef, {
            sso_token: rawUuid
          })

          //  Open new tab with redirect URL
          const loginURL = `${Config.MANAGER_URL}/auto-login/${rawUuid}`
          window.open(loginURL, '_blank')
        } catch (error) {
          console.error('Error generating SSO token:', error)
          OpenNotification('error', 'Oops!', 'Failed to initiate login.')
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
      name: 'Partner',
      selector: 'partner',
      cell: row => {
        const partner = partnersList.find(partner => partner.id === row.referrerId)
        return <>{partner ? partner.name : '-'}</>
      }
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
      minWidth: '220px',
      center: true,
      cell: (row, index) => (
        <>
          <UncontrolledDropdown>
            <DropdownToggle tag='div' className='btn btn-sm'>
              <MoreVertical size={18} />
            </DropdownToggle>
            <DropdownMenu end className='dropdown-menu-custom'>
              {/* <DropdownItem className='d-flex align-items-center w-100' onClick={() => {
                setEditInfo(row)
                setViewModal(true)
              }}> */}
                <DropdownItem tag={Link} to={`/view/${row.id}`}>
                <Eye size={16} className='mr-1' />
                <span className='align-middle'>View</span>
              </DropdownItem>

              <DropdownItem className='d-flex align-items-center w-100' onClick={() => handleEdit(row)}>
                <Edit size={16} className='mr-1' />
                <span className='align-middle'>Edit</span>
              </DropdownItem>

              <DropdownItem className='d-flex align-items-center w-100' onClick={() => handleDelete(row)}>
                <Trash2 size={16} className='mr-1' />
                <span className='align-middle'>Delete</span>
              </DropdownItem>

              <DropdownItem className='d-flex align-items-center w-100' onClick={() => {
                setEditInfo(row)
                setResetPasswordModal(true)
              }}>
                <Settings size={16} className='mr-1' />
                <span className='align-middle'>Change Password</span>
              </DropdownItem>

              <DropdownItem className='d-flex align-items-center w-100' onClick={() => openWalletModal(row)}>
                <FaWallet size={16} className='mr-1' />
                <span className='align-middle'>Add Wallet Balance</span>
              </DropdownItem>

              <DropdownItem className='d-flex align-items-center w-100' onClick={() => handleLoginToPanel(row)}>
                <LogIn size={16} className='mr-1' />
                <span className='align-middle'>Login to Panel</span>
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>

        </>
      )
    }
  ]

  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='Manage Restaurant' breadCrumbParent='Restaurant' breadCrumbActive='List' />
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
            data={restaurantsList}
            subHeaderComponent={
              <CustomHeader
                handlePerPage={handlePerPage}
                rowsPerPage={rowsPerPage}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleFilter={handleFilter}
                handleReset={handleReset}
                setCurrentPage={setCurrentPage}
                getRestaurantList={getRestaurantList}
                handleAdd={handleAdd}
                userType={userType}
                setUserType={setUserType}

              />
            }
          />
        </div>
      </Card>

      {/* ADD RESTAURANT */}
      <Modal isOpen={addUserModal} toggle={() => setAddUserModal(!addUserModal)} size={'md'}>
        <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>
          {editInfo ? `Edit ${isRestaurant ? 'Restaurant' : 'Partner'}` : `Add ${isRestaurant ? 'Restaurant' : 'Partner'}`}
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit(onSubmit)}>

            {/* <FormGroup>
              <Label for="type">Select Type <span className="text-danger">*</span></Label>

              <Input
                type="select"
                id="type"
                {...register("type", { required: true })}
                className={classnames("form-control", { "is-invalid": errors.type })}
                value={watch("type") || ""}
                onChange={(e) => {
                  setValue("type", e.target.value)
                  setIsRestaurant(e.target.value === "Restaurant")
                }}
              >
                <option value="">Select Type</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Partner">Partner</option>
              </Input>
            </FormGroup> */}

            <FormGroup>
              <Label for='name'>{isRestaurant ? 'Restaurant Name' : 'Partner Name'} <span className='text-danger'>*</span></Label>
              <Input id='name' name='name' innerRef={register({ required: true })} placeholder={`Enter ${isRestaurant ? 'Restaurant' : 'Partner'} Name`} className={classnames({ 'is-invalid': errors.name })} />
            </FormGroup>

            {isRestaurant && (
              <FormGroup>
                <Label for='contactName'>Contact Person Name <span className='text-danger'>*</span></Label>
                <Input id='contactName' name='contactName' innerRef={register({ required: true })} placeholder='Enter Name' className={classnames({ 'is-invalid': errors.contactName })} />
              </FormGroup>
            )}

            <FormGroup>
              <Label for='contactNumber'>Phone Number <span className='text-danger'>*</span></Label>
              <Input id='contactNumber' name='contactNumber' innerRef={register({ required: true })} placeholder='Enter Phone Number' className={classnames({ 'is-invalid': errors.contactNumber })} />
            </FormGroup>

            <FormGroup>
              <Label for='contactEmail'>{isRestaurant ? 'Restaurant Email' : 'Partner Email'} <span className='text-danger'>*</span></Label>
              <Input type='email' id='contactEmail' name='contactEmail' innerRef={register({ required: true })} placeholder={`Enter ${isRestaurant ? 'Restaurant' : 'Partner'} Email`} className={classnames({ 'is-invalid': errors.contactEmail })} readOnly={editInfo} />
            </FormGroup>

            {!editInfo && (
              <>
                <FormGroup>
                  <Label for='password'>Password <span className='text-danger'>*</span></Label>
                  <InputPasswordToggle id='password' name='password' classNames='input-group-merge' placeholder='Enter Password' innerRef={register({ required: true })} className={classnames({ 'is-invalid': errors.password })} />
                  {errors.password && <small className='text-danger'>{errors.password.message}</small>}
                </FormGroup>
              </>
            )}
            <FormGroup>
              <Label for="currency">
                Select Currency <span className="text-danger">*</span>
              </Label>

              <Controller
                name='currency'
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    {...field}
                    loadOptions={loadCurrencyOptions}
                    defaultOptions
                    onChange={handleCurrencyChange}
                    value={selectedCurrency || {
                      label: `${Currencies[0].name} (${Currencies[0].symbol})`,
                      value: Currencies[0].code,
                      symbol: Currencies[0].symbol
                    }}

                  />
                )}
              />
            </FormGroup>
            {!editInfo && (
              <>
                <FormGroup>
                  <Label for='walletBalance'>
                    Wallet Balance {selectedCurrency?.symbol && `(${selectedCurrency.symbol})`} <span className='text-danger'>*</span>
                  </Label>
                  <Input
                    id='walletBalance'
                    name='walletBalance'
                    type='number'
                    step='0.01'
                    min='0'
                    innerRef={register({
                      required: true,
                      min: {
                        value: 0,
                        message: 'Wallet balance cannot be negative'
                      },
                      validate: value => !isNaN(parseFloat(value)) || 'Enter a valid number'
                    })}
                    placeholder='Enter Wallet Balance'
                    className={classnames({ 'is-invalid': errors.walletBalance })}
                  />

                </FormGroup>
              </>
            )}

            <FormGroup>
              <Label for='address'>Address</Label>
              <Input id='address' name='address' innerRef={register({ required: false })} placeholder='Enter Address' className={classnames({ 'is-invalid': errors.address })} />
            </FormGroup>

            {!isRestaurant && (
              <FormGroup>
                <Label for='franchise'>Number of Restaurants</Label>
                <NumberInput className='w-50' id='basic-number-input' value={franchisee} onChange={count => setFranchisee(count || 0)} />

              </FormGroup>
            )}

            <FormGroup>
              <Label>Upload {(isRestaurant) ? "Logo" : "Image"}</Label>
              <Input type='file' accept='image/*' onChange={handleImageChange} />
            </FormGroup>
            {croppedImage && <img src={croppedImage} alt='Cropped' style={{ width: '50%' }} />}
            {!croppedImage && image && <img src={`${Config.MEDIA_URL}${image}?alt=media`} alt='Logo' style={{ width: '100px', marginRight: '10px', marginBottom: '10px' }} />}

            <ModalFooter>
              <Button type='submit' disabled={submitting} color='primary'>
                {submitting ? <><Spinner color='white' size='sm' /></> : 'Submit'}
              </Button>
              <Button color='secondary' onClick={() => setAddUserModal(!addUserModal)}>Cancel</Button>
            </ModalFooter>
          </Form>
        </ModalBody>
      </Modal>


      <Modal isOpen={walletModal} toggle={() => setWalletModal(false)}>
        <ModalHeader toggle={() => setWalletModal(false)}>Add Wallet Balance</ModalHeader>
        <Form onSubmit={handleWalletSubmit(onSubmitWalletForm)}>
          <ModalBody>
            <FormGroup>
              <Label for='addbalance'>
                Add Balance {editInfo?.currency?.symbol && `(${editInfo.currency.symbol})`}
                <span className='text-danger'>*</span>
              </Label>
              <Input
                id='addbalance'
                name='addbalance'
                type='number'
                step='0.01'
                value={walletValue || ''}
                placeholder='Enter Amount to add balance'
                {...registerWallet('addbalance', {
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Enter a valid amount' },
                  valueAsNumber: true
                })}
                onChange={(e) => setWalletValue('addbalance', e.target.value, {
                  shouldValidate: true
                })
                }
                invalid={!!walletErrors.addbalance}
              />
              {walletErrors.addbalance && (
                <FormFeedback>{walletErrors.addbalance.message}</FormFeedback>
              )}
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button disabled={submitting} color='primary'>
              {(submitting) ? <> <Spinner color='white' size='sm' /> </> : 'Submit'}
            </Button>
            <Button
              type='button'
              color='secondary'
              onClick={() => {
                setWalletModal(false)
                resetWalletForm()
              }}
            >
              Cancel
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <ResetPasswordModal resetPasswordModal={resetPasswordModal} setResetPasswordModal={setResetPasswordModal} editInfo={editInfo} />

      <Modal isOpen={showCropModal} toggle={handleCloseCropModal}>
        <ModalHeader closeButton>
          Crop Image
        </ModalHeader>
        <ModalBody>
          {image && (
            <ReactCrop
              src={image}
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={handleCropComplete}
              aspect={(isRestaurant) ? 16 / 4 : 10 / 10}
            >
              <img ref={imgRef} src={image} alt="To crop" />
            </ReactCrop>
          )}
          <canvas ref={previewCanvasRef} style={{ display: "none" }} />
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={handleCloseCropModal}>Cancel</Button>
          <Button color="primary" onClick={getCroppedImage}>Save</Button>
        </ModalFooter>
      </Modal>

      {/******* VIEW RESTAURANT DETAIL ********/}
      <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-centered' size="sm">
        <ModalHeader toggle={() => setViewModal(!viewModal)}>
          View {editInfo?.isRestaurant ? 'Restaurant' : 'Partner'}

        </ModalHeader>
        <ModalBody>
          <Row>
            <Col md='12'>
              <dl className='view-recipient'>
                <Row>
                  <Col md='12'>
                    <strong style={{ fontWeight: 'bold' }}>
                      {editInfo?.isRestaurant ? 'Restaurant Name' : 'Partner Name'}
                    </strong>
                    <dd >{editInfo?.name || '-'}</dd>
                  </Col>
                  {editInfo?.isRestaurant && (
                    <Col md='12'>
                      <strong style={{ fontWeight: 'bold' }}>Contact Person Name</strong>
                      <dd >{editInfo?.contactName || '-'}</dd>
                    </Col>
                  )}
                  <Col md='12'>
                    <strong style={{ fontWeight: 'bold' }}>
                      {editInfo?.isRestaurant ? 'Restaurant Email' : 'Partner Email'}
                    </strong>
                    <dd >{editInfo?.email || '-'}</dd>
                  </Col>
                  <Col md='12'>
                    <strong style={{ fontWeight: 'bold' }}>Phone Number</strong>
                    <dd >{editInfo?.contactNumber || '-'}</dd>
                  </Col>
                  <Col md='12'>
                    <strong style={{ fontWeight: 'bold' }}>Currency</strong>
                    <dd >
                      {editInfo?.currency?.symbol || Currencies[0]?.symbol || "-"}
                    </dd>
                  </Col>

                  <Col md='12'>
                    <strong style={{ fontWeight: 'bold' }}>Address</strong>
                    <dd >{editInfo?.address || '-'}</dd>
                  </Col>
                  {!editInfo?.isRestaurant && (
                    <Col md='12'>
                      <strong style={{ fontWeight: 'bold' }}>Number of Restaurants</strong>
                      <dd >{editInfo?.franchise || '-'}</dd>
                    </Col>
                  )}
                  <Col md='12'>
                    <strong style={{ fontWeight: 'bold' }}>
                      {editInfo?.isRestaurant ? 'Restaurant Code' : 'Partner Code'}
                    </strong>
                    <dd >{editInfo?.restaurantCode || '-'}</dd>
                  </Col>

                  <Col md="12">
                    <strong style={{ fontWeight: 'bold' }}>Wallet Balance</strong>
                    <dd>
                      {editInfo?.walletBalance !== undefined ? `${editInfo?.currency?.symbol || ''} ${editInfo.walletBalance.toFixed(2)}` : '-'}
                    </dd>
                  </Col>

                  <Col md="12">
                    <strong style={{ fontWeight: 'bold' }}>
                      {editInfo?.isRestaurant ? 'Restaurant Logo' : 'Partner Logo'}
                    </strong>
                    <dd>
                      {editInfo?.logo ? (
                        <div className="image-gallery mt-1">
                          <img
                            src={`${Config.MEDIA_URL}${editInfo.logo}?alt=media`}
                            alt="Logo"
                            style={{
                              width: '100px',
                              marginRight: '10px',
                              marginBottom: '10px'
                            }}
                          />
                        </div>
                      ) : (
                        <span >-</span>
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

export default RestaurantList
