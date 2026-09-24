import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { Items } from '../../types/shopType';
import { components } from '../../components';

interface Props {
    open: boolean;
    item: Items | null;
    selectedPortion: string;
    onClose: () => void;
    onAdd: () => void;
    currency?: string | null;
    selectedAdditionalInfo: { [key: number]: string | string[] };
    setSelectedAdditionalInfo: (v: { [key: number]: string | string[] }) => void;
    setSelectedPortion?: (p: string) => void;
}

const cardStyle = {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    background: '#fff',
    boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
};

const sectionTitle = {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
};

const hintText = {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
};

const requiredBadge = {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 20,
    marginTop: 10,
    border: '1px solid #f9791d',
    color: '#f9791d',
    background: '#fef3f0',
};

const optionRow = (active: boolean) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: 12,
    background: active ? '#fff7ed' : '#ffffff',
    fontSize: 14,
    // border: active ? '1px solid #f9791d' : '1px solid #f3f4f6', // Removed as requested
    marginBottom: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: active ? '0 2px 4px rgba(249, 121, 29, 0.1)' : 'none' // Added subtle shadow instead
});

const priceStyle = {
    marginRight: 10,
    fontWeight: 500,
};

const ItemModal: React.FC<Props> = ({
    open,
    item,
    selectedPortion,
    onClose,
    onAdd,
    currency,
    selectedAdditionalInfo,
    setSelectedAdditionalInfo,
    setSelectedPortion,
}) => {
    if (!open || !item) return null;

    const filteredAdditionalInfo = (item.additional_info || []).filter((info: any) =>
        info?.title?.trim() && Array.isArray(info.options) && info.options.length
    );

    const handleAdditionalInfoChange = (
        infoIndex: number,
        optionLabel: string,
        isExclusive: boolean
    ) => {
        if (isExclusive) {
            setSelectedAdditionalInfo({ ...selectedAdditionalInfo, [infoIndex]: optionLabel });
        } else {
            const prev =
                Array.isArray(selectedAdditionalInfo?.[infoIndex])
                    ? [...(selectedAdditionalInfo[infoIndex] as string[])]
                    : [];
            const idx = prev.indexOf(optionLabel);
            idx > -1 ? prev.splice(idx, 1) : prev.push(optionLabel);
            setSelectedAdditionalInfo({ ...selectedAdditionalInfo, [infoIndex]: prev });
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 1100,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 430,
                    height: 'auto',
                    maxHeight: '85vh',
                    background: '#fff',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    padding: '20px 16px 0', // Removed bottom padding
                    position: 'relative',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
                    animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative' }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: -10,
                            right: 0,
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#4b5563',
                            transition: 'all 0.2s',
                        }}
                    >
                        <FaTimes size={16} />
                    </button>
                </div>


                <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4, minHeight: 0, paddingBottom: 10 }}>

                    {(item.is_full_portion || item.is_half_portion || item.is_quarter_portion) && (
                        <div style={cardStyle}>
                            <h4 style={sectionTitle}>Portion</h4>

                            {[
                                item.is_full_portion && ['Full', 'full', item.full_price],
                                item.is_half_portion && ['Half', 'half', item.half_price],
                                item.is_quarter_portion && ['Quarter', 'quarter', item.quarter_price],
                            ]
                                .filter(Boolean)
                                .map(([label, value, price]: any) => (
                                    <label key={value} style={optionRow(selectedPortion === value)}>
                                        <span>{label}</span>
                                        <div>
                                            <span style={priceStyle}>
                                                {currency} {Number(price).toFixed(2)}
                                            </span>
                                            <input
                                                type="radio"
                                                checked={selectedPortion === value}
                                                onChange={() => setSelectedPortion?.(value)}
                                                style={{ accentColor: '#f9791d' }}
                                            />
                                        </div>
                                    </label>
                                ))}
                        </div>
                    )}

                    {filteredAdditionalInfo.map((info: any, idx: number) => {
                        const titleLower = info.title?.toLowerCase() || '';
                        let isExclusive = !!info.exclusive || !!info.include_price;

                        if (titleLower.includes('spice')) {
                            isExclusive = true;
                        } else if (titleLower.includes('side')) {
                            isExclusive = false;
                        }

                        const inputType = isExclusive ? 'radio' : 'checkbox';

                        return (
                            <div key={idx} style={cardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h4 style={sectionTitle}>{info.title}</h4>
                                    <span style={requiredBadge}>Required</span>
                                </div>

                                <p style={hintText}>Select an option</p>

                                {info.options.map((opt: any, oi: number) => {
                                    const label = typeof opt === 'string' ? opt : opt.option;
                                    const price = typeof opt === 'object' ? opt.price : null;

                                    const checked = isExclusive
                                        ? selectedAdditionalInfo[idx] === label
                                        : Array.isArray(selectedAdditionalInfo[idx]) &&
                                        selectedAdditionalInfo[idx].includes(label);

                                    return (
                                        <label key={oi} style={optionRow(checked)}>
                                            <span>{label}</span>
                                            <div>
                                                {price != null && (
                                                    <span style={priceStyle}>
                                                        {currency} {Number(price).toFixed(2)}
                                                    </span>
                                                )}
                                                <input
                                                    type={inputType}
                                                    checked={checked}
                                                    onChange={() =>
                                                        handleAdditionalInfoChange(idx, label, isExclusive)
                                                    }
                                                    style={{ accentColor: '#f9791d' }}
                                                />
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                <div
                    style={{
                        padding: '16px 4px 20px',
                        background: '#fff',
                        borderTop: '1px solid #f3f4f6',
                    }}
                >
                    <components.Button text="Add Item" variant="inverse" onClick={onAdd} />
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

export default ItemModal;