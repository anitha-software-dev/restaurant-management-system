import React from 'react';
import { MdOutlineStorefront } from 'react-icons/md';
import { motion } from 'framer-motion';

const UnavailableContent: React.FC = () => {
    return (
        <main style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #fdfbf7 0%, #fff7ed 100%)",
            padding: "20px"
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                    background: "#fff",
                    padding: "48px 32px",
                    borderRadius: "32px",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    maxWidth: "400px",
                    width: "100%"
                }}
            >
                <div style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '28px',
                    background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '32px',
                    transform: 'rotate(-5deg)'
                }}>
                    <MdOutlineStorefront size={48} color="#4F46E5" />
                </div>

                <h2 style={{
                    margin: "0 0 12px",
                    color: "#111827",
                    fontSize: "22px",
                    fontWeight: 800,
                    letterSpacing: "-0.5px"
                }}>
                    Store is Closed
                </h2>

                <p style={{
                    margin: "0",
                    color: "#6b7280",
                    fontSize: "15px",
                    fontWeight: 500,
                    lineHeight: 1.6
                }}>
                    We're currently not accepting orders. Please check back later or contact the restaurant staff.
                </p>
            </motion.div>
        </main>
    );
};

export default UnavailableContent;
