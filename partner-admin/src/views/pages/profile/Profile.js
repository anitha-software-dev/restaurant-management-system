import { Fragment, useState, useEffect } from 'react'
import * as yup from 'yup'
import classnames from 'classnames'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { Form, FormGroup, Row, Col, Button, Label, Input, Card, CardBody, CardHeader, Spinner, CardFooter } from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'
import { Service } from '@src/services/Service'
import { OpenNotification } from '@src/views/components/Helper'
import '@styles/react/pages/page-account-settings.scss'
import InputPasswordToggle from '@components/input-password-toggle'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { auth, db, storage } from '../../../configs/firebaseConfig'
import CryptoJS from "crypto-js"
import Config from '@src/configs/config.json'
import { v4 as uuidv4 } from 'uuid'
import { ref, uploadBytes } from 'firebase/storage'
import { Link, useHistory } from 'react-router-dom'
import AsyncSelect from 'react-select/async'
import Currencies from '../../../../src/configs/currencies.json'

const Profile = () => {

    const [images, setImages] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [isUploaded, setIsUploaded] = useState(null)
    const [restaurantData, setRestaurantData] = useState(null)
    const [isRestaurant, setIsRestaurant] = useState(false)
    const [selectedCurrency, setSelectedCurrency] = useState(null)

    const history = useHistory()

    const { register, control, watch, handleSubmit, setValue, formState: { errors }, reset } = useForm()

    const getRestaurant = async () => {
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
                const restaurantData = docSnap.data()

                setRestaurantData(restaurantData)
                console.log("res data:", restaurantData)

                setIsRestaurant(restaurantData.isRestaurant === true)

                // Prefill input fields
                setValue('name', restaurantData.name || '')
                setValue('contactName', restaurantData.contactName || '')
                setValue('contactNumber', restaurantData.contactNumber || '')
                setValue('contactEmail', restaurantData.email || '')
                setValue('address', restaurantData.address || '')
                // setValue('gstNumber', restaurantData.gstNumber || '')
                setValue('description', restaurantData.description || '')
                setValue('taxName', restaurantData.taxName || '')
                setValue('taxValue', restaurantData.taxValue || '')

                if (!isUploaded) {
                    setImages(restaurantData.logo || '')
                }
                if (restaurantData.currency && typeof restaurantData.currency === "object") {
                    const selectedCurrencyOption = {
                        label: `${restaurantData.currency.name} (${restaurantData.currency.symbol})`,
                        value: restaurantData.currency.value,
                        symbol: restaurantData.currency.symbol
                    }

                    setSelectedCurrency(selectedCurrencyOption)
                    setValue("currency", {
                        name: restaurantData.currency.name,
                        symbol: restaurantData.currency.symbol,
                        value: restaurantData.currency.value
                    })
                } else {
                    setSelectedCurrency(null)
                    setValue("currency", null)
                }
            } else {
                OpenNotification('error', 'Error', 'No restaurant found with the provided ID!')
            }
        } catch (error) {
            console.error('Error fetching restaurant:', error)
            OpenNotification('error', 'Error', error.message || 'Failed to fetch restaurant data.')
        }
    }

    useEffect(() => {
        getRestaurant()
    }, [])

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

        try {
            // Retrieve the restaurant ID from localStorage
            const restaurantId = localStorage.getItem('token')

            if (!restaurantId) {
                console.error('Token not found. Redirecting to login.')
                OpenNotification('error', 'Error', 'Please login again!')
                history.push('/login')
                setSubmitting(false)
                return
            }

            // Validate phone number
            if (obj.contactNumber && !validatePhoneNumber(obj.contactNumber)) {
                OpenNotification('error', 'Oops!', 'Please enter a valid phone number')
                setSubmitting(false)
                return false
            }

            // Validate GST number
            // if (obj.gstNumber && !validateGST(obj.gstNumber)) {
            //     OpenNotification('error', 'Oops!', 'Please enter a valid GST number')
            //     setSubmitting(false)
            //     return false
            // }

            // Prepare the parameters for the update
            const params = {
                name: obj.name,
                // contactName: obj.contactName,
                contactNumber: obj.contactNumber,
                address: obj.address,
                // gstNumber: obj.gstNumber,
                description: obj.description
                // taxName: obj.taxName || "",
                // taxValue: obj.taxValue || 0

            }

            if (isUploaded) {
                params.logo = isUploaded
            }

            params.currency = {
                name: obj.currency?.label ? obj.currency.label.split(' (')[0] : obj.currency?.name || "",
                symbol: obj.currency.symbol,
                value: obj.currency.value
            }

            // Reference the specific document by its ID
            const docRef = doc(db, 'restaurants', restaurantId)

            // Update the document
            await updateDoc(docRef, params)

            OpenNotification('success', 'Success', 'Restaurant details updated successfully!')
            reset() // Reset the form after successful submission
            setImages(null)
            setIsUploaded(null)
        } catch (error) {
            console.error('Error updating restaurant details:', error)
            OpenNotification('error', 'Oops!', 'Failed to update restaurant details!')
        } finally {
            setSubmitting(false)
        }
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

    const handleMultipleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (file) {
            try {
                const reader = new FileReader()
                const image = new Image()

                reader.onload = (event) => {
                    const result = event.target.result

                    if (!result.startsWith('data:image/')) {
                        OpenNotification('error', 'Error', 'Selected file is not a valid image.')
                        return
                    }

                    image.src = result

                    image.onload = async () => {
                        const { width, height } = image
                        console.log('Image Object:', image)
                        console.log('Detected Dimensions:', width, height)

                        if (width !== 512 || height !== 80) {
                            OpenNotification('error', 'OOPS!', 'Image must be 512px width and 80px height.')
                            return
                        }

                        // Proceed with upload
                        const fileExtension = file.name.split('.').pop()
                        const uniqueFileName = `${uuidv4()}.${fileExtension}`
                        const storageRef = ref(storage, `images/${uniqueFileName}`)

                        await uploadBytes(storageRef, file)
                        console.log('File uploaded successfully')
                        setIsUploaded(uniqueFileName)
                        setImages(uniqueFileName)
                    }

                    image.onerror = () => {
                        OpenNotification('error', 'Error', 'Invalid image file.')
                    }
                }

                reader.onerror = () => {
                    OpenNotification('error', 'Error', 'Failed to read the file.')
                }

                reader.readAsDataURL(file)
            } catch (error) {
                console.error('Error validating or uploading file:', error)
                OpenNotification('error', 'Error', 'An error occurred while uploading the file.')
            }
        }
    }

    return (
        <Fragment>

            <Row >
                <Col md="6">
                    <Card className="p-2">
                        <div style={{ fontSize: '16px' }}>
                            {isRestaurant ? 'Restaurant Code' : 'Partner Code'}:{' '}
                            <strong>{restaurantData?.restaurantCode || 'Not Available'}</strong>
                        </div>
                    </Card>
                </Col>

                <Col md="6">
                    <Card className="p-2">
                        <div style={{ fontSize: '16px' }}>
                            Wallet Balance:{' '}
                            <strong>
                                {restaurantData?.walletBalance !== undefined ? `${restaurantData?.currency?.symbol || ''} ${Number(restaurantData.walletBalance).toFixed(2)}` : 'Not Available'}
                            </strong>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card>
                <CardBody>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row>
                            <Col md="4">
                                <FormGroup>
                                    <Label for='name'>
                                        {isRestaurant ? 'Restaurant Name' : 'Partner Name'} <span className='text-danger'>*</span>
                                    </Label>
                                    <Input
                                        id='name'
                                        name='name'
                                        innerRef={register({ required: true })}
                                        placeholder={`Enter ${isRestaurant ? 'Restaurant' : 'Partner'} Name`}
                                        className={classnames({ 'is-invalid': errors.name })}
                                    />
                                </FormGroup>
                            </Col>

                            {/* {isRestaurant && (
                                <Col md="4">
                                    <FormGroup>
                                        <Label for='contactName'>Contact Person Name <span className='text-danger'>*</span></Label>
                                        <Input
                                            id='contactName'
                                            name='contactName'
                                            innerRef={register({ required: true })}
                                            placeholder='Enter Contact Name'
                                            className={classnames({
                                                'is-invalid': errors.contactName
                                            })}
                                        />
                                    </FormGroup>
                                </Col>
                            )} */}

                            <Col md="4">
                                <FormGroup>
                                    <Label for='contactNumber'>Contact Number<span className='text-danger'>*</span></Label>
                                    <Input
                                        id='contactNumber'
                                        name='contactNumber'
                                        innerRef={register({ required: true })}
                                        placeholder='Enter Contact Number'
                                        className={classnames({
                                            'is-invalid': errors.contactNumber
                                        })}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md="4">
                                <FormGroup >
                                    <Label className='form-label' for='email'>
                                        Contact Email <span className='text-danger'>*</span>
                                    </Label>
                                    <Input
                                        type='email'
                                        id='contactEmail'
                                        name='contactEmail'
                                        innerRef={register({ required: true })}
                                        placeholder='Enter Contact Email'
                                        className={classnames({
                                            'is-invalid': errors.contactEmail
                                        })}
                                    // readOnly
                                    />
                                </FormGroup>
                            </Col>

                            <Col md='4'>
                                <FormGroup>
                                    <Label for='address'>Address</Label>
                                    <Input
                                        id='address'
                                        name='address'
                                        innerRef={register({ required: false })}
                                        placeholder='Enter Address'
                                        className={classnames({
                                            'is-invalid': errors.address
                                        })}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md='4'>
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
                            </Col>
                            <Col md='12'>
                                <FormGroup>
                                    <Label for='description'>
                                        {isRestaurant ? 'About Restaurant' : 'About Partner'}
                                    </Label>

                                    <Input
                                        type="textarea"
                                        id='description'
                                        name='description'
                                        rows="5"
                                        innerRef={register({ required: false })}
                                        placeholder={isRestaurant ? 'Enter About Restaurant' : 'Enter About Partner'}
                                        className={classnames({
                                            'is-invalid': errors.description
                                        })}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md='4'>
                                <FormGroup>
                                    <Label for="images">
                                        {isRestaurant ? 'Restaurant Logo' : 'Partner Logo'}
                                    </Label>
                                    <Input
                                        id="images"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleMultipleImageUpload}
                                    />
                                    <div className="image-preview mt-1">
                                        {images &&
                                            <img
                                                src={`${Config.MEDIA_URL}${images}?alt=media`}
                                                alt={`Preview`}
                                                style={{ width: '100px', marginRight: '10px', marginTop: '1rem' }}
                                            />
                                        }
                                    </div>
                                </FormGroup>
                            </Col>

                            <Col md='12'>
                                <Button className='mt-1' disabled={submitting} color='primary'>
                                    {(submitting) ? <> <Spinner color='white' size='sm' /> </> : 'Save Changes'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </CardBody>
            </Card>
        </Fragment >
    )
}

export default Profile
