
import React from 'react';
import { FaCheck, FaConciergeBell, FaUtensils, FaRegClock } from 'react-icons/fa';
import dayjs from 'dayjs';

interface OrderTimelineProps {
    status: number;
    createdAt: { seconds: number; nanoseconds: number } | string;
    orderType?: string;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, createdAt, orderType }) => {
    // Helper to format time
    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        if (timestamp.seconds) {
            return dayjs.unix(timestamp.seconds).format('h:mm a');
        }
        return dayjs(timestamp).format('h:mm a');
    };

    const steps = [
        {
            title: 'Order Placed',
            icon: <FaCheck size={14} />,
            activeColor: '#10B981', // Green
            bgColor: '#D1FAE5',
            stepStatus: 0,
            time: formatTime(createdAt)
        },
        {
            title: 'Preparing',
            icon: <FaConciergeBell size={14} />,
            activeColor: '#10B981',
            bgColor: '#D1FAE5',
            stepStatus: 1,
            time: '' // potentially add preparing time if available in future
        },
        {
            title: orderType === 'takeaway' ? 'Picked Up' : 'Served',
            icon: <FaUtensils size={14} />,
            activeColor: '#10B981',
            bgColor: '#D1FAE5',
            stepStatus: 2,
            time: '' // potentially add served time
        }
    ];

    return (
        <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden'
        }}>

            <div style={{ position: 'relative', paddingLeft: '10px' }}>
                {/* Vertical Line */}
                <div style={{
                    position: 'absolute',
                    left: '28px',
                    top: '20px',
                    bottom: '40px',
                    width: '2px',
                    background: '#f3f4f6',
                    zIndex: 0
                }} />

                {steps.map((step, index) => {
                    // Current step is active if order status is >= step status
                    // Example: status 1 (Preparing) -> Placed (active), Preparing (active), Served (inactive)
                    const isActive = status >= step.stepStatus;

                    // Special case: If status is 3 (Cancelled), maybe show different logic?
                    // For now assuming 0, 1, 2 flow.

                    return (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: index === steps.length - 1 ? 0 : '32px',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: isActive ? step.bgColor : '#F3F4F6',
                                color: isActive ? step.activeColor : '#9CA3AF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '16px',
                                border: isActive ? `2px solid ${step.bgColor}` : '2px solid #fff',
                                boxShadow: isActive ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
                                transition: 'all 0.3s ease'
                            }}>
                                {isActive ? <FaCheck size={14} /> : step.icon}
                            </div>

                            <div>
                                <h4 style={{
                                    fontSize: '13px',
                                    fontWeight: isActive ? 700 : 600,
                                    color: isActive ? '#111827' : '#9CA3AF',
                                    margin: 0,
                                    marginBottom: '2px'
                                }}>
                                    {step.title}
                                </h4>
                                {step.time && (
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#6B7280',
                                        margin: 0
                                    }}>
                                        {step.time}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrderTimeline;
