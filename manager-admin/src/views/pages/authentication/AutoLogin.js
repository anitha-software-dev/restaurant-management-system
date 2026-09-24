import { useState, useContext, useEffect } from 'react'
import { Card, CardBody, Spinner, Row, Col } from 'reactstrap'
import '@styles/base/pages/page-auth.scss'
import { OpenNotification } from '@src/views/components/Helper'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { handleLogin } from '@store/actions/auth'
import { AbilityContext } from '@src/utility/context/Can'

// Firebase
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../../configs/firebaseConfig'

const LoginV1 = () => {
    const ability = useContext(AbilityContext)
    const dispatch = useDispatch()
    const history = useHistory()
    const [buttonDisable, setButtonDisable] = useState(false)

    const pathSegments = window.location.pathname.split('/')
    const token = pathSegments[pathSegments.length - 1]

    const processRequest = async () => {
        console.log('token', token)
        if (!token) {
            OpenNotification('error', 'Oops!', 'Invalid SSO token!')
            history.push('/login')
            return
        }

        setButtonDisable(true)

        // return false
        try {
            const collectionRef = collection(db, 'restaurants')
            const q = query(collectionRef, where('sso_token', '==', token))
            const querySnapshot = await getDocs(q)

            setButtonDisable(false)

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0]
                const user = doc.data()
                delete user.password // optional: remove sensitive info

                const userData = {
                    user,
                    token: doc.id
                }

                dispatch(handleLogin(userData))

                ability.update([
                    {
                        action: 'manage',
                        subject: 'all'
                    }
                ])
                history.push("/orders")

                OpenNotification('success', 'Welcome!', 'You have successfully logged in.')
            } else {
                OpenNotification('error', 'Oops!', 'Invalid or expired SSO token!')
                history.push('/login')
            }
        } catch (error) {
            console.error(error)
            setButtonDisable(false)
            OpenNotification('error', 'Oops!', 'Something went wrong!')
        }
    }

    useEffect(() => {
        processRequest()
    }, [])

    return (
        <div className='auth-wrapper auth-v2'>
            <Row className='auth-inner m-0'>
                <Col className='d-flex align-items-center px-5 py-5' lg='12' sm='12'>
                    <Card className='w-100 h-100 text-center'>
                        <CardBody className='d-flex flex-column align-items-center justify-content-center'>
                            
                            <h4 className='mt-3 mb-3'>Please wait while we are processing your request...</h4>
                            <Spinner />
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default LoginV1
