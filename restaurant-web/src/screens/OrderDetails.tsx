import { components } from '../components'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom'
import { collection, doc, onSnapshot } from 'firebase/firestore';

import { db, functions } from '../configs/firebaseConfig';
import { httpsCallable } from "firebase/functions";
import { FaArrowLeft, FaDownload, FaClipboardList } from 'react-icons/fa';
import { MdRestaurantMenu } from 'react-icons/md';
import dayjs from 'dayjs';

import { Loader } from '../components/Loader'
import { hooks } from "../hooks";
import { Order, OrderItem } from '../types/OrderDetailsType';
import generatePDF from '../components/PDFGenerator';
import OrderTimeline from '../components/OrderTimeline';
import { FaUser, FaConciergeBell } from 'react-icons/fa';

const { useActiveOrder, useOrderNavigation } = hooks;


export const OrderDetails: React.FC = () => {
    const navigate = useNavigate()
    const { orderId } = useParams();
    const { navigateToOrder } = useOrderNavigation();
    const { order: activeOrder, fetching: activeFetching } = useActiveOrder([0, 1, 2]);

    const [order, setOrder] = useState<Order | null>(null);
    const [fetching, setFetching] = useState<boolean>(true);

    const [displayOrder, setDisplayOrder] = useState<Order | null>(null);
    const [waiterCalled, setWaiterCalled] = useState(false);
    const [callingWaiter, setCallingWaiter] = useState(false);

    useEffect(() => {
        if (orderId) {
            setFetching(true);
            const orderRef = doc(db, "orders", orderId);
            const unsubscribe = onSnapshot(orderRef, (snapshot) => {
                if (snapshot.exists()) {
                    const orderData = { id: snapshot.id, ...snapshot.data() } as Order;
                    setOrder(orderData);
                } else {
                    setOrder(null);
                }
                setFetching(false);
            }, (error) => {
                console.error("Error fetching order by ID:", error);
                setFetching(false);
            });

            return () => unsubscribe();
        } else {
            setOrder(activeOrder);
            setFetching(activeFetching);
        }
    }, [orderId, activeOrder, activeFetching]);

    useEffect(() => {
        if (order) {
            setDisplayOrder(order);
        } else {
            setDisplayOrder(null);
        }
    }, [order]);

    const handleGeneratePDF = async () => {
        if (!displayOrder) return;

        await generatePDF(displayOrder);
    };

    const handleCallWaiter = async () => {
        if (waiterCalled || callingWaiter || !displayOrder?.waiter?.id) return;

        setCallingWaiter(true);
        try {
            const callToWaiter = httpsCallable(functions, "callToWaiter");
            await callToWaiter({ waiterId: displayOrder.waiter.id });
            setWaiterCalled(true);
        } catch (error) {
            console.error("Error calling waiter:", error);
        } finally {
            setCallingWaiter(false);
        }
    };

    const renderHeader = (): JSX.Element => {
        return (
            <components.Header
                showBurger={true}
                showButton={true}
                headerStyle={{
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50
                }}
            />
        )
    }

    const renderContent = (): JSX.Element => {
        return (
            <main style={{
                height: '100vh',
                overflowY: 'auto',
                background: '#f9fafb',
                paddingTop: '80px', // Space for fixed header
            }}>
                <div style={{
                    width: '100%',
                    padding: '0 20px',
                    paddingBottom: '30px' // Changed from 280px to prevent huge gap
                }}>
                    {fetching && !displayOrder ? (
                        <div style={{ paddingTop: '100px' }}>
                            <Loader text="Loading..." />
                        </div>
                    ) : displayOrder ? (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Top Screen Title & Back Button */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '24px',
                                    marginTop: '8px',
                                    position: 'relative'
                                }}>
                                    <button
                                        onClick={navigateToOrder}
                                        style={{
                                            background: '#fff',
                                            border: '1px solid #f1f5f9',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            zIndex: 1
                                        }}
                                    >
                                        <FaArrowLeft size={16} color="#0f172a" />
                                    </button>
                                    <h2 style={{
                                        fontSize: '18px',
                                        fontWeight: '800',
                                        color: '#0f172a',
                                        margin: 0,
                                        letterSpacing: '-0.5px',
                                        position: 'absolute',
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                    }}>
                                        Order Details
                                    </h2>
                                </div>

                                { /* Order Timeline */}
                                <OrderTimeline
                                    status={displayOrder.orderStatus}
                                    createdAt={displayOrder.createdAt}
                                    orderType={(displayOrder.orderType === 'takeaway' || displayOrder.id?.length === 16) ? 'takeaway' : 'dine-in'}
                                />

                                {/* Customer & Waiter Info */}
                                <div style={{
                                    display: 'flex',
                                    gap: '16px',
                                    marginBottom: '24px'
                                }}>
                                    {/* Customer Card */}
                                    <div style={{
                                        flex: 1,
                                        background: '#fff',
                                        padding: '16px',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#EBF5FF',
                                            color: '#3B82F6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <FaUser size={16} />
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <p style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Customer</p>
                                            <p style={{ fontSize: '14px', color: '#111827', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {displayOrder.customer?.firstName || 'Guest'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Waiter Card - Only for Dine-in */}
                                    {(displayOrder.orderType !== 'takeaway' && displayOrder.id?.length !== 16 && displayOrder.waiter?.name) && (
                                        <div style={{
                                            flex: 1,
                                            background: '#fff',
                                            padding: '16px',
                                            borderRadius: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: '#FEF3C7',
                                                color: '#F59E0B',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <FaConciergeBell size={16} />
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <p style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Waiter</p>
                                                <p style={{ fontSize: '14px', color: '#111827', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {displayOrder.waiter?.name || 'Assigned'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Receipt Card */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: '24px',
                                    padding: '24px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                    position: 'relative',
                                    // overflow: 'hidden' // Removed to prevent clipping
                                }}>
                                    {/* Decorative Top Border */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '6px',
                                        background: 'linear-gradient(90deg, #F59E0B, #EC4899)',
                                        borderTopLeftRadius: '24px',
                                        borderTopRightRadius: '24px'
                                    }} />

                                    {/* Receipt Header */}
                                    <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '10px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Aashifa's Kitchen</h3>
                                        <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>
                                            {dayjs(displayOrder.createdAt.seconds * 1000).format('D/M/YYYY, h:mm A')}
                                        </p>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <div style={{
                                                background: '#111827',
                                                color: '#fff',
                                                padding: '6px 16px',
                                                borderRadius: '20px',
                                                fontSize: '13px',
                                                fontWeight: 600
                                            }}>
                                                Order #{displayOrder.orderNumber}
                                            </div>
                                            {(displayOrder.orderType === 'takeaway' || displayOrder.id?.length === 16) && (
                                                <div style={{
                                                    background: '#FFF7ED',
                                                    color: '#EA580C',
                                                    padding: '6px 16px',
                                                    borderRadius: '20px',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    border: '1px solid #FFEDD5'
                                                }}>
                                                    Takeaway Order
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider Line */}
                                    <div style={{
                                        borderBottom: '2px dashed #E5E7EB',
                                        marginBottom: '24px'
                                    }} />

                                    {/* Items Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '11px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <span>Item Details</span>
                                        <span>Amount</span>
                                    </div>

                                    {/* Items */}
                                    <div style={{ marginBottom: '24px' }}>
                                        {displayOrder.items.map((item: any, index: number) => {
                                            const itemSideChoicePrice = parseFloat(item.side_choice_price || "0");
                                            const finalItemPrice = parseFloat(item.base_price || item.price || "0")

                                            const sideChoiceInfo = item.additional_info?.find(
                                                (info: any) => info.include_price && info.key?.toLowerCase() === "side choices"
                                            );

                                            // Total Price for this item row = (Base Price + Side Choice Price) * Quantity
                                            const unitPriceWithSides = finalItemPrice + itemSideChoicePrice;
                                            const totalPrice = unitPriceWithSides * item.quantity;

                                            const hasSideChoice = !!sideChoiceInfo && itemSideChoicePrice > 0;

                                            return (
                                                <div key={`${item.id}-${index}`} style={{ marginBottom: '20px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div style={{ flex: 1, paddingRight: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{item.name}</span>
                                                                <span style={{
                                                                    marginLeft: '8px',
                                                                    background: '#F3F4F6',
                                                                    color: '#4B5563',
                                                                    fontSize: '11px',
                                                                    fontWeight: 700,
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px'
                                                                }}>
                                                                    x{item.quantity}
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                                                                {(displayOrder?.currencySymbol || "")}{finalItemPrice.toFixed(2)}
                                                                {item.portion ? ` (${item.portion})` : ''}
                                                            </div>
                                                            {hasSideChoice && (
                                                                <div style={{
                                                                    display: 'inline-block',
                                                                    marginTop: '6px',
                                                                    background: '#FFF7ED',
                                                                    color: '#EA580C',
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    padding: '2px 8px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #FFEDD5'
                                                                }}>
                                                                    + {sideChoiceInfo!.value} ({(displayOrder?.currencySymbol || "")}{itemSideChoicePrice.toFixed(2)})
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>
                                                            {(displayOrder?.currencySymbol || "")}{totalPrice.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Divider Line */}
                                    <div style={{
                                        borderBottom: '2px dashed #E5E7EB',
                                        marginBottom: '20px'
                                    }} />

                                    {/* Bill Details */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>Subtotal</span>
                                            <span style={{ fontSize: '14px', color: '#111827', fontWeight: 600 }}>{(displayOrder?.currencySymbol || "")}{displayOrder.subTotal.toFixed(2)}</span>
                                        </div>

                                        {Array.isArray(displayOrder.taxBreakdown) && displayOrder.taxBreakdown.length > 0 ? (
                                            displayOrder.taxBreakdown.map((t, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                    <span style={{ fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>{t.taxName}</span>
                                                    <span style={{ fontSize: '14px', color: '#111827', fontWeight: 600 }}>{(displayOrder?.currencySymbol || "")}{Number(t.taxAmount).toFixed(2)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            (displayOrder as any).taxName && Number((displayOrder as any).taxValue) > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                    <span style={{ fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>{(displayOrder as any).taxName} ({(displayOrder as any).taxValue}%)</span>
                                                    <span style={{ fontSize: '14px', color: '#111827', fontWeight: 600 }}>{(displayOrder?.currencySymbol || "")}{(((displayOrder as any).taxValue / 100) * displayOrder.subTotal).toFixed(2)}</span>
                                                </div>
                                            )
                                        )}

                                        {/* Service Charge (Fixed/Example) - if exists in order data use it, else hardcode or omit. 
                                        Assuming service charge is not in the types explicitly but might be part of total. 
                                        If not available, I'll omit or use 0 if required by design.
                                        For now obeying the screenshot which has Service Charges.
                                    */}

                                    </div>

                                    {/* Grand Total */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #F3F4F6' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>GRAND TOTAL</span>
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#F97316' }}>{(displayOrder?.currencySymbol || "")}{displayOrder.grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </motion.div>
                            {/* Bottom Actions flow naturally below the receipt instead of fixed */}
                            <div style={{
                                marginTop: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}>
                                <button
                                    onClick={navigateToOrder}
                                    style={{
                                        width: '100%',
                                        background: '#111827',
                                        color: '#fff',
                                        height: '54px',
                                        borderRadius: '16px',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>+</span> Add More Dishes
                                </button>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    {(displayOrder.orderType !== 'takeaway' && displayOrder.id?.length !== 16) && (
                                        <button
                                            onClick={handleCallWaiter}
                                            disabled={waiterCalled || callingWaiter || !displayOrder?.waiter?.id}
                                            style={{
                                                flex: 1,
                                                height: '48px',
                                                borderRadius: '12px',
                                                border: waiterCalled ? '1px solid #E5E7EB' : '1px solid #F97316',
                                                background: waiterCalled ? '#F3F4F6' : '#fff',
                                                color: waiterCalled ? '#9CA3AF' : '#F97316',
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                cursor: (waiterCalled || callingWaiter) ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <FaConciergeBell size={14} />
                                            {callingWaiter ? 'Calling...' : waiterCalled ? 'Waiter Called' : 'Call Waiter'}
                                        </button>
                                    )}

                                    <button
                                        onClick={handleGeneratePDF}
                                        style={{
                                            flex: 1,
                                            height: '48px',
                                            borderRadius: '12px',
                                            border: '1px solid #F97316',
                                            background: '#F97316',
                                            color: '#fff',
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <FaDownload size={14} />
                                        Download Bill
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                textAlign: 'center',
                                padding: '80px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '20px',
                                background: '#fff',
                                borderRadius: '24px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                                marginTop: '40px'
                            }}
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: '#F3F4F6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '8px'
                            }}>
                                <FaClipboardList size={32} color="#9CA3AF" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>No Active Order Found</h3>
                                <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '240px', margin: '0 auto', lineHeight: 1.5 }}>
                                    It looks like you don't have an active order right now. Ready to taste something delicious?
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    const token = localStorage.getItem('token');
                                    const orderType = localStorage.getItem('orderType');
                                    if (orderType === 'takeaway') {
                                        navigate(`/takeaway/menu/${token}`);
                                    } else {
                                        navigate(`/menu/${token}`);
                                    }
                                }}
                                style={{
                                    marginTop: '10px',
                                    padding: '14px 28px',
                                    borderRadius: '16px',
                                    background: '#F97316',
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                <MdRestaurantMenu size={18} />
                                Browse Menu
                            </button>
                        </motion.div>
                    )}
                </div>
            </main>
        );
    };

    return (
        <>
            {renderHeader()}
            {renderContent()}
        </>
    );
};

export default OrderDetails;
