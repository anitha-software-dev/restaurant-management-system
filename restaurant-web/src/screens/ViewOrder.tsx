import { components } from '../components'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../configs/firebaseConfig';
import { FaArrowLeft, FaDownload, FaBell } from 'react-icons/fa';
import dayjs from 'dayjs';
import { Loader } from '../components/Loader'
import { hooks } from "../hooks";
import { Order, OrderItem } from '../types/OrderDetailsType';
import generatePDF from '../components/PDFGenerator';

const { useActiveOrder } = hooks;

export const ViewOrder: React.FC = () => {

    const navigate = useNavigate()
    const { orderId } = useParams();

    const { order: activeOrder, fetching: activeFetching } = useActiveOrder([0, 1, 2]);

    const [order, setOrder] = useState<Order | null>(null);
    const [fetching, setFetching] = useState<boolean>(true);
    const [displayOrder, setDisplayOrder] = useState<Order | null>(null);

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
        }
    }, [order]);


    const handleGeneratePDF = async () => {
        if (!displayOrder) return;

        await generatePDF(displayOrder);
    };

    const renderHeader = (): JSX.Element => {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 50,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2
                        style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#0f172a',
                            fontFamily: 'Poppins',
                            margin: 0
                        }}
                    >
                        View Order
                    </h2>
                </div>
            </div>
        )
    }

    const renderContent = (): JSX.Element => {
        return (
            <main style={{
                minHeight: '100vh',
                background: '#f9fafb',
                paddingTop: '80px',
                paddingBottom: '150px',
                color: '#0f172a'
            }}>
                <div
                    style={{
                        padding: '0 20px',
                        fontFamily: 'Poppins',
                        width: '100%',
                    }}
                >
                    {fetching && !displayOrder ? (
                        <Loader text="Loading..." />
                    ) : displayOrder ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Receipt Card */}
                            <div style={{
                                background: '#fff',
                                borderRadius: '28px',
                                padding: '28px',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.02)',
                                position: 'relative',
                                fontFamily: 'Poppins',
                                border: '1px solid rgba(0,0,0,0.03)'
                            }}>
                                {/* Decorative Gradient Top Border */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '8px',
                                    background: 'linear-gradient(90deg, #F59E0B, #EC4899, #8B5CF6)',
                                    borderTopLeftRadius: '24px',
                                    borderTopRightRadius: '24px'
                                }} />

                                {/* Receipt Header */}
                                <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '16px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>Aashifa's Kitchen</h3>
                                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>
                                        {dayjs(displayOrder.createdAt.seconds * 1000).format('D/M/YYYY, h:mm A')}
                                    </p>

                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '16px',
                                        marginBottom: '32px',
                                        width: '100%'
                                    }}>
                                        {/* Order # Badge */}
                                        <div style={{
                                            background: '#0f172a',
                                            color: '#fff',
                                            padding: '12px 18px',
                                            borderRadius: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 12px rgba(15, 23, 42, 0.2)'
                                        }}>
                                            <span style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.6, fontWeight: 800, letterSpacing: '1px' }}>Order ID</span>
                                            <span style={{ fontSize: '15px', fontWeight: 800 }}>#{displayOrder.orderNumber || displayOrder?.transactionId?.slice(0, 4)}</span>
                                        </div>

                                        {/* Category Badge */}
                                        <div style={{
                                            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                                            color: '#c2410c',
                                            padding: '12px 18px',
                                            borderRadius: '16px',
                                            border: '1px solid #ffedd5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            boxShadow: '0 4px 10px rgba(234, 88, 12, 0.05)'
                                        }}>
                                            <span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 700 }}>Service Type</span>
                                            <span style={{
                                                fontSize: '14px',
                                                fontWeight: 800,
                                                background: 'rgba(255,255,255,0.5)',
                                                backdropFilter: 'blur(4px)',
                                                padding: '4px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(194, 65, 12, 0.1)'
                                            }}>
                                                {(displayOrder.orderType === 'takeaway' || displayOrder.id?.length === 16) ? 'Takeaway' : 'Dine-in'}
                                            </span>
                                        </div>

                                        {/* Status Badge */}
                                        <div style={{
                                            background: displayOrder.orderStatus === 0 ? 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)' :
                                                displayOrder.orderStatus === 1 ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' :
                                                    displayOrder.orderStatus === 2 ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' :
                                                        displayOrder.orderStatus === 3 ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : '#f8fafc',
                                            color: displayOrder.orderStatus === 0 ? '#854d0e' :
                                                displayOrder.orderStatus === 1 ? '#1d4ed8' :
                                                    displayOrder.orderStatus === 2 ? '#15803d' :
                                                        displayOrder.orderStatus === 3 ? '#b91c1c' : '#475569',
                                            padding: '12px 18px',
                                            borderRadius: '16px',
                                            border: `1px solid ${displayOrder.orderStatus === 0 ? '#fef08a' : '#e2e8f0'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                                        }}>
                                            <span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 700 }}>Current Status</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {/* Live Pulse Indicator */}
                                                <motion.div
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                                    style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: 'currentColor',
                                                        boxShadow: `0 0 8px currentColor`
                                                    }}
                                                />
                                                <span style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.2px' }}>
                                                    {displayOrder.orderStatus === 0 ? "Pending" :
                                                        displayOrder.orderStatus === 1 ? "Accepted" :
                                                            displayOrder.orderStatus === 2 ? ((displayOrder.orderType === 'takeaway' || displayOrder.id?.length === 16) ? "Picked Up" : "Served") :
                                                                displayOrder.orderStatus === 3 ? "Cancelled" : "Completed"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {((displayOrder.orderType !== 'takeaway' && displayOrder.id?.length !== 16) && displayOrder.qrType && displayOrder.qrNumber) && (
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            color: '#4B5563',
                                            background: '#F3F4F6',
                                            padding: '6px 20px',
                                            borderRadius: '12px',
                                            border: '1px solid #E5E7EB'
                                        }}>
                                            {displayOrder.qrType} - {displayOrder.qrNumber}
                                        </div>
                                    )}
                                </div>

                                {/* Divider Line */}
                                <div style={{
                                    borderBottom: '2px dashed #E2E8F0',
                                    marginBottom: '32px',
                                    opacity: 0.6
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

                                        const unitPriceWithSides = finalItemPrice + itemSideChoicePrice;
                                        const totalPrice = unitPriceWithSides * item.quantity;
                                        const hasSideChoice = !!sideChoiceInfo && itemSideChoicePrice > 0;

                                        return (
                                            <div key={`${item.id}-${index}`} style={{ marginBottom: '28px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ flex: 1, paddingRight: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                            <span style={{ fontSize: '15.5px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.3px' }}>{item.name}</span>
                                                            <span style={{
                                                                background: 'rgba(241, 245, 249, 0.8)',
                                                                color: '#64748b',
                                                                fontSize: '11px',
                                                                fontWeight: 900,
                                                                padding: '2px 8px',
                                                                borderRadius: '6px',
                                                                border: '1px solid rgba(226, 232, 240, 0.5)'
                                                            }}>
                                                                x{item.quantity}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>
                                                            {(displayOrder?.currencySymbol || "")}{finalItemPrice.toFixed(2)}
                                                            {item.portion ? ` • ${item.portion}` : ''}
                                                        </div>
                                                        {hasSideChoice && (
                                                            <div style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                margin: '4px 0',
                                                                color: '#c2410c',
                                                                fontSize: '12px',
                                                                fontWeight: 700,
                                                                padding: '6px 14px',
                                                                borderRadius: '12px',
                                                                border: '1px solid rgba(255, 237, 213, 0.8)',
                                                                background: 'rgba(255, 252, 249, 0.5)',
                                                                backdropFilter: 'blur(4px)'
                                                            }}>
                                                                + {sideChoiceInfo!.value} ({(displayOrder?.currencySymbol || "")}{itemSideChoicePrice.toFixed(2)})
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '15.5px', fontWeight: 900, color: '#0f172a' }}>
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
                                <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Item Subtotal</span>
                                        <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 700 }}>{(displayOrder?.currencySymbol || "")}{displayOrder.subTotal.toFixed(2)}</span>
                                    </div>

                                    {Array.isArray(displayOrder.taxBreakdown) && displayOrder.taxBreakdown.length > 0 ? (
                                        displayOrder.taxBreakdown.map((t: any, idx: number) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{t.taxName}</span>
                                                <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 700 }}>{(displayOrder?.currencySymbol || "")}{Number(t.taxAmount).toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        (displayOrder as any).taxName && Number((displayOrder as any).taxValue) > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{(displayOrder as any).taxName} ({(displayOrder as any).taxValue}%)</span>
                                                <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 700 }}>{(displayOrder?.currencySymbol || "")}{(((displayOrder as any).taxValue / 100) * displayOrder.subTotal).toFixed(2)}</span>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Grand Total */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: '24px',
                                    paddingTop: '24px',
                                    borderTop: '2px solid #F8FAFC'
                                }}>
                                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>GRAND TOTAL</span>
                                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#F97316', textShadow: '0 2px 10px rgba(249, 115, 22, 0.15)' }}>{(displayOrder?.currencySymbol || "")}{displayOrder.grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Bottom Actions */}
                            <div style={{
                                marginTop: '24px',
                                marginBottom: '100px',
                                display: 'flex',
                                width: '100%',
                            }}>
                                <button
                                    onClick={handleGeneratePDF}
                                    style={{
                                        flex: 1,
                                        width: '100%',
                                        background: '#111827',
                                        color: '#fff',
                                        height: '52px',
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        fontWeight: 800,
                                        border: 'none',
                                        cursor: 'pointer',
                                        marginBottom: "25px",
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        fontFamily: 'Poppins',
                                        boxShadow: '0 4px 15px rgba(17, 24, 39, 0.1)'
                                    }}
                                >
                                    <FaDownload size={14} /> Download Bill
                                </button>
                            </div>
                        </motion.div>
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
                            <p style={{ fontSize: '14px', color: '#9ca3af' }}>
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
