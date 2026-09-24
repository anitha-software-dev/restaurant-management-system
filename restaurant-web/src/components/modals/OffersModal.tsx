import React, { useState } from "react";
import { FaTimes, FaTags, FaCopy, FaCheck } from "react-icons/fa";
import food from "../../assets/images/food-placeholder.jpg";
import { getFirebaseImageUrl, handleImageError } from "../../utils/imageUtils";

interface Offer {
    id: string;
    title?: string;
    description?: string;
    image?: string[] | string;
    code?: string;
}

interface Props {
    open: boolean;
    offers?: Offer[];
    onClose: () => void;
}

const OffersModal: React.FC<Props> = ({
    open,
    offers = [],
    onClose,
}) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    if (!open) return null;

    const hasOffers = offers.length > 0;

    const handleCopy = (e: React.MouseEvent, code: string, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.5)", // Dark semi-transparent
                backdropFilter: "blur(4px)",
                zIndex: 1000,
                display: "flex",
                justifyContent: "center",
                alignItems: "center", // Centered style
                padding: "20px",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: 420,
                    maxHeight: "85vh",
                    background: "#f8fafc",
                    borderRadius: "24px", // Full rounded
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                    animation: "zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
            >
                {/* Close Button Absolute */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "none",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#64748b",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        zIndex: 10,
                        transition: "transform 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                    <FaTimes size={16} />
                </button>

                {/* Content Area */}
                <div style={{
                    padding: "48px 24px 24px",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}>
                    {hasOffers ? (
                        offers.map((offer) => {
                            const offerImg = Array.isArray(offer.image) ? offer.image[0] : offer.image;
                            const isCopied = copiedId === offer.id;

                            return (
                                <div
                                    key={offer.id}
                                    style={{
                                        // background: "#ffffff",
                                        borderRadius: "20px",
                                        padding: "20px",
                                        display: "flex",
                                        flexDirection: "column",
                                        // boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                                        // border: "1px solid #f1f5f9",
                                        position: "relative",
                                        overflow: "hidden",
                                        alignItems: "center"
                                    }}
                                >
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: offer.code ? "20px" : "0", width: "100%" }}>
                                        {/* Image */}
                                        <div style={{
                                            width: "100%",
                                            height: 140, // Large image size
                                            borderRadius: "16px",
                                            background: "#f3f4f6",
                                            overflow: "hidden",
                                            flexShrink: 0,
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                        }}>
                                            <img
                                                src={getFirebaseImageUrl(offerImg, food)}
                                                alt={offer.title}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                onError={handleImageError}
                                            />
                                        </div>

                                        <div style={{ textAlign: "center" }}>
                                            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 8px 0", color: "#0f172a", lineHeight: 1.3 }}>
                                                {offer.title}
                                            </h3>
                                            <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                                                {offer.description}
                                            </p>
                                        </div>
                                    </div>

                                    {offer.code && (
                                        <div style={{
                                            width: "100%",
                                            borderTop: "1px dashed #cbd5e1",
                                            paddingTop: "20px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "12px"
                                        }}>
                                            <div style={{
                                                padding: "10px 16px",
                                                background: "#fff7ed",
                                                borderRadius: "12px",
                                                border: "2px dashed #fdba74",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flex: 1
                                            }}>
                                                <span style={{ fontSize: "14px", color: "#ea580c", fontWeight: 800, letterSpacing: "1px" }}>
                                                    {offer.code}
                                                </span>
                                            </div>

                                            <button
                                                onClick={(e) => handleCopy(e, offer.code!, offer.id)}
                                                style={{
                                                    background: isCopied ? "#10b981" : "#ea580c",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "12px 20px",
                                                    borderRadius: "12px",
                                                    fontSize: "14px",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    transition: "background 0.2s, transform 0.1s",
                                                    transform: isCopied ? "scale(0.98)" : "scale(1)"
                                                }}
                                            >
                                                {isCopied ? <FaCheck size={16} /> : <FaCopy size={16} />}
                                                {isCopied ? "COPIED" : "COPY"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: "50%", background: "#f8fafc",
                                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
                                border: "1px dashed #cbd5e1"
                            }}>
                                <FaTags size={32} color="#94a3b8" />
                            </div>
                            <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b", margin: "0 0 10px 0" }}>No Active Deals</h3>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: 0, maxWidth: "250px" }}>Check back later for exclusive culinary treats & surprises!</p>
                        </div>
                    )}
                </div>
            </div>

            <style>
                {`
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
        </div>
    );
};

export default OffersModal;


