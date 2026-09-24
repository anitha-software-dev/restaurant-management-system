import React from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { components } from '../components';
import green from '../assets/images/veg.png';
import red from '../assets/images/non-veg.png';
import yellow from '../assets/images/other_icon.png';
import { Items } from '../types/shopType';
import { motion } from 'framer-motion';
import { theme } from '../configs/theme';
import { getItemImageUrl, handleImageError } from '../utils/imageUtils';

interface Props {
    item: Items;
    available: boolean;
    currency?: string | null;
    onAdd: () => void;
    onDetail: () => void;
    onImageClick: () => void;
    handleItemCountChange: (item: any, op: 'increment' | 'decrement') => void;
    IsCartAdded: (id: string) => boolean;
    getItemQuantity: (id: string) => number | false;
}

const ItemCard: React.FC<Props> = React.memo(({
    item,
    available,
    currency,
    onAdd,
    onDetail,
    onImageClick,
    handleItemCountChange,
    IsCartAdded,
    getItemQuantity,
}) => {
    const price =
        item.is_full_portion && !isNaN(Number(item.full_price))
            ? Number(item.full_price).toFixed(2)
            : item.is_half_portion && !isNaN(Number(item.half_price))
                ? Number(item.half_price).toFixed(2)
                : item.is_quarter_portion && !isNaN(Number(item.quarter_price))
                    ? Number(item.quarter_price).toFixed(2)
                    : '0.00';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="container"
            style={{
                marginBottom: 20,
                padding: 16,
                backgroundColor: theme.colors.white,
                borderRadius: 24,
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.02)",
                overflow: 'visible',
                position: "relative"
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 16,
                    position: 'relative',
                }}
            >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div style={{
                                width: 16, height: 16,
                                borderRadius: 4,
                                border: `1px solid ${item.veg_type === 'Veg' ? '#16a34a' : item.veg_type === 'Non Veg' ? '#dc2626' : '#ca8a04'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: 2
                            }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    backgroundColor: item.veg_type === 'Veg' ? '#16a34a' : item.veg_type === 'Non Veg' ? '#dc2626' : '#ca8a04'
                                }} />
                            </div>

                            {item.is_bestseller && (
                                <div style={{
                                    background: "linear-gradient(90deg, #FF8C00 0%, #FFD700 100%)",
                                    padding: "2px 8px", borderRadius: 4,
                                    fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5
                                }}>
                                    Bestseller
                                </div>
                            )}
                        </div>

                        <h5
                            style={{
                                textAlign: 'left',
                                textTransform: 'capitalize',
                                fontWeight: 700,
                                fontSize: 14,
                                color: "#1f2937",
                                margin: "0 0 6px 0",
                                lineHeight: 1.3
                            }}
                        >
                            {item.name}
                        </h5>

                        <div style={{
                            fontWeight: 800,
                            fontSize: 16,
                            color: "#111827",
                            marginBottom: 8,
                            display: 'flex', alignItems: 'center', gap: 6
                        }}>
                            <span>{currency ? currency : ''}{price}</span>
                        </div>

                        <p
                            style={{
                                textAlign: 'left',
                                marginBottom: 4,
                                lineHeight: 1.5,
                                fontSize: 13,
                                color: "#6b7280",
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {item.description}
                        </p>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDetail();
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#ef4444',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                display: 'inline-block'
                            }}
                        >
                            More
                        </button>
                    </div>
                </div>

                <div style={{ position: 'relative', width: '130px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onImageClick}
                        style={{
                            width: '130px',
                            height: '110px',
                            borderRadius: 20,
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                            cursor: 'pointer'
                        }}
                    >
                        <img
                            src={getItemImageUrl(item)}
                            alt={item.name}
                            onError={handleImageError}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: available ? 'none' : 'grayscale(100%)',
                            }}
                        />
                        {!available && (
                            <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(2px)'
                            }}>
                                <span style={{ color: '#ef4444', fontWeight: 800, fontSize: 12, transform: 'rotate(-10deg)', border: '2px solid #ef4444', padding: '4px 8px', borderRadius: 8 }}>SOLD OUT</span>
                            </div>
                        )}
                    </motion.div>

                    <div style={{
                        marginTop: -18,
                        zIndex: 10,
                        width: '100px',
                    }}>
                        {IsCartAdded(item.id) ? (
                            <div
                                style={{
                                    borderRadius: 50,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: "#111827",
                                    height: '38px',
                                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                                    padding: '0 4px',
                                    border: "1px solid rgba(255,255,255,0.1)"
                                }}
                            >
                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    disabled={!available}
                                    onClick={() => handleItemCountChange(item, 'decrement')}
                                    style={{
                                        width: 30, height: 30, borderRadius: '50%',
                                        background: 'transparent', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <FiMinus color="#fff" size={14} />
                                </motion.button>
                                <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>
                                    {getItemQuantity(item.id)}
                                </span>
                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    disabled={!available}
                                    onClick={() => handleItemCountChange(item, 'increment')}
                                    style={{
                                        width: 30, height: 30, borderRadius: '50%',
                                        background: 'transparent', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <FiPlus color="#fff" size={14} />
                                </motion.button>
                            </div>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    width: '100%',
                                    height: '38px',
                                    background: available ? theme.colors.white : '#f3f4f6',
                                    color: available ? "#16a34a" : '#9ca3af',
                                    borderRadius: 50,
                                    border: available ? `1px solid #dcfce7` : '1px solid #e5e7eb',
                                    fontWeight: 800,
                                    fontSize: 14,
                                    boxShadow: available ? "0 4px 12px rgba(22, 163, 74, 0.15)" : "none",
                                    cursor: available ? 'pointer' : 'not-allowed',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                }}
                                disabled={!available}
                                onClick={onAdd}
                            >
                                ADD
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

export default ItemCard;
