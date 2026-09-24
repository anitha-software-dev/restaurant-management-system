import React, { useState, useEffect } from 'react';
import { hooks } from '../hooks';
import { svg } from '../assets/svg';
import Switch from 'react-switch'
import { useNavigate } from 'react-router-dom'
import { FaClipboardList, FaSearch, FaShoppingBag } from 'react-icons/fa';

const { useOrderNavigation, useWindowSize } = hooks;

type Props = {
  showBurger?: boolean;
  showButton?: boolean;
  showSwitch?: boolean;
  headerStyle?: React.CSSProperties;
  setIsGreenToggled?: (value: boolean) => void;
  setIsRedToggled?: (value: boolean) => void;
  setIsOtherToggled?: (value: boolean) => void;
  isBlurred?: boolean;
};

export const Header: React.FC<Props> = ({
  showBurger,
  showSwitch,
  showButton,
  headerStyle,
  setIsGreenToggled,
  setIsRedToggled,
  setIsOtherToggled,
  isBlurred
}) => {

  const [isGreenToggleOn, setIsGreenToggleOn] = useState(false)
  const [isRedToggleOn, setIsRedToggleOn] = useState(false)
  const [isOtherToggleOn, setIsOtherToggleOn] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [themeColor, setThemeColor] = useState('#fff');

  const { isSmallMobile } = useWindowSize();
  hooks.useThemeColor(themeColor);

  const { navigateToOrder } = useOrderNavigation();

  const navigate = useNavigate();

  const handleTogglePopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopoverOpen(!isPopoverOpen)
  }

  useEffect(() => {
    const closeMenu = () => setIsPopoverOpen(false);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const handleOrders = () => {
    setIsPopoverOpen(false)
    navigate('/order-details')
  }

  const handleFindOrder = () => {
    setIsPopoverOpen(false)
    navigate('/find-order')
  }

  const tableData = localStorage.getItem('table');
  const table = tableData ? JSON.parse(tableData) : null;
  const orderType = localStorage.getItem('orderType');

  const handleGreenToggleChange = (checked: boolean) => {
    setIsGreenToggleOn(checked);
    if (setIsGreenToggled) {
      setIsGreenToggled(checked);
    }
  };

  const handleRedToggleChange = (checked: boolean) => {
    setIsRedToggleOn(checked);
    if (setIsRedToggled) {
      setIsRedToggled(checked);
    }
  };

  const handleOtherToggleChange = (checked: boolean) => {
    setIsOtherToggleOn(checked);
    if (setIsOtherToggled) {
      setIsOtherToggled(checked);
    }
  };

  const renderButton = (): JSX.Element | null => {
    if (!showButton) return null;

    const smallScreen = isSmallMobile;

    return (
      <div
        className='container'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '12px',
          background: '#fff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          zIndex: 1001
        }}
      >
        <div
          onClick={navigateToOrder}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: smallScreen ? '4px' : '8px',
            flexShrink: 0,
            maxWidth: smallScreen ? '80px' : 'none'
          }}
        >
          {/* {orderType === 'takeaway' && <FaShoppingBag size={smallScreen ? 12 : 14} color="#ea580c" />} */}
          <h5
            style={{
              textAlign: 'left',
              textTransform: 'capitalize',
              fontWeight: 700,
              fontSize: smallScreen ? 13 : 14,
              color: '#111827',
              margin: 0,
              letterSpacing: '-0.3px',
              lineHeight: 1.1,
              whiteSpace: smallScreen ? 'normal' : 'nowrap',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {orderType === 'takeaway' ? (smallScreen ? 'Takeaway' : 'Takeaway Order') : (table ? `${table.type} - ${table.number}` : "")}
          </h5>
        </div>

        {/* Center Section - Switches */}
        {showSwitch && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F3F4F6',
              borderRadius: '12px',
              padding: '4px',
              gap: smallScreen ? '2px' : '4px',
              marginRight: smallScreen ? '4px' : '8px',
              minHeight: smallScreen ? '32px' : '40px'
            }}
          >
            {/* Veg Switch */}
            <div
              onClick={() => handleGreenToggleChange(!isGreenToggleOn)}
              style={{
                padding: smallScreen ? '6px 8px' : '8px 12px',
                borderRadius: '8px',
                background: isGreenToggleOn ? '#10B981' : 'transparent',
                color: isGreenToggleOn ? '#fff' : '#4B5563',
                fontSize: smallScreen ? '10px' : '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isGreenToggleOn ? '0 2px 4px rgba(16, 185, 129, 0.3)' : 'none',
                letterSpacing: '0.5px',
                minWidth: smallScreen ? '40px' : '50px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              VEG
            </div>

            {/* Divider 1 */}
            <div style={{ width: '1px', height: '16px', background: '#D1D5DB', opacity: (isGreenToggleOn || isRedToggleOn) ? 0 : 1, transition: 'opacity 0.2s' }} />

            {/* Non-veg Switch */}
            <div
              onClick={() => handleRedToggleChange(!isRedToggleOn)}
              style={{
                padding: smallScreen ? '6px 8px' : '8px 12px',
                borderRadius: '8px',
                background: isRedToggleOn ? '#EF4444' : 'transparent',
                color: isRedToggleOn ? '#fff' : '#4B5563',
                fontSize: smallScreen ? '10px' : '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isRedToggleOn ? '0 2px 4px rgba(239, 68, 68, 0.3)' : 'none',
                letterSpacing: '0.5px',
                minWidth: smallScreen ? '50px' : '60px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              NON VEG
            </div>

            {/* Divider 2 */}
            <div style={{ width: '1px', height: '16px', background: '#D1D5DB', opacity: (isRedToggleOn || isOtherToggleOn) ? 0 : 1, transition: 'opacity 0.2s' }} />

            {/* Other Switch */}
            <div
              onClick={() => handleOtherToggleChange(!isOtherToggleOn)}
              style={{
                padding: smallScreen ? '6px 8px' : '8px 12px',
                borderRadius: '8px',
                background: isOtherToggleOn ? '#F59E0B' : 'transparent',
                color: isOtherToggleOn ? '#fff' : '#4B5563',
                fontSize: smallScreen ? '10px' : '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isOtherToggleOn ? '0 2px 4px rgba(245, 158, 11, 0.3)' : 'none',
                letterSpacing: '0.5px',
                minWidth: smallScreen ? '40px' : '50px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              OTHER
            </div>
          </div>
        )}

        {/* Right Section - Burger Menu */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {showBurger && (
            <div style={{ position: 'relative' }}>
              <button
                style={{
                  height: '35px',
                  width: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '1px solid #E5E7EB',
                  background: '#fff',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                onClick={handleTogglePopover}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '15px' }}>
                  <div style={{ width: '100%', height: '2px', background: '#6B7280', borderRadius: '2px' }} />
                  <div style={{ width: '100%', height: '2px', background: '#6B7280', borderRadius: '2px' }} />
                  <div style={{ width: '100%', height: '2px', background: '#6B7280', borderRadius: '2px' }} />
                </div>
              </button>

              {isPopoverOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '125%',
                    right: 0,
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                    padding: '8px',
                    minWidth: '220px',
                    zIndex: 1000,
                    border: '1px solid rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.2s ease-out'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleOrders}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '12px',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#ecfdf5',
                      borderRadius: '10px',
                      color: '#10B981' // Green for View Order
                    }}>
                      <FaClipboardList size={18} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', display: 'block' }}>View Order</span>
                      <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>Check your order status</span>
                    </div>
                  </button>

                  <button
                    onClick={handleFindOrder}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '12px',
                      transition: 'background 0.2s',
                      marginTop: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#FFF7ED',
                      borderRadius: '10px',
                      color: '#F97316' // Orange for Find Order
                    }}>
                      <FaSearch size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', display: 'block' }}>Find Order</span>
                      <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>Track using ID</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div >
    );
  };

  return (
    <header
      style={{
        position: 'relative',
        height: 'auto',
        backgroundColor: '#fff',
        ...headerStyle,
        paddingBottom: 0,
        filter: isBlurred ? 'blur(5px)' : 'none',
        pointerEvents: isBlurred ? 'none' : 'auto',
        transition: 'filter 0.3s ease'
      }}
      className='row-center-space-between'
    >
      {renderButton()}
    </header>
  );
};