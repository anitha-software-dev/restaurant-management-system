import React from 'react';
import { FaTimes } from 'react-icons/fa';
import Gallery from 'react-image-gallery';
import { Items } from '../../types/shopType';
import food from '../../assets/images/food-placeholder.jpg';

interface Props {
    open: boolean;
    item: Items | null;
    onClose: () => void;
    galleryImages: any[];
    onThumbnailClick?: (image: string) => void;
}

const DetailModal: React.FC<Props> = ({
    open,
    item,
    onClose,
    galleryImages,
    onThumbnailClick,
}) => {
    if (!open || !item) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 430,
                    height: '92%',
                    background: '#fff',
                    borderTopLeftRadius: 22,
                    borderTopRightRadius: 22,
                    boxShadow: '0 -12px 32px rgba(0,0,0,0.25)',
                    position: 'relative',
                    paddingBottom: 24,
                    animation: 'slideUp 0.35s ease',
                }}
            >

                <div style={{ display: 'flex', justifyContent: 'center', padding: '15px 0' }}>
                    <div
                        style={{
                            width: 36,
                            height: 4,
                            borderRadius: 2,
                            background: '#ddd',
                        }}
                    />
                </div>

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 36,
                        height: 36,
                        zIndex: 1000,
                        borderRadius: '50%',
                        background: '#f4f4f4',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <FaTimes />
                </button>

                <div
                    style={{
                        overflowY: 'auto',
                        height: '100%',
                        padding: '0 16px 24px',
                    }}
                >
                    <div
                        style={{
                            borderRadius: 16,
                            overflow: 'hidden',
                            marginBottom: 18,
                            marginTop: 30,
                            padding: '10px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                        }}
                    >
                        <Gallery
                            items={
                                galleryImages.length
                                    ? galleryImages
                                    : [{ original: food, thumbnail: food, onErrorImageURL: food }]
                            }
                            thumbnailPosition="bottom"
                            showFullscreenButton={false}
                            showPlayButton={false}
                            onImageError={(e: any) => {
                                if (e?.target && e.target.src !== food) {
                                    e.target.onerror = null;
                                    e.target.src = food;
                                }
                            }}
                            onThumbnailError={(e: any) => {
                                if (e?.target && e.target.src !== food) {
                                    e.target.onerror = null;
                                    e.target.src = food;
                                }
                            }}
                            onThumbnailClick={(e: any, index: number) =>
                                onThumbnailClick && onThumbnailClick(item.images?.[index])
                            }
                        />
                    </div>

                    {/* Item Title */}
                    <h3
                        style={{
                            fontSize: 18,
                            fontWeight: 600,
                            marginBottom: 8,
                            fontFamily: 'Poppins',
                        }}
                    >
                        {item.name}
                    </h3>

                    {/* Description Card */}
                    {item.description && (
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: 14,
                                marginBottom: 20,
                                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 14,
                                    fontFamily: 'Poppins',
                                    lineHeight: 1.6,
                                    color: '#555',
                                    margin: 0,
                                }}
                            >
                                {item.description}
                            </p>
                        </div>
                    )}
                </div>

                <style>{`
                    @keyframes slideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default DetailModal;
