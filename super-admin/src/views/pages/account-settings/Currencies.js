import { Fragment, useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import AsyncSelect from 'react-select/async'
import { Form, FormGroup, Row, Col, Button, Label, Input, Card, CardHeader, CardBody, Spinner } from 'reactstrap'
import { OpenNotification } from '@src/views/components/Helper'
import '@styles/react/pages/page-account-settings.scss'
import { addDoc, collection, doc, getDocs, query, Timestamp, updateDoc } from 'firebase/firestore'
import { useHistory } from 'react-router-dom'
import { db } from '../../../configs/firebaseConfig'
import Currencies from '../../../configs/currencies.json'

const AccountSettings = () => {
    const [configData, setConfigData] = useState(null)
    const [buttonDisable, setButtonDisable] = useState(false)
    const [selectedCurrency, setSelectedCurrency] = useState(null)
    const [currencySymbol, setCurrencySymbol] = useState('')
    const history = useHistory()
    const { control, handleSubmit, setValue } = useForm()

    const getConfigurationData = async () => {
        try {
            const collectionRef = collection(db, 'configurations')
            const querySnapshot = await getDocs(query(collectionRef))

            let currencyData = {}

            querySnapshot.forEach(docSnapshot => {
                const data = docSnapshot.data()
                const id = docSnapshot.id

                if (data.currency) {
                    const matchedCurrency = Currencies.find(currency => currency.name === data.currency.name) || null

                    currencyData = {
                        id,
                        name: data.currency.name || '',
                        symbol: data.currency.symbol || '',
                        value: data.currency.value || ''
                    }

                    setValue('currencyName', data.currency.name || '')
                    setCurrencySymbol(matchedCurrency?.symbol || '')

                    setSelectedCurrency(matchedCurrency ? {
                        label: matchedCurrency.name,
                        value: matchedCurrency.code,
                        symbol: matchedCurrency.symbol
                    } : null)
                }
            })

            if (currencyData) {
                // console.log("currency data:", currencyData)
                setConfigData({ currency: currencyData })
            }
        } catch (error) {
            console.error('Error fetching configuration data:', error)
            setConfigData(null)
        }
    }

    useEffect(() => {
        getConfigurationData()
    }, [])


    const loadCurrencyOptions = (inputValue, callback) => {
        const filteredOptions = Currencies.filter(currency => currency.name.toLowerCase().includes(inputValue.toLowerCase()))
            .map(currency => ({ label: currency.name, value: currency.code, symbol: currency.symbol }))
        callback(filteredOptions)
    }

    const handleCurrencyChange = (selectedOption) => {
        if (selectedOption) {
            setSelectedCurrency(selectedOption)
            setValue('currencyName', selectedOption.label)
            setCurrencySymbol(selectedOption.symbol)
        }
    }

    const onSubmit = async (data) => {
        try {
            setButtonDisable(true)
            const newCurrencyConfig = {
                name: data.currencyName || '',
                symbol: selectedCurrency?.symbol || '',
                value: selectedCurrency?.value || '',
                updatedAt: Timestamp.now()
            }
            // console.log("newCurrencyConfig:", newCurrencyConfig)
            if (configData?.currency?.id) {
                await updateDoc(doc(db, 'configurations', configData.currency.id), { currency: newCurrencyConfig })
                OpenNotification('success', 'Success!', 'Currency details updated successfully')
            } else {
              
                await addDoc(collection(db, 'configurations'), { currency: newCurrencyConfig })
                OpenNotification('success', 'Success!', 'Currency details added successfully')
            }

            await getConfigurationData()
        } catch (error) {
            console.error('Error updating Currency details:', error)
            OpenNotification('error', 'Oops!', 'Failed to update Currency details')
        } finally {
            setButtonDisable(false)
        }
    }

    return (
        <Fragment>
            <Card style={{ minHeight: '360px' }}>
                <CardHeader tag='h4'>Manage Currencies</CardHeader>
                <CardBody>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row>
                            <Col sm='12'>
                                <FormGroup>
                                    <Label tag={'h4'} className='form-label mr-1 my-1' for='currencyName'>
                                        Currency Name
                                    </Label>
                                    <Controller
                                        name='currencyName'
                                        control={control}
                                        render={({ field }) => (
                                            <AsyncSelect
                                                {...field}
                                                loadOptions={loadCurrencyOptions}
                                                defaultOptions
                                                onChange={handleCurrencyChange}
                                                value={selectedCurrency}
                                            />
                                        )}
                                    />
                                </FormGroup>
                            </Col>

                            <Col sm='12'>
                                <FormGroup>
                                    <Label tag={'h4'} className='form-label mr-1 my-1' for='currencySymbol'>
                                        Currency Symbol
                                    </Label>
                                    <Input
                                        id='currencySymbol'
                                        name='currencySymbol'
                                        type='text'
                                        readOnly
                                        value={currencySymbol}
                                    />
                                </FormGroup>
                            </Col>
                            <Col sm='12' className='mt-1'>
                                <Button.Ripple type='submit' className='mr-1' color='primary' disabled={buttonDisable}>
                                    {buttonDisable ? <Spinner size='sm' /> : 'Save Changes'}
                                </Button.Ripple>
                            </Col>
                        </Row>
                    </Form>
                </CardBody>
            </Card>
        </Fragment>
    )
}

export default AccountSettings