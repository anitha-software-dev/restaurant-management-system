import { Fragment, useState, useRef, useEffect } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Spinner } from 'reactstrap'
import { OpenNotification } from '@src/views/components/Helper'
import { db } from '../../../configs/firebaseConfig'
import { collection, doc, getDocs, query, setDoc, Timestamp, where } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { QRCodeCanvas } from 'qrcode.react'
import { IoMdDownload } from 'react-icons/io'
import Config from '@src/configs/config.json'

const Qrcode = () => {
    const [loading, setLoading] = useState(false)
    const [qrData, setQrData] = useState(null)
    const qrRef = useRef(null)

    const fetchExistingQr = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            if (!token) {
                OpenNotification('error', 'Error', 'Please login again!')
                setLoading(false)
                return
            }

            const takeawaysRef = collection(db, 'takeaways')
            const q = query(takeawaysRef, where('restaurantId', '==', token))
            const querySnapshot = await getDocs(q)

            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data()
                setQrData(docData.qrcode)
            }
        } catch (error) {
            console.error('Error fetching QR code:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchExistingQr()
    }, [])

    // helper: generate a 16-char mixed-case alphanumeric with at least one [a-z], [A-Z], and [0-9]
    const generateQrId = (length = 16) => {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const hasAllSets = s => /[a-z]/.test(s) && /[A-Z]/.test(s) && /\d/.test(s)

        // use crypto for strong randomness (browser)
        const make = () => {
            const arr = new Uint32Array(length)
            crypto.getRandomValues(arr)
            let out = ''
            for (let i = 0; i < length; i++) {
                out += chars[arr[i] % chars.length]
            }
            return out
        }

        let candidate = make()
        // ensure it contains all required sets
        while (!hasAllSets(candidate)) candidate = make()
        return candidate
    }

    // helper: ensure uniqueness in Firestore
    const getUniqueQrId = async () => {
        const takeawaysRef = collection(db, 'takeaways')
        // small loop to avoid rare collisions
        for (let i = 0; i < 5; i++) {
            const id = generateQrId(16)
            const snap = await getDocs(query(takeawaysRef, where('qrcode', '==', id)))
            if (snap.empty) return id
        }
        throw new Error('Could not generate a unique QR id')
    }

    const handleGenerateQr = async () => {
        try {
            setLoading(true)

            const token = localStorage.getItem('token')
            if (!token) {
                OpenNotification('error', 'Error', 'Please login again!')
                setLoading(false)
                return
            }

            const newQrId = await getUniqueQrId() // <- 16-char A–Z, a–z, 0–9
            const collectionRef = collection(db, 'takeaways')
            const newDocRef = doc(collectionRef)

            const newData = {
                restaurantId: token,
                qrcode: newQrId,
                status: 1,
                createdAt: Timestamp.now()
            }

            await setDoc(newDocRef, newData)
            setQrData(newQrId)

            OpenNotification('success', 'Success!', 'QR Code generated successfully!')
        } catch (error) {
            console.error('Error generating QR:', error)
            OpenNotification('error', 'Oops!', 'Failed to generate QR code.')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateQrs = async () => {
        try {
            setLoading(true)

            const token = localStorage.getItem('token')
            if (!token) {
                OpenNotification('error', 'Error', 'Please login again!')
                setLoading(false)
                return
            }

            const newQrId = uuidv4()
            const collectionRef = collection(db, 'takeaways')
            const newDocRef = doc(collectionRef)

            const newData = {
                restaurantId: token,
                qrcode: newQrId,
                status: 1,
                createdAt: Timestamp.now()
            }

            await setDoc(newDocRef, newData)

            setQrData(newQrId)

            OpenNotification('success', 'Success!', 'QR Code generated successfully!')
        } catch (error) {
            console.error('Error generating QR:', error)
            OpenNotification('error', 'Oops!', 'Failed to generate QR code.')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = () => {
        if (!qrRef.current) return
        const canvas = qrRef.current.querySelector('canvas')
        const url = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = url
        link.download = 'qrcode.png'
        link.click()
    }

    return (
        <Fragment>
            <Card>
                <CardHeader tag='h4'>Takeaway QR Code</CardHeader>
                <CardBody>
                    {!qrData ? (
                        <>
                            <div
                                style={{ minHeight: '160px', border: '2px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}
                                className='d-flex flex-column align-items-center justify-content-center p-3'
                            >
                                <p className="text-muted mb-2 text-center" style={{ fontSize: '0.9rem', fontWeight: 500 }}>No QR Code generated yet</p>
                                <Button.Ripple
                                    color='primary'
                                    onClick={handleGenerateQr}
                                    disabled={loading}
                                    className="mt-1"
                                >
                                    {loading ? <Spinner size='sm' /> : 'Generate QR Code'}
                                </Button.Ripple>
                            </div>
                        </>
                    ) : (
                        <Col md='12' className='mb-1 d-flex flex-column'>
                            <strong style={{ fontWeight: 'bold' }}>QR Code</strong>
                            <div
                                className='mt-1 qrcode'
                                style={{
                                    width: '200px',
                                    height: '200px',
                                    display: 'flex',
                                    background: '#ffffff',
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1rem'
                                }}
                                ref={qrRef}
                            >
                                <QRCodeCanvas
                                    value={`${Config.SITE_URL}takeaway/${qrData}`}
                                    level='L'
                                    size={160}
                                    includeMargin={false}
                                />
                            </div>
                            <span
                                onClick={handleDownload}
                                className='cursor-pointer mt-3 d-flex align-items-center justify-content-center'
                                style={{ width: '200px', color: '#557EE6', fontWeight: 600, background: 'rgba(85, 126, 230, 0.08)', padding: '0.6rem', borderRadius: '8px', transition: 'all 0.2s ease' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(85, 126, 230, 0.15)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(85, 126, 230, 0.08)'; e.currentTarget.style.transform = 'translateY(0)' }}
                            >
                                <IoMdDownload size={16} style={{ marginRight: '6px' }} /> Download
                            </span>
                        </Col>
                    )}
                </CardBody>
            </Card>
        </Fragment>
    )
}

export default Qrcode
