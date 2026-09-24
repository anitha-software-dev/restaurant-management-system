import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface InvalidContentProps {
    message?: string;
}

const InvalidContent: React.FC<InvalidContentProps> = ({ message = 'No Restaurant Found!' }) => {

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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                    background: "#fff",
                    padding: "48px 32px",
                    borderRadius: "32px",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    maxWidth: "400px",
                    width: "100%",
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                {/* Decorative background element */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'rgba(254, 226, 226, 0.3)',
                    zIndex: 0
                }} />

                <motion.div
                    initial={{ scale: 0.5, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.2
                    }}
                    style={{
                        width: 90,
                        height: 90,
                        borderRadius: "28px",
                        background: "#fff1f2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "32px",
                        boxShadow: "0 10px 20px rgba(225, 29, 72, 0.05)",
                        zIndex: 1
                    }}>
                    <FiAlertTriangle size={42} color="#e11d48" />
                </motion.div>

                <h2 style={{
                    margin: "0 0 12px",
                    color: "#111827",
                    fontSize: "24px",
                    fontWeight: 800,
                    letterSpacing: "-0.5px"
                }}>
                    Oops!
                </h2>

                <p style={{
                    margin: "0",
                    color: "#6b7280",
                    fontSize: "15px",
                    fontWeight: 500,
                    lineHeight: 1.6
                }}>
                    {message}
                </p>
            </motion.div>
        </main>
    );
};

export default InvalidContent;
