import { Fragment, useState, useEffect } from 'react'
import * as yup from 'yup'
import classnames from 'classnames'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { Form, FormGroup, Row, Col, Button, Label, Input, Card, CardBody, CardHeader, Spinner } from 'reactstrap'
import { Service } from '@src/services/Service'
import Breadcrumbs from '@components/breadcrumbs'
import { OpenNotification } from '@src/views/components/Helper'
import '@styles/react/pages/page-account-settings.scss'
import { addDoc, collection, doc, getDocs, orderBy, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore'
import { Link, useHistory } from 'react-router-dom'
import { db } from '../../../configs/firebaseConfig'

const AccountSettings = () => {

  const [gst, setGst] = useState('')
  const [buttonDisable, setButtonDisable] = useState(false)
  const history = useHistory()


  const { register, errors, handleSubmit, reset, setValue } = useForm()

  const getGST = async () => {
    try {
      const collectionRef = collection(db, 'configurations')
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

      setGst(docs[0])
      setValue('gst', docs[0].gst)
    } catch (error) {
      console.error('Error fetching GST:', error)
    }
  }

  useEffect(() => {
    getGST()
  }, [])

  // const onSubmit2 = async (data) => {
  //   try {
  //     setButtonDisable(true)
  //     console.log('Starting to update GST...')

  //     const newGst = {
  //       gst: data.gst,
  //       updatedAt: Timestamp.now()
  //     }

  //     const token = localStorage.getItem('token')
  //     if (!token) {
  //       console.error('Token not found. Redirecting to login.')
  //       OpenNotification('error', 'Error', 'Please login again!')
  //       history.push('/login')
  //       return
  //     }
  //     newGst.restaurantId = token
  //     console.log('Token found:', token)

  //     const collectionRef = collection(db, 'configurations')
  //     const docRef = await addDoc(collectionRef, newGst)

  //     console.log('GST added successfully with ID:', docRef.id)

  //     await getGST()
  //     console.log('GST fetched successfully.')

  //     setButtonDisable(false)
  //     OpenNotification('success', 'Success!', 'GST updated successfully')
  //   } catch (error) {
  //     console.error('Error updating GST:', error.message, error)
  //     setButtonDisable(false)
  //     OpenNotification('error', 'Oops!', 'Failed to update GST')
  //   }
  // }

  const onSubmit = async (data) => {
    try {
      setButtonDisable(true)
      const newGst = {
        gst: data.gst,
        updatedAt: Timestamp.now()
      }

      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token not found. Redirecting to login.')
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
        return
      }

      if (!gst || !gst.id) {
        newGst.restaurantId = token
        const collectionRef = collection(db, 'configurations')
        const docRef = await addDoc(collectionRef, newGst)
        OpenNotification('success', 'Success!', 'GST added successfully')
      } else {
        const gstRef = doc(db, 'configurations', gst.id)

        await updateDoc(gstRef, newGst)
        OpenNotification('success', 'Success!', 'GST updated successfully')
      }

      await getGST()
      setButtonDisable(false)

    } catch (error) {
      console.error('Error updating GST:', error)
      setButtonDisable(false)
      OpenNotification('error', 'Oops!', 'Failed to update GST')
    }
  }

  return (
    <Fragment>
      <Card style={{ minHeight: "360px" }}>
        <CardHeader tag='h4'>Set GST</CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col sm='12'>
                <FormGroup>
                  <Input
                    id='gst'
                    name='gst'
                    type='number'
                    min='0'
                    innerRef={register({
                      required: true,
                      validate: (value) => /^[0-9]+$/.test(value)
                    })}
                    invalid={errors.time && true}
                    placeholder='Enter GST'
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

              <Col sm='12' className="mt-1">
                <Button.Ripple type='submit' className='mr-1' color='primary' disabled={buttonDisable}>
                  Save Changes
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
