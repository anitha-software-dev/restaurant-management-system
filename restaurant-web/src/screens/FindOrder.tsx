import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { components } from '../components'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaClock } from 'react-icons/fa';
import dayjs from 'dayjs';
import { db } from '../configs/firebaseConfig'
import { FiSearch, FiFileText, FiAlertCircle } from "react-icons/fi";
import { Order, OrderItem } from "../types/OrderDetailsType";
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from '../components/Loader'
import { hooks } from "../hooks";

const { useOrderNavigation } = hooks;

export const FindOrder: React.FC = () => {

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [searchOrderNumber, setSearchOrderNumber] = useState<string>('');
    const [searchError, setSearchError] = useState<string>('');

    const { navigateToOrder } = useOrderNavigation();
    const restaurantConfig = hooks.useRestaurantConfig();
    const navigate = useNavigate();

    const handleViewFullDetails = () => {
        if (!order) return;
        navigate(`/order-details/${order.id}`);
    };

    const handleOrderSearch = async () => {
        setSearchError('');

        if (!searchOrderNumber.trim()) {
            setSearchError('Please enter an order number.');
            return;
        }
        setLoading(true);
        try {
            const searchNum = Number(searchOrderNumber);
            
            // Optimization: Check local storage for potentially matching orderId
            const localOrderId = localStorage.getItem("orderId");
            if (localOrderId) {
                const { getDoc, doc } = await import('firebase/firestore');
                const docRef = doc(db, "orders", localOrderId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.orderNumber === searchNum) {
                        setOrder({ id: docSnap.id, ...data } as Order);
                        setLoading(false);
                        return;
                    }
                }
            }

            const ordersRef = collection(db, "orders");

            let constraints = [
                where("orderNumber", "==", searchNum),
                limit(1)
            ];

            if (restaurantConfig.restaurantId) {
                constraints.unshift(where("restaurantId", "==", restaurantConfig.restaurantId));
            }

            const q = query(ordersRef, ...constraints);
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const docData = snapshot.docs[0];
                const orderData = { id: docData.id, ...docData.data() } as Order;
                setOrder(orderData);
            } else {
                setOrder(null);
                setSearchError('No order found with this order number.');
            }
        } catch (error) {
            console.error("Search error:", error);
            setOrder(null);
            setSearchError('Error searching for order.');
        }
        setLoading(false);
    };

    const getStatusColor = (status: number) => {
        switch (status) {
            case 0: return '#f39c12'; // Pending
            case 1: return '#2980d9'; // Accepted
            case 2: return '#27ae60'; // Delivered
            case 3: return '#e74c3c'; // Cancelled
            case 4: return '#8e44ad'; // Cleared
            default: return '#7f8c8d'; // Unknown
        }
    };

    const getStatusText = (status: number) => {
        switch (status) {
            case 0: return 'PENDING';
            case 1: return 'ACCEPTED';
            case 2: return 'DELIVERED';
            case 3: return 'CANCELLED';
            case 4: return 'CLEARED';
            default: return 'UNKNOWN';
        }
    };

    const renderHeader = (): JSX.Element => {
        return (
            <components.Header
                showBurger={true}
                showButton={true}
            />
        )
    }

    const renderContent = (): JSX.Element => {

        return (
            <main
                style={{
                    minHeight: '100vh',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingBottom: 40
                }}
            >
                <div
                    style={{
                        padding: '0 20px',
                        width: '100%',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '32px',
                        marginTop: '10px',
                    }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={navigateToOrder}
                            style={{
                                background: '#fff',
                                border: '1px solid #f1f5f9',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                zIndex: 1
                            }}
                        >
                            <FaArrowLeft size={16} color="#0f172a" />
                        </motion.button>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: '800',
                            color: '#0f172a',
                            margin: '0 auto',
                            letterSpacing: '-0.5px'
                        }}>
                            Track Order
                        </h2>
                    </div>

                    {/* Search Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: '#fff',
                            borderRadius: '32px',
                            padding: '32px 24px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.04)',
                            marginBottom: '32px',
                            border: '1px solid rgba(241, 245, 249, 0.5)'
                        }}
                    >
                        <div style={{ marginBottom: '28px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                                Find your order
                            </h3>
                            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                                Track your meal's progress in real-time
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ position: 'relative' }}>
                                <motion.input
                                    whileFocus={{ scale: 1.01, boxShadow: '0 0 0 4px rgba(234, 88, 12, 0.1)' }}
                                    type="number"
                                    value={searchOrderNumber}
                                    placeholder='Enter Order ID'
                                    onChange={(e) => setSearchOrderNumber(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 40px',
                                        height: '64px',
                                        borderRadius: '20px',
                                        border: '2px solid #f1f5f9',
                                        background: '#f8fafc',
                                        fontSize: '18px',
                                        textAlign: 'center',
                                        outline: 'none',
                                        fontWeight: 800,
                                        color: '#0f172a',
                                        boxSizing: 'border-box',
                                        letterSpacing: '2px',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: '#c2410c' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleOrderSearch}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    height: '60px',
                                    background: loading ? '#f1f5f9' : '#ea580c',
                                    color: loading ? '#94a3b8' : '#fff',
                                    borderRadius: '20px',
                                    fontSize: '16px',
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: loading ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    boxShadow: loading ? 'none' : '0 10px 25px rgba(234, 88, 12, 0.25)',
                                    transition: 'background 0.3s ease',
                                }}
                            >
                                {loading ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><FiSearch size={22} /></motion.div>
                                        <span>Tracking...</span>
                                    </div>
                                ) : (
                                    <>
                                        Track Order <FiSearch size={22} />
                                    </>
                                )}
                            </motion.button>
                        </div>

                        <AnimatePresence>
                            {searchError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        x: [0, -6, 6, -6, 6, 0]
                                    }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        duration: 0.5,
                                        x: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
                                    }}
                                    style={{
                                        marginTop: '24px',
                                        padding: '24px 20px',
                                        background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
                                        border: '1px solid #fee2e2',
                                        borderRadius: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px',
                                        boxShadow: '0 15px 35px rgba(239, 68, 68, 0.1)',
                                    }}
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        style={{
                                            width: '52px',
                                            height: '52px',
                                            borderRadius: '50%',
                                            background: '#fee2e2',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '4px'
                                        }}
                                    >
                                        <FiAlertCircle size={32} color="#ef4444" />
                                    </motion.div>
                                    <p style={{
                                        color: '#ef4444',
                                        fontSize: '15px',
                                        margin: 0,
                                        textAlign: 'center',
                                        fontWeight: 800,
                                        fontFamily: 'Poppins',
                                        lineHeight: 1.4
                                    }}>
                                        {searchError}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Order Result Card */}
                    {order && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{
                                background: '#fff',
                                borderRadius: '32px',
                                overflow: 'hidden',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(241, 245, 249, 0.5)',
                                position: 'relative'
                            }}
                        >
                            {/* Receipt Header Aesthetic */}
                            <div style={{
                                height: '8px',
                                background: 'linear-gradient(90deg, #ea580c 0%, #fb923c 100%)',
                                width: '100%'
                            }} />

                            <div style={{ padding: '32px 24px' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '32px'
                                }}>
                                    <div>
                                        <h4 style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 8px' }}>
                                            Order Status
                                        </h4>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 16px',
                                            borderRadius: '100px',
                                            background: `${getStatusColor(order.orderStatus)}15`,
                                            border: `1px solid ${getStatusColor(order.orderStatus)}30`
                                        }}>
                                            <motion.div
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(order.orderStatus) }}
                                            />
                                            <span style={{ fontSize: '16px', fontWeight: 800, color: getStatusColor(order.orderStatus) }}>
                                                {order.orderStatus === 0 ? 'Pending' :
                                                    order.orderStatus === 1 ? 'Accepted' :
                                                        order.orderStatus === 2 ? (order.qrType === 'Takeaway' || order.id?.length === 16 ? 'Picked Up' : 'Served') :
                                                            order.orderStatus === 3 ? 'Cancelled' :
                                                                order.orderStatus === 4 ? 'Processing' : 'Done'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <h4 style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 4px' }}>
                                            Order Number
                                        </h4>
                                        <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>
                                            #{order.orderNumber}
                                        </span>
                                    </div>
                                </div>

                                <div style={{
                                    background: '#f8fafc',
                                    borderRadius: '20px',
                                    padding: '24px',
                                    marginBottom: '32px',
                                    border: '1px dashed #e2e8f0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                                            <FiFileText size={20} color="#ea580c" />
                                        </div>
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Order Summary</h4>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {order.items?.slice(0, 3).map((item: OrderItem, index: number) => {
                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 * index }}
                                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                                                            {item.quantity} x
                                                        </span>
                                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                                                        {restaurantConfig?.currency} {parseFloat(item.price || "0") * (item.quantity || 1)}
                                                    </span>
                                                </motion.div>
                                            );
                                        })}

                                        {order.items && order.items.length > 3 && (
                                            <div style={{
                                                fontSize: '13px',
                                                color: '#94a3b8',
                                                fontStyle: 'italic',
                                                marginTop: '4px',
                                                paddingLeft: '4px'
                                            }}>
                                                ...and {order.items.length - 3} more {order.items.length - 3 === 1 ? 'item' : 'items'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{
                                    paddingTop: '24px',
                                    borderTop: '2px solid #f1f5f9',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '32px'
                                }}>
                                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#64748b' }}>Grand Total</span>
                                    <span style={{ fontSize: '24px', fontWeight: 900, color: '#ea580c' }}>
                                        {restaurantConfig?.currency} {order.grandTotal}
                                    </span>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleViewFullDetails}
                                    style={{
                                        width: '100%',
                                        height: '60px',
                                        background: '#0f172a',
                                        color: '#fff',
                                        borderRadius: '20px',
                                        fontSize: '16px',
                                        fontWeight: 800,
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2)',
                                    }}
                                >
                                    View Full Details <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}><FaArrowLeft style={{ transform: 'rotate(180deg)' }} /></motion.div>
                                </motion.button>
                            </div>

                            {/* Decorative Cutouts for Receipt Look */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-10px',
                                left: '0',
                                right: '0',
                                display: 'flex',
                                justifyContent: 'space-around',
                                zIndex: 1
                            }}>
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} style={{ width: '20px', height: '20px', background: '#f8fafc', borderRadius: '50%' }} />
                                ))}
                            </div>
                        </motion.div>
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
