// ** React Imports
import { Fragment, useEffect, useState, useRef } from 'react'
import classnames from 'classnames'

// ** Third Party Components
import ReactPaginate from 'react-paginate'
import { ChevronDown, Trash2, Search, Eye, RefreshCcw, MoreVertical, LogIn, Settings } from 'react-feather'
import { Edit } from 'react-feather/dist'
import DataTable from 'react-data-table-component'
import { Card, Input, Row, Col, Label, CustomInput, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Form, ModalFooter, FormGroup, Spinner, UncontrolledTooltip, Alert, FormFeedback, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import { OpenNotification } from '@src/views/components/Helper'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Spinners from '@components/spinner/Loading-spinner'
import InputPasswordToggle from '@components/input-password-toggle'
import NumberInput from '@components/number-input'
import 'react-image-crop/dist/ReactCrop.css'
import ReactCrop, { Crop } from 'react-image-crop'
import Config from '@src/configs/config.json'
import Currencies from '../../../../../src/configs/currencies.json'
import AsyncSelect from 'react-select/async'

const MySwal = withReactContent(Swal)

// ** Styles
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import { useForm, Controller } from 'react-hook-form'
import { collection, getDocs, query, Timestamp, addDoc, updateDoc, deleteDoc, doc, orderBy, where, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import CryptoJS from "crypto-js"
import { v4 as uuidv4 } from 'uuid'
import { useHistory } from 'react-router-dom'
import { db, storage } from '../../../../configs/firebaseConfig'
import { validateRestaurant } from '../../../components/Helper'
import { useDispatch } from 'react-redux'
import { FaHistory, FaWallet } from 'react-icons/fa'
import ResetPasswordModal from '../../../components/ResetPassword'
import { Link } from 'react-router-dom/cjs/react-router-dom.min'

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
                <Button color='secondary' style={{ height: "2.8rem" }} outline onClick={() => {
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
  const [restaurantLimit, setRestauantLimit] = useState(0)
  const [isPartner, setIsPartner] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState(null)

  const [existingWalletBalance, setExistingWalletBalance] = useState(0)

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
  const canvasRef = useRef(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showCropModal, setShowCropModal] = useState(false)
  const [restaurantName, setRestaurantName] = useState("")
  const previewCanvasRef = useRef(null)

  const handleShowAddModal = () => setShowAddModal(true)
  const handleCloseAddModal = () => setShowAddModal(false)

  const handleShowCropModal = () => setShowCropModal(true)
  const handleCloseCropModal = () => setShowCropModal(false)
  const [walletModal, setWalletModal] = useState(false)
  const [resetPasswordModal, setResetPasswordModal] = useState(false)


  const { register, control, errors, handleSubmit, trigger, setValue, reset } = useForm()
  const history = useHistory()
  const dispatch = useDispatch()
  const {
    register: registerWallet,
    handleSubmit: handleWalletSubmit,
    watch: watchWallet,
    formState: { errors: walletErrors },
    reset: resetWalletForm,
    setValue: setWalletValue // ✅ Add this line!
  } = useForm()

  const walletValue = watchWallet('addbalance')

  const getFranchiseList = async (param = {}) => {
    setLoading(true)
    try {
      validateRestaurant(dispatch, history).catch(console.error)
      const collectionRef = collection(db, 'restaurants')
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

      const baseQuery = query(collectionRef, where('createdBy', '==', "partner"), where('referrerId', '==', token))

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
      // console.log("Restaurant list:", results)

    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getFranchiseList()
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
    console.log('File uploaded successfully')
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

  const openWalletModal = (row) => {
    setEditInfo(row)
    setWalletModal(true)

  }

  const onSubmitWalletForm = async (data) => {
    const addedAmount = parseFloat(data.addbalance)
    if (isNaN(addedAmount) || addedAmount <= 0) {
      OpenNotification('error', 'Invalid Amount', 'Please enter a valid positive number')
      return
    }

    const collectionRef = collection(db, 'restaurants')
    const restaurantId = editInfo?.id
    const creatorId = localStorage.getItem('token')

    if (!restaurantId || !creatorId) {
      OpenNotification('error', 'Error', 'Something went wrong. Please log in again.')
      return
    }

    // ✅ Use state instead of fetching again
    const creatorBalance = parseFloat(existingWalletBalance || 0)

    if (addedAmount > creatorBalance) {
      OpenNotification('error', 'Insufficient Balance', 'Oops! You don’t have sufficient balance. Please contact the admin.')
      return
    }

    try {
      // Get current balance of the target restaurant (just once)
      const restaurantRef = doc(collectionRef, restaurantId)
      const restaurantSnap = await getDoc(restaurantRef)
      const restaurantData = restaurantSnap.exists() ? restaurantSnap.data() : {}
      const existingRestaurantBalance = parseFloat(restaurantData.walletBalance || 0)
      const updatedRestaurantBalance = existingRestaurantBalance + addedAmount
      const updatedCreatorBalance = creatorBalance - addedAmount

      // Update restaurant wallet
      await updateDoc(restaurantRef, {
        walletBalance: updatedRestaurantBalance
      })

      // Update creator wallet
      const creatorRef = doc(collectionRef, creatorId)
      await updateDoc(creatorRef, {
        walletBalance: updatedCreatorBalance
      })

      // ✅ Update state immediately
      setExistingWalletBalance(updatedCreatorBalance)

      OpenNotification('success', 'Success', 'Restaurant wallet updated successfully!')

      setWalletModal(false)
      getFranchiseList()
      resetWalletForm()
    } catch (error) {
      console.error('Error updating wallet:', error)
      OpenNotification('error', 'Oops!', 'Failed to update wallet!')
    }
  }

  const validateGST = (gstNumber) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstRegex.test(gstNumber)
  }

  function validatePhoneNumber(phoneNumber) {
    const regex = /^\+?(\d{1,4})?[-.\s]?(\(?\d{2,4}\)?)?[-.\s]?\d{3,4}[-.\s]?\d{4,6}$/
    return regex.test(phoneNumber)
  }

  const getFranchiseLimit = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token not found. Redirecting to login.')
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
        throw new Error('Token not found')
      }

      setFetching(true)
      const franchiseRef = doc(db, 'restaurants', token)

      const franchiseSnapshot = await getDoc(franchiseRef)
      setFetching(false)
      if (franchiseSnapshot.exists()) {
        const franchiseData = franchiseSnapshot.data()
        if (franchiseData && franchiseData.isRestaurant === false) {
          setIsPartner(true)
        }
        setRestauantLimit(franchiseData.franchise)

      } else {
        console.log('No such restaurant document!')
      }
    } catch (error) {
      setFetching(false)
      OpenNotification('error', 'Error', 'Failed to fetch restaurant details')
    }
  }

  const fetchWalletBalance = async () => {
    const restaurantId = localStorage.getItem('token')

    if (!restaurantId) {
      console.error('Token not found. Redirecting to login.')
      OpenNotification('error', 'Error', 'Please login again!')
      history.push('/login')
      return
    }

    try {
      const docRef = doc(db, 'restaurants', restaurantId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.walletBalance !== undefined) {
          setExistingWalletBalance(data.walletBalance)
        } else {
          console.warn('walletBalance field not found in Firestore document')
        }
      } else {
        console.warn('No restaurant document found for the given ID')
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
    }
  }

  useEffect(() => {
    getFranchiseLimit()
    fetchWalletBalance()
  }, [])

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
      // console.log("selected option:", selectedOption)
      setSelectedCurrency(selectedOption)
      setValue('currency', selectedOption)
    }
  }

  // const onSubmit = async (obj) => {
  //   setSubmitting(true)
  //   const collectionRef = collection(db, 'restaurants')
  //   const walletRef = collection(db, "walletTransaction")
  //   validateRestaurant(dispatch, history).catch(console.error)
  //   try {
  //     if (obj.contactNumber && validatePhoneNumber(obj.contactNumber) === false) {
  //       OpenNotification('error', 'Oops!', 'Please enter valid phone number')
  //       return false
  //     }
  //     // if (obj.gstNumber && validateGST(obj.gstNumber) === false) {
  //     //     OpenNotification('error', 'Oops!', 'Please enter valid GST number')
  //     //     return false
  //     // }

  //     const token = localStorage.getItem('token')
  //     if (!token) {
  //       OpenNotification('error', 'Error', 'Please login again!')
  //       history.push('/login')
  //       return
  //     }
  //     const newWalletBalance = parseFloat(obj.walletBalance || 0)

  //     if (!editInfo && newWalletBalance > existingWalletBalance) {
  //       OpenNotification('error', 'Insufficient Balance', 'Oops! You don’t have sufficient balance. Please contact the admin.')
  //       setSubmitting(false)
  //       return
  //     }

  //     const params = {
  //       name: obj.name,
  //       contactName: obj.contactName,
  //       contactNumber: obj.contactNumber,
  //       address: obj.address
  //       // gstNumber: obj.gstNumber,
  //       // description: obj.description
  //     }

  //     if (isUploaded) {
  //       params.logo = isUploaded
  //     }

  //     params.currency = {
  //       name: obj.currency?.label ? obj.currency.label.split(' (')[0] : obj.currency?.name || "",
  //       symbol: obj.currency.symbol,
  //       value: obj.currency.value
  //     }

  //     if (editInfo) {
  //       params.updatedAt = Timestamp.now()
  //       const docRef = doc(collectionRef, editInfo.id)
  //       await updateDoc(docRef, params)
  //       OpenNotification('success', 'Success', 'Restaurant details updated successfully!')
  //     } else {

  //       params.walletBalance = newWalletBalance
  //       params.email = obj.contactEmail
  //       params.password = CryptoJS.MD5(obj.password).toString()
  //       params.createdAt = Timestamp.now()
  //       params.referrerId = token
  //       params.isRestaurant = true
  //       params.createdBy = "partner"
  //       params.restaurantCode = await generateUniqueCode("restaurantCode", 6)
  //       params.waiterCode = await generateUniqueCode("waiterCode", 4)

  //       await addDoc(collectionRef, params)
  //       OpenNotification('success', 'Success', 'Restaurant added successfully!')

  //       if (newWalletBalance > 0) {
  //         const creatorRef = doc(db, 'restaurants', token)
  //         const creatorSnap = await getDoc(creatorRef)

  //         if (creatorSnap.exists()) {
  //           const creatorData = creatorSnap.data()
  //           const updatedCreatorBalance = parseFloat(creatorData.walletBalance || 0) - newWalletBalance

  //           await updateDoc(creatorRef, {
  //             walletBalance: updatedCreatorBalance
  //           })
  //           setExistingWalletBalance(updatedCreatorBalance)
  //         }
  //       }
  //     }

  //     // Reset modal state
  //     setImage(null)
  //     setCroppedImage(null)
  //     setAddUserModal(false)
  //     setImages(null)
  //     setIsUploaded(null)
  //     getFranchiseList()
  //     reset()
  //   } catch (error) {
  //     OpenNotification('error', 'Oops!', 'Failed to save restaurant details!')
  //   } finally {
  //     setSubmitting(false)
  //   }
  // }

//   const onSubmit = async (obj) => {
//   setSubmitting(true)
//   const collectionRef = collection(db, 'restaurants')
//   const walletRef = collection(db, 'walletTransaction')
//   validateRestaurant(dispatch, history).catch(console.error)

//   try {
//     if (obj.contactNumber && validatePhoneNumber(obj.contactNumber) === false) {
//       OpenNotification('error', 'Oops!', 'Please enter valid phone number')
//       return false
//     }

//     const token = localStorage.getItem('token')
//     if (!token) {
//       OpenNotification('error', 'Error', 'Please login again!')
//       history.push('/login')
//       return
//     }

//     const newWalletBalance = parseFloat(obj.walletBalance || 0)

//     if (!editInfo && newWalletBalance > existingWalletBalance) {
//       OpenNotification(
//         'error',
//         'Insufficient Balance',
//         'Oops! You don’t have sufficient balance. Please contact the admin.'
//       )
//       setSubmitting(false)
//       return
//     }

//     const params = {
//       name: obj.name,
//       contactName: obj.contactName,
//       contactNumber: obj.contactNumber,
//       address: obj.address
//     }

//     if (isUploaded) {
//       params.logo = isUploaded
//     }

//     params.currency = {
//       name: obj.currency?.label ? obj.currency.label.split(' (')[0] : obj.currency?.name || '',
//       symbol: obj.currency.symbol,
//       value: obj.currency.value
//     }

//     if (editInfo) {
//       params.updatedAt = Timestamp.now()
//       const docRef = doc(collectionRef, editInfo.id)
//       await updateDoc(docRef, params)
//       OpenNotification('success', 'Success', 'Restaurant details updated successfully!')
//     } else {
//       params.walletBalance = newWalletBalance
//       params.email = obj.contactEmail
//       params.password = CryptoJS.MD5(obj.password).toString()
//       params.createdAt = Timestamp.now()
//       params.referrerId = token
//       params.isRestaurant = true
//       params.createdBy = 'partner'
//       params.restaurantCode = await generateUniqueCode('restaurantCode', 6)
//       params.waiterCode = await generateUniqueCode('waiterCode', 4)

//       const restaurantDocRef = await addDoc(collectionRef, params)
//       OpenNotification('success', 'Success', 'Restaurant added successfully!')

//       // Store wallet transaction for the new restaurant
//       if (newWalletBalance > 0) {
//         // Deduct balance from creator
//         const creatorRef = doc(db, 'restaurants', token)
//         const creatorSnap = await getDoc(creatorRef)

//         if (creatorSnap.exists()) {
//           const creatorData = creatorSnap.data()
//           const updatedCreatorBalance = parseFloat(creatorData.walletBalance || 0) - newWalletBalance

//           await updateDoc(creatorRef, {
//             walletBalance: updatedCreatorBalance
//           })
//           setExistingWalletBalance(updatedCreatorBalance)

//           // Add wallet transaction
//           const walletTransaction = {
//             fromId: token,
//             toId: restaurantDocRef.id,
//             from: creatorData.name || 'Partner',
//             toName: obj.name,
//             amount: newWalletBalance,
//             currency: {
//               name: obj.currency?.label ? obj.currency.label.split(' (')[0] : obj.currency?.name || '',
//               symbol: obj.currency.symbol,
//               value: obj.currency.value
//             },
//             createdAt: Timestamp.now(),
//             updatedAt: Timestamp.now()
//           }
// console.log('walletTransaction', walletTransaction)
//           await addDoc(walletRef, walletTransaction)
//         }
//       }
//     }

//     // Reset modal state
//     setImage(null)
//     setCroppedImage(null)
//     setAddUserModal(false)
//     setImages(null)
//     setIsUploaded(null)
//     getFranchiseList()
//     reset()
//   } catch (error) {
//     console.error(error)
//     OpenNotification('error', 'Oops!', 'Failed to save restaurant details!')
//   } finally {
//     setSubmitting(false)
//   }
// }

const onSubmit = async (obj) => {
  setSubmitting(true)
  const collectionRef = collection(db, 'restaurants')
  const walletRef = collection(db, 'walletTransaction')
  validateRestaurant(dispatch, history).catch(console.error)

  try {
    // ✅ Validate phone number
    if (obj.contactNumber && !validatePhoneNumber(obj.contactNumber)) {
      OpenNotification('error', 'Oops!', 'Please enter a valid phone number')
      return false
    }

    // ✅ Ensure login
    const token = localStorage.getItem('token')
    if (!token) {
      OpenNotification('error', 'Error', 'Please login again!')
      history.push('/login')
      return
    }

    const newWalletBalance = parseFloat(obj.walletBalance || 0)

    // ✅ Prevent overdraft if editing
    if (!editInfo && newWalletBalance > existingWalletBalance) {
      OpenNotification(
        'error',
        'Insufficient Balance',
        'Oops! You don’t have sufficient balance. Please contact the admin.'
      )
      setSubmitting(false)
      return
    }

    const params = {
      name: obj.name,
      contactName: obj.contactName,
      contactNumber: obj.contactNumber,
      address: obj.address,
      currency: {
        name: obj.currency?.label ? obj.currency.label.split(' (')[0] : obj.currency?.name || '',
        symbol: obj.currency.symbol,
        value: obj.currency.value
      }
    }

    if (isUploaded) {
      params.logo = isUploaded
    }

    if (editInfo) {
      // ✅ Update existing restaurant
      params.updatedAt = Timestamp.now()
      const docRef = doc(collectionRef, editInfo.id)
      await updateDoc(docRef, params)
      OpenNotification('success', 'Success', 'Restaurant details updated successfully!')
    } else {
      // ✅ Create new restaurant
      params.walletBalance = newWalletBalance
      params.email = obj.contactEmail
      params.password = CryptoJS.MD5(obj.password).toString()
      params.createdAt = Timestamp.now()
      params.referrerId = token
      params.isRestaurant = true
      params.createdBy = 'partner'
      params.restaurantCode = await generateUniqueCode('restaurantCode', 6)
      params.waiterCode = await generateUniqueCode('waiterCode', 4)

      const restaurantDocRef = await addDoc(collectionRef, params)
      OpenNotification('success', 'Success', 'Restaurant added successfully!')

      // ✅ Always create a wallet transaction — even if balance = 0
      const creatorRef = doc(db, 'restaurants', token)
      const creatorSnap = await getDoc(creatorRef)

      if (creatorSnap.exists()) {
        const creatorData = creatorSnap.data()

        // ✅ Deduct balance only if wallet > 0
        if (newWalletBalance > 0) {
          const updatedCreatorBalance = parseFloat(creatorData.walletBalance || 0) - newWalletBalance
          await updateDoc(creatorRef, { walletBalance: updatedCreatorBalance })
          setExistingWalletBalance(updatedCreatorBalance)
        }

        // ✅ Create wallet transaction log
        const walletTransaction = {
          fromId: token,
          toId: restaurantDocRef.id,
          from: creatorData.name || 'Partner',
          toName: obj.name,
          amount: newWalletBalance,
          currency: {
            name: obj.currency?.label ? obj.currency.label.split(' (')[0] : obj.currency?.name || '',
            symbol: obj.currency.symbol,
            value: obj.currency.value
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          type: newWalletBalance > 0 ? 'added' : 'created' // 👈 helps you know why it was added
        }

        await addDoc(walletRef, walletTransaction)
      } else {
        console.warn('⚠️ Creator document not found in restaurants collection for token:', token)
      }
    }

    // ✅ Reset form and modal
    setImage(null)
    setCroppedImage(null)
    setAddUserModal(false)
    setImages(null)
    setIsUploaded(null)
    getFranchiseList()
    reset()
  } catch (error) {
    console.error(error)
    OpenNotification('error', 'Oops!', 'Failed to save restaurant details!')
  } finally {
    setSubmitting(false)
  }
}

  const handleAdd = async () => {

    if (franchiseList.length >= restaurantLimit) {
      OpenNotification('error', 'OOPS!', `You can't add more restaurants. Restaurants limit of ${restaurantLimit} reached.`)
      return
    }
    setCroppedImage(null)
    setEditInfo(null)
    setImages(null)
    setIsUploaded(null)
    setAddUserModal(true)
  }

  const handleEdit = (row) => {
    setCompletedCrop(null)
    setCroppedImage(null)
    setImgSrc(null)
    setImage(null)
    setTimeout(() => {
      setValue('name', row.name)
      setValue('contactName', row.contactName)
      setValue('contactNumber', row.contactNumber)
      setValue('contactEmail', row.email)
      setValue('address', row.address)
      // setValue('gstNumber', row.gstNumber)
      setValue('franchise', row.franchise)
      // setValue('description', row.description)
      setImage(row.logo)

      setValue('taxName', row.taxName)
      setValue('taxValue', row.taxValue)

      if (row.walletBalance !== undefined) {
        setValue('walletBalance', row.walletBalance.toString())
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
    const num = (row.franchise) ? parseInt(row.franchise) : 0
    setFranchisee(num)
    setAddUserModal(true)
  }

  { /* DELETE FRANCHISE */ }
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
          validateRestaurant(dispatch, history).catch(console.error)
          deleteDoc(docRef).then(() => {
            OpenNotification('success', 'Deleted!', 'Restaurant deleted successfully!')
            getFranchiseList()
          }).catch((error) => {
            console.error("Error deleting document: ", error)
          })
        } catch (error) {
          console.error('Error deleting restaurant:', error)
          OpenNotification('error', 'Oops!', 'Failed to delete restaurant details.')
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

          // ✅ Open new tab with redirect URL
          const loginURL = `${Config.BASE_URL}auto-login/${rawUuid}`
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
      minWidth: '220px',
      center: true,
      cell: (row, index) => (
        <>
          <UncontrolledDropdown>
            <DropdownToggle tag='div' className='btn btn-sm'>
              <MoreVertical size={18} />
            </DropdownToggle>
            <DropdownMenu end>
              {/* <DropdownItem onClick={() => { history.push(`/restaurants/view/${row.id}`) }}> */}
              {/* <DropdownItem onClick={() => {
                setEditInfo(row)
                setViewModal(true)
              }}> */}
                <DropdownItem tag={Link} to={`/view/${row.id}`}>
                <Eye size={16} className='mr-0' /> View
              </DropdownItem>
              <DropdownItem onClick={() => handleEdit(row)}>
                <Edit size={16} className='me-50' /> Edit
              </DropdownItem>
              <DropdownItem onClick={() => handleDelete(row)}>
                <Trash2 size={16} className='me-50' /> Delete
              </DropdownItem>
                {/* <DropdownItem tag={Link} to={`/transactions/${row.id}`}>
  <FaHistory size={16} className='me-50' /> Transaction History
</DropdownItem> */}
              <DropdownItem onClick={() => {
                setEditInfo(row)
                setResetPasswordModal(true)
              }}>
                <Settings size={16} className='me-50' /> Change Password
              </DropdownItem>
              <DropdownItem onClick={() => openWalletModal(row)}>
                <FaWallet size={16} className='me-50' /> Add Wallet Balance
              </DropdownItem>
              <DropdownItem onClick={() => handleLoginToPanel(row)}>
                <LogIn size={16} className='me-50' /> Login to Panel
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
          {/* <Button.Ripple outline color='warning' id={`button-balance-${index + 1}`} size='sm' onClick={() => openWalletModal(row)}>
            <FaWallet size={14} />
          </Button.Ripple> &nbsp;
          <Button.Ripple outline color='secondary' id={`button-view-${index + 1}`} size='sm' onClick={() => { history.push(`/restaurants/view/${row.id}`) }}>
            <Eye size={14} />
          </Button.Ripple> &nbsp;
          <Button.Ripple outline color='info' id={`button-edit-${index + 1}`} size='sm' onClick={() => handleEdit(row)}>
            <Edit size={14} />
          </Button.Ripple> &nbsp;
          <Button.Ripple outline color='danger' id={`button-delete-${index + 1}`} size='sm' onClick={() => handleDelete(row)}>
            <Trash2 size={14} />
          </Button.Ripple> */}

          {/* <UncontrolledTooltip placement='top' target={`button-balance-${index + 1}`}>
            ADD BALANCE
          </UncontrolledTooltip>
          <UncontrolledTooltip placement='top' target={`button-view-${index + 1}`}>
            VIEW
          </UncontrolledTooltip>
          <UncontrolledTooltip placement='top' target={`button-edit-${index + 1}`}>
            EDIT
          </UncontrolledTooltip>
          <UncontrolledTooltip placement='top' target={`button-delete-${index + 1}`}>
            DELETE
          </UncontrolledTooltip> */}
        </>
      )
    }
  ]

  return (
    <Fragment>
      <Breadcrumbs breadCrumbTitle='Manage Restaurants' breadCrumbParent='Restaurants' breadCrumbActive='List' />

      {(fetching) ? <></> : <>
        {(isPartner === true) &&
          <Alert color={franchiseList.length >= restaurantLimit ? 'danger' : 'success'} className="text-center p-2">
            {franchiseList.length >= restaurantLimit ? (
              <>
                <strong>OOPS!</strong> You can't create more restaurants. Restaurants limit of <strong>{restaurantLimit}</strong> reached
              </>
            ) : (
              <>
                You can create up to <strong>{restaurantLimit}</strong> restaurants here
              </>
            )}
          </Alert>
        }
      </>}

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
        <ModalHeader toggle={() => setAddUserModal(!addUserModal)}>{editInfo ? 'Edit' : 'Add'} Restaurant</ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <FormGroup>
              <Label for='name'>Restaurant Name <span className='text-danger'>*</span></Label>
              <Input
                id='name'
                name='name'
                innerRef={register({ required: true })}
                placeholder='Enter Restaurant Name'
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
                Restaurant Email <span className='text-danger'>*</span>
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
              <>
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
              </>
            }

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
            {(editInfo === null) &&
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

            {/* <FormGroup>
              <Label for='description'>About Restaurant</Label>
              <Input
                type="textarea"
                id='description'
                name='description'
                rows="5"
                innerRef={register({ required: false })}
                placeholder='Enter About Restaurant' className={classnames({
                  'is-invalid': errors.description
                })}
              />
            </FormGroup> */}

            <FormGroup>
              <Label>Upload Logo</Label>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
            </FormGroup>
            {croppedImage && <img src={croppedImage} alt="Cropped" style={{ width: "50%" }} />}
            {!croppedImage && image && <img
              src={`${Config.MEDIA_URL}${image}?alt=media`}
              alt={`Logo`}
              style={{ width: '100px', marginRight: '10px', marginBottom: '10px' }}
            />}

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
            <Button type='submit' color='primary'>
              Save
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
              aspect={16 / 4}
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

      {/******* VIEW FRANCHISE DETAIL ********/}
      <Modal isOpen={viewModal} toggle={() => setViewModal(!viewModal)} className='modal-dialog-centered' size="sm">
        <ModalHeader toggle={() => setViewModal(!viewModal)}>View Restaurant</ModalHeader>
        <ModalBody>
          <Row>
            <Col md='12'>
              <dl className='view-recipient'>
                <Row>
                  <Col md='12'><strong>Restaurant Name</strong> <dd>{editInfo && editInfo.name ? editInfo.name : '-'}</dd></Col>
                  <Col md='12'><strong>Contact Person Name</strong> <dd>{editInfo && editInfo.contactName ? editInfo.contactName : '-'}</dd></Col>
                  <Col md='12'><strong>Restaurant Email</strong> <dd>{editInfo && editInfo.email ? editInfo.email : '-'}</dd></Col>
                  <Col md='12'><strong>Phone Number</strong> <dd>{editInfo && editInfo.contactNumber ? editInfo.contactNumber : '-'}</dd></Col>
                  <Col md='12'>
                    <strong style={{ fontWeight: 'bold' }}>Currency</strong>
                    <dd >
                      {editInfo?.currency?.symbol || Currencies[0]?.symbol || "-"}
                    </dd>
                  </Col>
                  <Col md='12'><strong>Address</strong> <dd>{editInfo && editInfo.address ? editInfo.address : '-'}</dd></Col>
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
                    <strong>Restaurant Logo</strong>
                    <dd>
                      {editInfo && editInfo.logo ? (
                        <div className="image-gallery mt-1">
                          <img
                            src={`${Config.MEDIA_URL}${editInfo.logo}?alt=media`}
                            alt={`Logo`}
                            style={{ width: '100px', marginRight: '10px', marginBottom: '10px' }}
                          />
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

export default FranchiseList
