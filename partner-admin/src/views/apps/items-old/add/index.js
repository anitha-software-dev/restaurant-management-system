import { useState, useRef, useEffect } from 'react'
import {
    Row,
    Col,
    Card,
    CardBody,
    CardHeader,
    Form,
    FormGroup,
    Label,
    Input,
    CustomInput,
    Button,
    Spinner
} from 'reactstrap'
import { IoIosCloseCircleOutline } from "react-icons/io"
import { FaPlus } from "react-icons/fa"
import { useHistory, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { formatPhoneNumber, OpenNotification, validateRestaurant } from '@src/views/components/Helper'
import { addDoc, collection, doc, getDoc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore'
import { db, storage } from '../../../../configs/firebaseConfig'
import { useDispatch } from 'react-redux'
import Breadcrumbs from '@components/breadcrumbs'
import { v4 as uuidv4 } from 'uuid'
import { ref, uploadBytes } from 'firebase/storage'
import Config from '@src/configs/config.json'
import Flatpickr from "react-flatpickr"
import "flatpickr/dist/themes/material_blue.css"
import { Trash, Trash2 } from 'react-feather'
import AsyncSelect from "react-select/async"

const AddItemPage = () => {

    const [type, setType] = useState('')
    const [menusList, setMenusList] = useState([])
    const [taxesList, setTaxesList] = useState()
    const [selectedTaxes, setSelectedTaxes] = useState([])
    const [selectedVegType, setSelectedVegType] = useState('')
    const [vegType, setVegType] = useState(['Veg', 'Non Veg', 'Other'])
    const [images, setImages] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [editInfo, setEditInfo] = useState(null)
    const [currencySymbol, setCurrencySymbol] = useState('')
    const [currency, setCurrency] = useState('')
    const [loading, setLoading] = useState(false)
    const [chefsList, setChefsList] = useState([])
    const [selectedChef, setSelectedChef] = useState([])
    const [portions, setPortions] = useState({
        full: true,
        half: false,
        quarter: false
    })
    const [availability, setAvailability] = useState([{ day: "", start: "", end: "" }])


    const fileInputRef = useRef(null)
    const history = useHistory()
    const dispatch = useDispatch()
    const { id } = useParams()

    const { register, control, setValue, watch, handleSubmit, formState: { errors }, reset } = useForm()

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

    const getItemDetails = async () => {
        try {
            if (!id) return // no edit mode

            const itemRef = doc(db, 'items', id)
            const itemSnap = await getDoc(itemRef)

            if (itemSnap.exists()) {
                const data = itemSnap.data()
                setEditInfo({ id: itemSnap.id, ...data })

                // 🔹 Prefill form fields using react-hook-form setValue
                setValue('name', data.name || '')
                setValue('description', data.description || '')
                setValue('time', data.estimated_time || '')
                setValue('vegtype', data.veg_type || '')
                setValue('type', data.type || '')

                setValue('status', data.status)
                if (data.type) setType(data.type)

                // 🔹 Portions
                setPortions({
                    full: data.is_full_portion || false,
                    half: data.is_half_portion || false,
                    quarter: data.is_quarter_portion || false
                })
                setValue('fullPortion', data.is_full_portion || false)
                setValue('halfPortion', data.is_half_portion || false)
                setValue('quarterPortion', data.is_quarter_portion || false)

                // 🔹 Prices
                if (data.full_price) setValue('fullPrice', data.full_price)
                if (data.half_price) setValue('halfPrice', data.half_price)
                if (data.quarter_price) setValue('quarterPrice', data.quarter_price)

                // 🔹 Taxes
                if (data.taxes) setSelectedTaxes(data.taxes)
                if (data.chefId) setSelectedChef(data.chefId)

                // 🔹 Veg type
                setSelectedVegType(data.veg_type || '')

                // 🔹 Images
                if (data.images) setImages(data.images)

                // 🔹 Availability
                if (data.availability) {
                    const parsedAvailability = data.availability.map((slot) => {
                        const parseTime = (timeStr) => {
                            if (!timeStr) return ""
                            const [hours, minutes] = timeStr.split(":")
                            const date = new Date()
                            date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
                            return date
                        }

                        return {
                            day: slot.day,
                            start: parseTime(slot.start),
                            end: parseTime(slot.end)
                        }
                    })

                    setAvailability(parsedAvailability)
                } else {
                    setAvailability([{ day: "Monday", start: "", end: "" }])
                }

            }
        } catch (error) {
            console.error('Error fetching item details:', error)
        }
    }

    useEffect(() => {
        getMenusList()
        getTaxesList()
        getChefsList()
        getItemDetails()
    }, [])
    useEffect(() => {
        if (id) {
            getItemDetails()
        }
    }, [id])

    const handleCheckboxChange = (portion) => {
        setPortions((prevState) => ({
            ...prevState,
            [portion]: !prevState[portion]
        }))
        setValue(portion, !portions[portion])
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

        for (let i = 0; i < availability.length; i++) {
            const slot = availability[i]

            if (slot.day && (!slot.start || !slot.end)) {
                OpenNotification('error', 'OOPS!', `Please select both start and end time for ${slot.day} (row ${i + 1}).`
                )
                setSubmitting(false)
                return
            }
        }

        const formattedAvailability = availability.map((item) => {
            const formatTime = (date) => {
                const validDate = new Date(date)
                // Check if it's a valid date object before formatting
                if (validDate instanceof Date && !isNaN(validDate)) {
                    return validDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                }
                return ""
            }

            return {
                day: item.day,
                start: formatTime(item.start),
                end: formatTime(item.end)
            }
        })

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
                availability: formattedAvailability,
                chefId: selectedChef,
                images
            }

            // return false
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
                    history.push('/items')
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
                    return
                }

                newItem.status = 1
                newItem.createdAt = Timestamp.now()

                const docRef = await addDoc(collection(db, 'items'), newItem)
                OpenNotification('success', 'Success!', 'Item added successfully')
                history.push('/items')
            }

            setType('')
            setEditInfo(null)
        } catch (error) {
            console.error('Error adding/updating Item:', error)
            OpenNotification('error', 'Error', 'Something went wrong.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSelectButtonClick = () => {
        fileInputRef.current.click()
    }

    const handleRemoveImage = (index) => {
        setImages((prevImages) => prevImages.filter((_, i) => i !== index))
    }

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

    const handleAvailabilityChange = (index, field, value) => {
        const updated = [...availability]
        updated[index][field] = value
        setAvailability(updated)
        setValue("availability", updated) // keep RHF in sync
    }

    const handleAddAvailabilityRow = () => {
        setAvailability([...availability, { day: "Monday", start: "", end: "" }])
    }

    const handleRemoveAvailabilityRow = (index) => {
        const updated = availability.filter((_, i) => i !== index)
        setAvailability(updated)
        setValue("availability", updated)
    }

    return (
        <>
            <Breadcrumbs
                breadCrumbTitle={`${id ? "Edit" : "Add"} Item Details`}
                breadCrumbParent="Item"
                breadCrumbActive="Details"
            />

            <Form onSubmit={handleSubmit(AddItem)}>
                <Row>
                    {/* ---------------- ITEM INFORMATION ---------------- */}
                    <Col md={12}>
                        <Card>
                            <CardHeader className="mx-1 my-1 p-1 bg-light">
                                <h5 className="mb-0">Item Informations</h5>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    {/* Type of Item */}
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label for="type">
                                                Type of Item <span className="text-danger">*</span>
                                            </Label>
                                            <CustomInput
                                                className="form-control"
                                                type="select"
                                                id="type"
                                                name="type"
                                                value={type}
                                                onChange={(e) => {
                                                    setType(e.target.value)
                                                    setValue("type", e.target.value)
                                                }}
                                                innerRef={register({ required: true })}
                                                invalid={errors.type && true}
                                            >
                                                <option value="">Select</option>
                                                {menusList &&
                                                    menusList.length > 0 &&
                                                    menusList.map((menu) => (
                                                        <option key={menu.id} value={menu.id}>
                                                            {menu.name}
                                                        </option>
                                                    ))}
                                            </CustomInput>
                                        </FormGroup>
                                    </Col>

                                    {/* Name */}
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label for="name">
                                                Name <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                innerRef={register({ required: true })}
                                                invalid={errors.name && true}
                                                placeholder="Enter Name"
                                            />
                                        </FormGroup>
                                    </Col>

                                    {/* Description */}
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label for="description">
                                                Description <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                type="textarea"
                                                id="description"
                                                name="description"
                                                innerRef={register({ required: true })}
                                                invalid={errors.description && true}
                                                placeholder="Enter Description"
                                                rows="2"
                                            />
                                        </FormGroup>
                                    </Col>

                                    {/* Preparation Time */}
                                    <Col md={3}>
                                        <FormGroup>
                                            <Label className="form-label" for="time">
                                                Estimated Preparation Time (In Mins){" "}
                                                {/* <span className="text-danger">*</span> */}
                                            </Label>
                                            <Input
                                                id="time"
                                                name="time"
                                                type="number"
                                                min="0"
                                                innerRef={register({ required: false })}
                                                invalid={errors.time && true}
                                                placeholder="Enter Minutes"
                                            />
                                        </FormGroup>
                                    </Col>

                                    {/* Veg/Non-Veg */}
                                    <Col md={3}>
                                        <FormGroup>
                                            <Label for="vegtype">
                                                Type (Veg/Non Veg) <span className="text-danger">*</span>
                                            </Label>
                                            <CustomInput
                                                className="form-control"
                                                type="select"
                                                id="vegtype"
                                                name="vegtype"
                                                value={selectedVegType}
                                                onChange={(e) => {
                                                    setSelectedVegType(e.target.value)
                                                    setValue("vegtype", e.target.value)
                                                }}
                                                innerRef={register({ required: true })}
                                                invalid={errors.vegtype && true}
                                            >
                                                <option value="">Select</option>
                                                {vegType &&
                                                    vegType.length > 0 &&
                                                    vegType.map((type) => (
                                                        <option key={type} value={type}>
                                                            {type}
                                                        </option>
                                                    ))}
                                            </CustomInput>
                                        </FormGroup>
                                    </Col>

                                    {/* Availability Switch (Edit only) */}
                                    <Col md={3} className={!id ? "d-none" : "d-flex align-items-center"}>
                                        <FormGroup
                                            className={!id ? "d-none" : "d-flex align-items-center"}
                                        >
                                            <Label className="form-label mr-1" for="status">
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
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>

                    {/* ---------------- PRICE CONFIGURATION ---------------- */}
                    <Col md={12}>
                        <Card>
                            <CardHeader className="mx-1 my-1 p-1 bg-light">
                                <h5 className="mb-0">Price Configuration</h5>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    {/* Portion Options */}
                                    <Col md={12} className="mt-0 mb-1">
                                        <Label className="mb-1">Portion Option(s)</Label>
                                        <FormGroup className="d-flex">
                                            {["full", "half", "quarter"].map((portion) => (
                                                <CustomInput
                                                    style={{ accentColor: "#f9791d", cursor: "pointer" }}
                                                    className="mr-1"
                                                    key={portion}
                                                    id={`${portion}Portion`}
                                                    name={`${portion}Portion`}
                                                    innerRef={register}
                                                    label={
                                                        portion.charAt(0).toUpperCase() + portion.slice(1)
                                                    }
                                                    type="checkbox"
                                                    checked={portions[portion]}
                                                    onChange={() => handleCheckboxChange(portion)}
                                                />
                                            ))}
                                        </FormGroup>
                                    </Col>

                                    {/* Conditional Portion Prices */}
                                    {portions.full && (
                                        <Col md={3}>
                                            <FormGroup>
                                                <Label for="fullPrice">
                                                    Full Price ({currency || currencySymbol}){" "}
                                                    <span className="text-danger">*</span>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    id="fullPrice"
                                                    name="fullPrice"
                                                    placeholder="Enter Full Price"
                                                    min="0"
                                                    step="0.01"
                                                    innerRef={register({ required: true })}
                                                    invalid={errors.fullPrice && true}
                                                />
                                            </FormGroup>
                                        </Col>
                                    )}
                                    {portions.half && (
                                        <Col md={3}>
                                            <FormGroup>
                                                <Label for="halfPrice">
                                                    Half Price ({currency || currencySymbol}){" "}
                                                    <span className="text-danger">*</span>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    id="halfPrice"
                                                    name="halfPrice"
                                                    placeholder="Enter Half Price"
                                                    min="0"
                                                    step="0.01"
                                                    innerRef={register({ required: true })}
                                                    invalid={errors.halfPrice && true}
                                                />
                                            </FormGroup>
                                        </Col>
                                    )}
                                    {portions.quarter && (
                                        <Col md={3}>
                                            <FormGroup>
                                                <Label for="quarterPrice">
                                                    Quarter Price ({currency || currencySymbol}){" "}
                                                    <span className="text-danger">*</span>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    id="quarterPrice"
                                                    name="quarterPrice"
                                                    placeholder="Enter Quarter Price"
                                                    min="0"
                                                    step="0.01"
                                                    innerRef={register({ required: true })}
                                                    invalid={errors.quarterPrice && true}
                                                />
                                            </FormGroup>
                                        </Col>
                                    )}
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>

                    {/* ---------------- TAXES CONFIGURATION ---------------- */}
                    <Col md={12}>
                        <Card>
                            <CardHeader className="mx-1 my-1 p-1 bg-light">
                                <h5 className="mb-0">Taxes Configuration</h5>
                            </CardHeader>
                            <CardBody>
                                <FormGroup className="d-flex flex-wrap">
                                    {taxesList && taxesList.length > 0 ? (
                                        taxesList.map((tax) => {
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
                                                        const updated = isChecked ? selectedTaxes.filter((id) => id !== tax.id) : [...selectedTaxes, tax.id]
                                                        setSelectedTaxes(updated)
                                                        setValue("selectedTaxes", updated)
                                                    }}
                                                    className="mr-2"
                                                    style={{
                                                        accentColor: "#f9791d",
                                                        cursor: "pointer",
                                                        marginBottom: "5px"
                                                    }}
                                                />
                                            )
                                        })
                                    ) : (
                                        <p className="text-muted">No taxes found</p>
                                    )}
                                </FormGroup>
                            </CardBody>
                        </Card>
                    </Col>

                    {/* ---------------- ITEM AVAILABILITY ---------------- */}
                    <Col md={12}>
                        <Card>
                            <CardHeader className="mx-1 my-1 p-1 bg-light">
                                <h5 className="mb-0">Item Availability</h5>
                            </CardHeader>
                            <CardBody>
                                {availability.map((slot, index) => (
                                    <Row key={index} className="align-items-center mb-0">
                                        {/* Day Dropdown */}
                                        <Col md={3}>
                                            <FormGroup className="d-flex align-items-center gap-2">
                                                <Label className="form-label d-block mr-1">Day: </Label>
                                                <CustomInput
                                                    type="select"
                                                    id={`day_${index}`}
                                                    name={`day_${index}`}
                                                    value={slot.day}
                                                    onChange={(e) => handleAvailabilityChange(index, "day", e.target.value)
                                                    }
                                                >
                                                    <option value={''}>
                                                        Select
                                                    </option>
                                                    {[
                                                        "All",
                                                        "Monday",
                                                        "Tuesday",
                                                        "Wednesday",
                                                        "Thursday",
                                                        "Friday",
                                                        "Saturday",
                                                        "Sunday"
                                                    ].map((day) => (<option key={day} value={day}>
                                                        {day}
                                                    </option>
                                                    ))}
                                                </CustomInput>
                                            </FormGroup>
                                        </Col>

                                        {/* From Time */}
                                        <Col md={3}>
                                            <FormGroup className="d-flex align-items-center gap-2">
                                                <Label className="form-label d-block mr-1">Start: </Label>
                                                <Flatpickr
                                                    value={slot.start}
                                                    placeholder="Enter Start Time"
                                                    options={{
                                                        enableTime: true,
                                                        noCalendar: true,
                                                        dateFormat: "H:i"
                                                    }}
                                                    className="form-control"
                                                    onChange={(date) => handleAvailabilityChange(index, "start", date[0])
                                                    }
                                                />
                                            </FormGroup>
                                        </Col>

                                        {/* To Time */}
                                        <Col md={3}>
                                            <FormGroup className="d-flex align-items-center gap-2">
                                                <Label className="form-label d-block mr-1">End: </Label>
                                                <Flatpickr
                                                    value={slot.end}
                                                    placeholder="Enter End Time"
                                                    options={{
                                                        enableTime: true,
                                                        noCalendar: true,
                                                        dateFormat: "H:i"
                                                    }}
                                                    className="form-control"
                                                    onChange={(date) => handleAvailabilityChange(index, "end", date[0])
                                                    }
                                                />
                                            </FormGroup>
                                        </Col>

                                        {/* Remove Button */}
                                        <Col md={2} className="d-flex align-items-center mb-1">
                                            {availability.length > 1 && (
                                                <Button.Ripple
                                                    outline
                                                    color="danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveAvailabilityRow(index)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button.Ripple>
                                            )}
                                        </Col>
                                    </Row>
                                ))}

                                {/* Add More Row */}
                                <Button
                                    color="white"
                                    className="p-0 mt-1 d-flex align-items-center"
                                    onClick={handleAddAvailabilityRow}
                                >
                                    <span style={{ color: "blue" }}>
                                        <FaPlus size={12} color="primary" /> Add More
                                    </span>
                                </Button>
                            </CardBody>
                        </Card>
                    </Col>

                    {/* ---------------- ASSIGN CHEF ---------------- */}
                    <Col md={12}>
                        <Card>
                            <CardHeader className="mx-1 my-1 p-1 bg-light">
                                <h5 className="mb-0">Assign Chef</h5>
                            </CardHeader>
                            <CardBody>
                                <Row>

                                    <Col md={5}>
                                        <FormGroup className="d-flex align-items-center">
                                            <Label
                                                for="chef"
                                                className="form-label mb-0 mr-1"
                                                style={{ minWidth: "40px" }}
                                            >
                                                Chef:
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
                                                    .filter(chef => selectedChef.includes(chef.id))
                                                    .map(chef => ({ value: chef.id, label: chef.name }))
                                                }
                                                onChange={selected => {
                                                    const ids = selected ? selected.map(item => item.value) : []
                                                    setSelectedChef(ids)
                                                    setValue("chef", ids)
                                                }}
                                                classNamePrefix="react-select"
                                                className="w-100"
                                            />

                                            {errors.chef && (
                                                <div className="invalid-feedback d-block">Chef is required</div>
                                            )}
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>

                    {/* ---------------- ITEM IMAGES ---------------- */}
                    <Col md={12} className="mb-2">
                        <Card>
                            <CardHeader className="mx-1 my-1 p-1 bg-light">
                                <h5 className="mb-0">Item Images</h5>
                            </CardHeader>
                            <CardBody>
                                <FormGroup>
                                    <div className="d-flex flex-wrap">
                                        {images &&
                                            images.length > 0 &&
                                            images.map((image, index) => (
                                                <div
                                                    key={index}
                                                    className="image-preview mr-1"
                                                    style={{ position: "relative" }}
                                                >
                                                    <img
                                                        src={`${Config.MEDIA_URL}${image}?alt=media`}
                                                        alt={`Preview ${index + 1}`}
                                                        style={{
                                                            width: "100px",
                                                            marginRight: "10px",
                                                            marginTop: "10px",
                                                            borderRadius: "5px"
                                                        }}
                                                    />
                                                    <div
                                                        onClick={() => handleRemoveImage(index)}
                                                        style={{
                                                            position: "absolute",
                                                            top: 0,
                                                            right: 0,
                                                            cursor: "pointer",
                                                            background: "#fff",
                                                            borderRadius: "50%"
                                                        }}
                                                    >
                                                        <IoIosCloseCircleOutline color="red" size={20} />
                                                    </div>
                                                </div>
                                            ))}
                                        {images.length < 5 && (
                                            <div
                                                onClick={handleSelectButtonClick}
                                                style={{
                                                    border: "2px dashed #ccc",
                                                    padding: "20px",
                                                    textAlign: "center",
                                                    cursor: "pointer",
                                                    borderRadius: "5px",
                                                    width: "100px",
                                                    marginTop: "10px"
                                                }}
                                            >
                                                <FaPlus size={24} color="primary" />
                                            </div>
                                        )}
                                    </div>
                                    <Input
                                        id="images"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        style={{ display: "none" }}
                                        onChange={handleMultipleImageUpload}
                                        innerRef={fileInputRef}
                                    />
                                </FormGroup>
                            </CardBody>
                        </Card>
                    </Col>

                    {/* ---------------- ACTION BUTTONS ---------------- */}
                    <Col md={12}>
                        <div className="d-flex justify-content-start mt-1">
                            <Button disabled={submitting} color="primary" type="submit" className="mr-1">
                                {submitting ? <Spinner color="white" size="sm" /> : "Save"}
                            </Button>
                            <Button type="button" color="secondary" tag={Link} to={`/items`}>
                                Cancel
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Form>
        </>

    )
}

export default AddItemPage
