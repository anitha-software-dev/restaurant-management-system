import React from 'react';
import { Menu } from '../types/shopType';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    menus: Menu[];
    isOpen: boolean;
    onClose: () => void;
    setCurrentSection: (index: number) => void;
    smallScreen?: boolean;
    hasCartItems?: boolean;
}

const MenuModal: React.FC<Props> = ({ menus, isOpen, onClose, setCurrentSection, smallScreen, hasCartItems }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1999, // Below the close button but above everything else
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'flex-end',
                        paddingRight: '20px',
                        paddingBottom: hasCartItems ? '160px' : '90px', // Places it directly above the Close button depending on the cart bar presence
                        pointerEvents: 'none' // Allow clicks to pass through to the close button if needed, but the list needs events
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                        style={{
                            pointerEvents: 'auto', // Re-enable pointer events for the menu itself
                            minWidth: '220px',
                            background: 'rgba(23, 23, 23, 0.95)', // Deep black/grey
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            borderRadius: '24px',
                            padding: '16px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            maxHeight: '60vh',
                            overflowY: 'auto'
                        }}
                    >
                        {menus.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {menus.map((item: any, index: number) => (
                                    <motion.button
                                        key={item.id}
                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setCurrentSection(index);
                                            onClose();
                                        }}
                                        style={{
                                            padding: '12px 16px',
                                            border: 'none',
                                            background: 'transparent',
                                            color: '#fff',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            fontFamily: 'Poppins',
                                            borderRadius: '12px',
                                            width: '100%',
                                            borderBottom: index !== menus.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                        }}
                                    >
                                        {item.name}
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                <p style={{ margin: 0, fontSize: '14px' }}>No Menus</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MenuModal;
