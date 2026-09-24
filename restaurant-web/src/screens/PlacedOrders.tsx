import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../configs/firebaseConfig'
import { BeatLoader } from 'react-spinners'
import { components } from '../components'
import { FaSearch } from 'react-icons/fa'
import { useNavigate, useParams } from 'react-router-dom'
import { FiMinus, FiPlus } from "react-icons/fi";
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { getCollection } from '../services';
import dayjs from 'dayjs';
import { hooks } from '../hooks';

interface OrderItem {
    id: string
    name: string
    portion: string
    quantity: number
    price: string
    images: string[]
}

interface Order {
    id: string
    qrId: string
    qrType: string
    qrNumber: string
    createdAt: { seconds: number; nanoseconds: number }
    grandTotal: number
    items: OrderItem[]
    orderStatus: number
    paymentMode: string
    paymentStatus: number
    taxName: string
    taxValue: number
    subTotal: number
    vat: string
    vatEnabled: boolean
    transactionId: string
    currencySymbol?: string | null
    customer?: {
        firstName: string
        lastName: string
    }
    waiter?: {
        id: string
        name: string
    }
}

export const PlacedOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState<boolean>(false)

    const { currency, currencyObj, platformFee, isLoading: configLoading } = hooks.useRestaurantConfig();
    const navigate = useNavigate();

    const handleBack = () => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate(`/${token}`)
        }
    }


    useEffect(() => {
        const tableData = localStorage.getItem('table')
        const table = tableData ? JSON.parse(tableData) : null
        const tableId = table?.id

        if (!tableId) {
            console.log('No table ID found in localStorage.')
            setOrder(null)
            return
        }

        const ordersRef = collection(db, 'orders')
        const q = query(
            ordersRef,
            where('qrId', '==', tableId),
            where('orderStatus', '==', 0)
        )

        setLoading(true)

        const stopListening = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                console.log('No active order found for this table.')
                setOrder(null)
            } else {
                const docData = snapshot.docs[0]
                const orderData = { id: docData.id, ...docData.data() } as Order
                // console.log('Fetched real-time order:', orderData)
                setOrder(orderData)
            }
            setLoading(false)
        }, (error) => {
            console.error('Error fetching order in real-time:', error)
            setOrder(null)
            setLoading(false)
        })

        return () => stopListening()
    }, [])


    // configurations fetch removed in favor of useRestaurantConfig hook

    const renderHeader = (): JSX.Element => {
        return (
            <components.Header
                showBurger={true}
                showButton={true}
                headerStyle={{
                    backgroundColor: 'transparent',
                }}
            />
        )
    }

    const renderContent = (): JSX.Element => {
        return (
            <main style={{ backgroundColor: '#f2f4f4', display: 'flex', justifyContent: 'center' }}>
                <div
                    style={{
                        padding: '20px',
                        fontFamily: 'Poppins',
                        maxWidth: '450px',
                        width: '100%',
                    }}
                >
                    <button
                        onClick={handleBack}
                        style={{
                            position: 'absolute',
                            top: 90,
                            left: 20,
                            background: 'none',
                            border: 'none',
                            fontSize: '14px',
                            color: '#000',
                        }}
                    >
                        <FaArrowLeft size={16} style={{ marginTop: 3 }} />
                        <span
                            style={{ fontSize: "13px", fontFamily: 'Poppins', marginLeft: 5 }}
                        >
                            Back
                        </span>
                    </button>

                    <h2
                        style={{
                            textAlign: 'center',
                            marginBottom: '20px',
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            color: '#000',
                        }}
                    >
                        Order details
                    </h2>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <BeatLoader />
                        </div>
                    ) : order ? (
                        <div
                            style={{
                                background: '#fff',
                                padding: '15px',
                                borderRadius: '10px',
                                marginBottom: '20px',
                                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            <div style={{ marginBottom: '5px' }}>
                                <strong style={{ fontSize: '14px', color: '#000' }}>Order ID:</strong>{' '}
                                <span style={{ fontSize: '14px', color: '#000' }}>{order.transactionId}</span>
                            </div>

                            <div style={{ marginBottom: '5px' }}>
                                <strong style={{ fontSize: '14px', color: '#000' }}>Order Status:</strong>{' '}
                                <span style={{ fontSize: '14px', color: '#000' }}>
                                    {order.orderStatus === 0
                                        ? 'Pending'
                                        : order.orderStatus === 1
                                            ? 'Accepted'
                                            : order.orderStatus === 2
                                                ? (order.qrType === 'Takeaway' || order.id?.length === 16 ? 'Picked Up' : 'Served')
                                                : order.orderStatus === 3
                                                    ? 'Cancelled'
                                                    : order.orderStatus === 4
                                                        ? 'Cleared'
                                                        : 'Unknown'}
                                </span>
                            </div>

                            {order.qrType && order.qrNumber && (
                                <div style={{ marginBottom: '5px' }}>
                                    <strong style={{ fontSize: '14px', color: '#000' }}>Assigned:</strong>{' '}
                                    <span style={{ fontSize: '14px', color: '#000' }}>{order.qrType} - {order.qrNumber}</span>
                                </div>
                            )}

                            {order.customer && (
                                <div style={{ marginBottom: '5px' }}>
                                    <strong style={{ fontSize: '14px', color: '#000' }}>Customer:</strong>{' '}
                                    <span style={{ fontSize: '14px', color: '#000' }}>{order.customer.firstName} {order.customer.lastName}</span>
                                </div>
                            )}

                            {order.waiter && (
                                <div style={{ marginBottom: '5px' }}>
                                    <strong style={{ fontSize: '14px', color: '#000' }}>Waiter:</strong>{' '}
                                    <span style={{ fontSize: '14px', color: '#000' }}>{order.waiter.name}</span>
                                </div>
                            )}

                            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#f9f9f9', marginTop: '10px', marginBottom: "20px" }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#e8e8e8', textAlign: 'left' }}>
                                            <th style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold', color: '#000' }}>Item</th>
                                            <th style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold', color: '#000' }}>Price</th>
                                            <th style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold', color: '#000' }}>Qty</th>
                                            <th style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold', color: '#000' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item) => {
                                            const totalPrice = parseFloat(item.price) * item.quantity
                                            return (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                                                    <td style={{ padding: '8px', fontSize: '14px', color: '#000' }}>{item.name}</td>
                                                    <td style={{ padding: '8px', fontSize: '14px', color: '#000' }}>{item.price}</td>
                                                    <td style={{ padding: '8px', fontSize: '14px', color: '#000' }}>{item.quantity}</td>
                                                    <td style={{ padding: '8px', fontSize: '14px', color: '#000' }}>{totalPrice.toFixed(2)}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div
                                style={{
                                    background: '#fff',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    marginBottom: '20px',
                                    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
                                }}
                            >

                                <div style={{ display: 'flex', alignItems: 'center', }}>
                                    <h4 style={{
                                        textAlign: 'left', marginLeft: 10, marginTop: 5, fontWeight: 'bold', fontSize: '13px'
                                    }}>
                                        Bill Summary

                                    </h4>
                                    <small style={{ marginLeft: 10, fontFamily: "Poppins", fontSize: "11px", marginTop: 10 }}>{dayjs().format('dddd, DD MMM YYYY')}</small>
                                </div>

                                <div>
                                    <div className="row-center-space-between" style={{ marginTop: 10 }}>
                                        <span style={{ fontSize: '13px', fontFamily: 'Poppins', paddingInline: 10 }}>
                                            Sub Total Bill
                                        </span>
                                        <div style={{ marginRight: 10, display: 'flex', gap: 20, fontFamily: "Poppins", fontSize: '14px' }}>
                                            <span> {order.currencySymbol || currency} {order.subTotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {order.taxName && order.taxValue > 0 && (
                                        <div className="row-center-space-between" style={{ marginTop: 10 }}>
                                            <span style={{ fontSize: '13px', fontFamily: 'Poppins', paddingInline: 10 }}>
                                                {order.taxName} ({order.taxValue}%)
                                            </span>
                                            <div style={{ marginRight: 10, display: 'flex', gap: 20, fontFamily: "Poppins", fontSize: '14px' }}>
                                                <span> {order.currencySymbol || currency} {((order.taxValue / 100) * order.subTotal).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="row-center-space-between" style={{ marginTop: 10 }}>
                                        <span style={{ fontSize: '13px', fontFamily: 'Poppins', paddingInline: 10, fontWeight: 'bold' }}>
                                            Grand Total
                                        </span>
                                        <div style={{ marginRight: 10, fontWeight: 'bold', display: 'flex', gap: 20, fontFamily: "Poppins", fontSize: '14px' }}>
                                            <span> {order.currencySymbol || currency} {order.grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <components.Button
                                text="Add More Dishes"
                                colorScheme="primary"
                                onClick={handleBack}
                            />
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '60vh',
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ fontSize: '14px', color: '#555' }}>
                                No order found for this table.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        )
    }

    return (
        <>
            {renderHeader()}
            {renderContent()}
        </>
    )
}
