import { Fragment, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormGroup, Row, Col, Button, Label, Input, Card, CardHeader, CardBody, Spinner } from 'reactstrap'
import { OpenNotification } from '@src/views/components/Helper'
import '@styles/react/pages/page-account-settings.scss'
import { addDoc, collection, doc, getDocs, query, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../../configs/firebaseConfig'

const AccountSettings = () => {
    const [configData, setConfigData] = useState(null)
    const [buttonDisable, setButtonDisable] = useState(false)
    const { register, handleSubmit, setValue, formState: { errors } } = useForm()

    const getConfigData = async () => {
        try {
            const collectionRef = collection(db, 'configurations')
            const querySnapshot = await getDocs(query(collectionRef))

            let platformFeeData = {}

            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data()
                const id = docSnapshot.id

                if (data.platformFee) {
                    platformFeeData = {
                        id,
                        currency: data.platformFee.currency,
                        value: data.platformFee.value
                    }
                }
            })

            if (platformFeeData) {
                setConfigData({ platformFee: platformFeeData })
                setValue('platformCurrency', platformFeeData.currency)
                setValue('platformValue', platformFeeData.value)
            }

        } catch (error) {
            console.error('Error fetching platform fee data:', error)
        }
    }

    useEffect(() => {
        getConfigData()
    }, [])

    const onSubmit = async (data) => {
        try {
            setButtonDisable(true)

            const newPlatformFee = {
                currency: data.platformCurrency || '',
                value: data.platformValue || '',
                updatedAt: Timestamp.now()
            }

            if (configData?.platformFee?.id) {
                const feeRef = doc(db, 'configurations', configData.platformFee.id)
                await updateDoc(feeRef, { platformFee: newPlatformFee })
                OpenNotification('success', 'Success!', 'Platform fee updated successfully')
            } else {
                const collectionRef = collection(db, 'configurations')
                await addDoc(collectionRef, { platformFee: newPlatformFee })
                OpenNotification('success', 'Success!', 'Platform fee added successfully')
            }

            await getConfigData()
        } catch (error) {
            console.error('Error updating platform fee:', error)
            OpenNotification('error', 'Oops!', 'Failed to update platform fee')
        } finally {
            setButtonDisable(false)
        }
    }

    return (
        <Fragment>
            <Card style={{ minHeight: "360px" }}>
                <CardHeader tag='h4'>Manage Platform Fee</CardHeader>
                <CardBody>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row>
                            <Col sm='12'>
                                <FormGroup>
                                    <Label tag='h4' className='form-label mr-1 my-1' for='platformCurrency'>
                                        Currency
                                    </Label>
                                    <Input
                                        id='platformCurrency'
                                        name='platformCurrency'
                                        type='text'
                                        innerRef={register({ required: true })}
                                        invalid={errors.platformCurrency && true}
                                        placeholder='Enter Currency (e.g. USD, INR)'
                                    />
                                </FormGroup>
                            </Col>

                            <Col sm='12'>
                                <FormGroup>
                                    <Label tag='h4' className='form-label mr-1 my-1' for='platformValue'>
                                        Value
                                    </Label>
                                    <Input
                                        id='platformValue'
                                        name='platformValue'
                                        type='number'
                                        min='0'
                                        innerRef={register({
                                            required: true,
                                            validate: (value) => /^[0-9]+$/.test(value)
                                        })}
                                        invalid={errors.platformValue && true}
                                        placeholder='Enter Fee Value'
                                        onKeyDown={(e) => {
                                            const allowedKeys = ["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"]
                                            if (!allowedKeys.includes(e.key) && (e.key < "0" || e.key > "9")) {
                                                e.preventDefault()
                                            }
                                        }}
                                    />
                                </FormGroup>
                            </Col>

                            <Col sm='12' className='mt-1'>
                                <Button.Ripple type='submit' className='mr-1' color='primary' disabled={buttonDisable}>
                                    {buttonDisable ? <Spinner size='sm' /> : <>Save Changes</>}
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
