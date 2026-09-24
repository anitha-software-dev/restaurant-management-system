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

            let taxData = {}

            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data()
                const id = docSnapshot.id

                if (data.tax) {
                    taxData = { id, name: data.tax.name, value: data.tax.value }
                }
            })

            if (taxData) {
                setConfigData({ tax: taxData })
                setValue('taxName', taxData.name)
                setValue('taxValue', taxData.value)
            }

        } catch (error) {
            console.error('Error fetching tax data:', error)
        }
    }

    useEffect(() => {
        getConfigData()
    }, [])

    const onSubmit = async (data) => {
        try {
            setButtonDisable(true)

            const newTaxConfig = {
                name: data.taxName || '',
                value: data.taxValue || '',
                updatedAt: Timestamp.now()
            }

            if (configData?.tax?.id) {
                const taxRef = doc(db, 'configurations', configData.tax.id)
                await updateDoc(taxRef, { tax: newTaxConfig })
                OpenNotification('success', 'Success!', 'Tax details updated successfully')
            } else {
                const collectionRef = collection(db, 'configurations')
                await addDoc(collectionRef, { tax: newTaxConfig })
                OpenNotification('success', 'Success!', 'Tax details added successfully')
            }

            await getConfigData()
        } catch (error) {
            console.error('Error updating tax details:', error)
            OpenNotification('error', 'Oops!', 'Failed to update Tax details')
        } finally {
            setButtonDisable(false)
        }
    }

    return (
        <Fragment>
            <Card style={{ minHeight: "360px" }}>
                <CardHeader tag='h4'>Manage Tax</CardHeader>
                <CardBody>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row>
                            <Col sm='12'>
                                <FormGroup>
                                    <Label tag={'h4'} className='form-label mr-1 my-1' for='taxName'>
                                        Tax Name
                                    </Label>
                                    <Input
                                        id='taxName'
                                        name='taxName'
                                        type='text'
                                        innerRef={register({ required: true })}
                                        invalid={errors.taxName && true}
                                        placeholder='Enter Tax Name'
                                    />
                                </FormGroup>
                            </Col>

                            <Col sm='12'>
                                <FormGroup>
                                    <Label tag={'h4'} className='form-label mr-1 my-1' for='taxValue'>
                                        Tax Value
                                    </Label>
                                    <Input
                                        id='taxValue'
                                        name='taxValue'
                                        type='number'
                                        min='0'
                                        innerRef={register({
                                            required: true,
                                            validate: (value) => /^[0-9]+$/.test(value)
                                        })}
                                        invalid={errors.taxValue && true}
                                        placeholder='Enter Tax Value'
                                        onKeyDown={(e) => {
                                            const allowedKeys = ["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"]
                                            if (!allowedKeys.includes(e.key) && (e.key < "0" || e.key > "9")) {
                                                e.preventDefault()
                                            }
                                        }}
                                    />
                                </FormGroup>
                            </Col>

                            <Col sm='12' className="mt-1">
                                <Button.Ripple type='submit' className='mr-1' color='primary' disabled={buttonDisable}>
                                    {buttonDisable ? <Spinner size="sm" /> : <>Save Changes</>}
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
