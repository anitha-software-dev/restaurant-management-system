import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { FaWhatsapp, FaDownload, FaCheckCircle, FaClock, FaUtensils, FaArrowLeft, FaReceipt, FaFire, FaHome, FaShareAlt, FaCircle, FaShoppingBag } from 'react-icons/fa';
import { useParams } from 'react-router-dom'
import CallWaiter from '../components/CallWaiter';
import { hooks } from '../hooks';
import { actions } from '../store/actions';
import { components } from '../components';
import { RootState } from '../store';
import { db } from '../configs/firebaseConfig'
import bowl from '../assets/images/Bowl.gif';
import { useOrderNavigation } from "../hooks/useOrderNavigation";
import generatePDF from '../components/PDFGenerator';

export const OrderSuccessful: React.FC = () => {

  const dispatch = useDispatch<ThunkDispatch<RootState, void, Action>>();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>()

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<number>(0);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [tableName, setTableName] = useState<string | null>(null);

  useEffect(() => {
    const storedTable = localStorage.getItem("table");
    if (storedTable) {
      try {
        const tableData = JSON.parse(storedTable);
        setTableName(tableData.name || tableData.id || null);
      } catch (e) { }
    }
  }, []);

  const { navigateToOrder } = useOrderNavigation();

  // Use a modern dark theme or colorful gradient for the background
  hooks.useThemeColor('#1a1a2e'); // Example dark theme color for browser bar

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#1a1a2e')); // Update redux state for header color if used
  }, []);

  // Share order details via WhatsApp
  const handleWhatsAppShare = () => {
    if (!orderId) return

    const url = `${window.location.origin}/view-order/${orderId}`
    const message = `If you wish to open this order, click here:\n${url}\n\nPlease get this order on your WhatsApp. This will help you to open this interface in case you close this web interface by mistake.`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // Generate and download PDF bill
  const handleGeneratePDF = async () => {
    if (!orderData) return;
    await generatePDF(orderData);
  }

  const calculateInitialTime = (): number => {
    const storedTime = localStorage.getItem("estimated_time");
    if (!storedTime) return -1;
    const parsed = parseInt(storedTime, 10);
    if (isNaN(parsed) || parsed <= 0) return -1;
    return parsed * 60;
  };

  const formatTime = (time: number | null): string => {
    if (time === null || time < 0) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Countdown timer logic
  useEffect(() => {
    if (!orderData?.createdAt) return;

    const EXTENSION_TIME = 5 * 60;
    const initialTime = calculateInitialTime();

    if (initialTime === -1) {
      setTimeLeft(null);
      return;
    }

    const createdAtMs =
      orderData.createdAt.seconds * 1000 +
      orderData.createdAt.nanoseconds / 1_000_000;

    const tick = () => {
      if (orderStatus === 2) {
        setTimeLeft(0);
        return;
      }

      const now = Date.now();
      const elapsed = Math.floor((now - createdAtMs) / 1000);
      let lastExtensionCount = Number(localStorage.getItem("extensionCount")) || 0;
      const requiredExtensions = Math.max(0, Math.ceil((elapsed - initialTime) / EXTENSION_TIME));

      if (requiredExtensions > lastExtensionCount) {
        lastExtensionCount = requiredExtensions;
        localStorage.setItem("extensionCount", String(lastExtensionCount));
      }

      let totalAllowed = initialTime + lastExtensionCount * EXTENSION_TIME;
      let remaining = totalAllowed - elapsed;

      if (remaining <= 0) {
        lastExtensionCount += 1;
        localStorage.setItem("extensionCount", String(lastExtensionCount));
        remaining = EXTENSION_TIME;
      }

      setTimeLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [orderData?.createdAt, orderStatus]);

  // Firestore listener
  useEffect(() => {
    if (!orderId) {
      console.error("Order ID is missing.");
      return;
    }

    const orderRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOrderStatus(data.orderStatus);
        setOrderData(data);
        // console.log("orderdata:", data);

        if (data.orderStatus === 2) {
          localStorage.removeItem("estimated_time");
          localStorage.removeItem("extensionCount");
          setTimeLeft(0);
          navigateToOrder();
        }
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  const timeLabelStyle = {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: '4px',
  };

  const styles = {
    // ... previous styles merged
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fa7035 0%, #eb3369 100%)', // Vibrant orange to pink
      color: '#ffffff',
      fontFamily: "'Poppins', sans-serif",
      position: 'relative' as 'relative',
      overflowX: 'hidden' as any,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      position: 'relative' as 'relative',
      zIndex: 10,
    },
    navButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '50%',
      width: '44px',
      height: '44px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#fff',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'transform 0.2s ease',
    },
    tablePill: {
      background: 'rgba(255, 255, 255, 0.2)',
      padding: '8px 20px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '700',
      letterSpacing: '1px',
      textTransform: 'uppercase' as 'uppercase',
    },
    content: {
      padding: '10px 20px 60px',
      display: 'flex',
      flexDirection: 'column' as 'column',
      alignItems: 'center',
      gap: '20px',
      maxWidth: '600px',
      margin: '0 auto',
      position: 'relative' as 'relative',
      zIndex: 1,
      fontFamily: "'Poppins', sans-serif",
    },
    heroImageContainer: {
      position: 'relative' as 'relative',
      width: '160px',
      height: '160px',
      background: '#fff',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '40px auto 10px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      animation: 'float 6s ease-in-out infinite',
    },
    heroImage: {
      width: '110px',
      height: '110px',
      objectFit: 'contain' as 'contain',
    },
    statusBadge: {
      position: 'absolute' as 'absolute',
      bottom: '0px',
      right: '0px',
      background: '#22c55e',
      color: '#fff',
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      border: '4px solid #f14e4b', // matches surrounding gradient somewhat
    },
    title: {
      fontSize: '24px',
      fontWeight: '800',
      textAlign: 'center' as 'center',
      color: '#ffffff',
      margin: '0 0 8px',
      fontFamily: "'Poppins', sans-serif",
    },
    subtitle: {
      fontSize: '13px',
      color: '#ffe4e6',
      textAlign: 'center' as 'center',
      lineHeight: '1.5',
      maxWidth: '90%',
      margin: '0 auto',
      fontFamily: "'Poppins', sans-serif",
    },
    cardWaitTime: {
      background: '#fff',
      borderRadius: '24px',
      padding: '30px 20px',
      width: '100%',
      textAlign: 'center' as 'center',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      marginTop: '10px'
    },
    timerLabel: {
      fontSize: '14px',
      textTransform: "uppercase" as "uppercase",
      letterSpacing: '1px',
      color: '#94a3b8',
      fontWeight: '800',
      marginBottom: '15px',
    },
    timerContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: '12px',
    },
    timeValue: {
      fontSize: '52px',
      fontWeight: '800',
      color: '#ea580c',
      lineHeight: '1',
      fontFamily: "'Poppins', sans-serif", // Enforce Poppins
    },
    timeSeparator: {
      fontSize: '44px',
      fontWeight: '800',
      color: '#ea580c',
      marginTop: '-10px',
      fontFamily: "'Poppins', sans-serif",
    },
    orderNumberCard: {
      background: '#fff',
      borderRadius: '24px',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      fontFamily: "'Poppins', sans-serif",
    },
    orderLabel: {
      fontSize: '10px',
      color: '#94a3b8',
      fontWeight: '800',
      textTransform: 'uppercase' as 'uppercase',
      letterSpacing: '0.5px',
    },
    orderValue: {
      fontSize: '18px',
      fontWeight: '800',
      color: '#1e293b',
      marginTop: '2px',
    },
    statusPill: {
      background: '#ecfdf5',
      color: '#059669',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    actionButton: {
      width: '100%',
      padding: '16px',
      borderRadius: '16px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // flexDirection: 'column' as 'column',
      gap: '8px',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s',
      textAlign: 'center' as 'center',
      whiteSpace: 'pre-line' as 'pre-line', // Allow line breaks
    },
    primaryBtn: {
      background: '#fff',
      color: '#ea580c',
      flexDirection: 'row' as 'row',
      fontSize: '14px',
    },
    shareBtn: {
      background: '#22c55e',
      color: '#fff',
    },
    billBtn: {
      background: '#3b82f6',
      color: '#fff',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      width: '100%',
    }
  };

  const formattedTime = formatTime(timeLeft).split(':');

  const savedTableStr = localStorage.getItem("table");
  const savedTable = savedTableStr ? JSON.parse(savedTableStr) : null;
  const isTakeaway = orderData?.orderType === 'takeaway' || orderId?.length === 16 || localStorage.getItem('orderType') === 'takeaway';

  const locationLabel = isTakeaway ? "ORDER TYPE" : "ORDER NUMBER";
  const locationValue = isTakeaway ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* <FaShoppingBag size={18} color="#ea580c" /> */}
      <span>Takeaway</span>
    </div>
  ) : `#${orderData?.orderNumber || ''}`;

  return (
    <div style={styles.container}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          .action-btn:active { transform: scale(0.96); }
        `
      }} />

      {/* Header */}
      <components.Header
        showBurger={true}
        showButton={true}
        headerStyle={{
          backgroundColor: 'transparent',
          position: 'relative',
          zIndex: 10,
        }}
        isBlurred={false}
      />

      <div style={styles.content}>
        {/* Hero Section */}
        <div style={styles.heroImageContainer}>
          <img src={bowl} alt="Preparing Food" style={styles.heroImage} />
          <div style={styles.statusBadge}>
            <FaCheckCircle size={16} />
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <h1 style={styles.title}>
            {orderStatus === 0 && "Order Received!"}
            {orderStatus === 1 && "Cooking in Progress!"}
            {orderStatus === 2 && (isTakeaway ? "Order Ready!" : "Order Delivered!")}
          </h1>
          <p style={styles.subtitle}>
            {orderStatus === 0 && "Sit back & relax! Our chefs are checking your details."}
            {orderStatus === 1 && "Sit back & relax! Our chefs are crafting your meal with love and passion."}
            {orderStatus === 2 && (isTakeaway ? "Your order is ready for pick up. Enjoy your meal!" : "Your meal has been served. Enjoy your dining experience!")}
          </p>
        </div>

        {/* Timer Card */}
        {orderStatus !== 2 && timeLeft !== null && (
          <div style={styles.cardWaitTime}>
            <div style={styles.timerLabel}>
              WAIT TIME
            </div>

            <div style={styles.timerContainer}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={styles.timeValue}>{formattedTime[0] || "00"}</span>
                <span style={timeLabelStyle}>Min</span>
              </div>

              <span style={styles.timeSeparator}>:</span>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={styles.timeValue}>{formattedTime[1] || "00"}</span>
                <span style={timeLabelStyle}>Sec</span>
              </div>
            </div>
          </div>
        )}

        {/* Ready State */}
        {orderStatus !== 2 && timeLeft === null && (
          <div style={styles.cardWaitTime}>
            <div style={styles.timerLabel}>
              READY TO SERVE
            </div>
            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '700' }}>
              Instant Order
            </div>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
              {isTakeaway ? "We'll have it ready in no time!" : "No cooking time required. We'll bring it right out!"}
            </p>
          </div>
        )}

        {/* Order Info */}
        {orderData && (
          <div style={styles.orderNumberCard}>
            <div>
              <div style={styles.orderLabel}>{locationLabel}</div>
              <div style={styles.orderValue}>{locationValue}</div>
            </div>

            <div style={styles.statusPill}>
              <FaCircle size={8} />
              {orderStatus === 0 && "Waiting for confirmation"}
              {orderStatus === 1 && "Your order is in progress..."}
              {orderStatus === 2 && (isTakeaway ? "Picked Up" : "Delivered")}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
          {/* Row 1: Order More Items */}
          <button
            style={{ ...styles.actionButton, ...styles.primaryBtn }}
            onClick={navigateToOrder}
            className="action-btn"
          >
            <FaUtensils size={18} /> Order More Items
          </button>

          {/* Row 2: Share WhatsApp Full Width */}
          <button
            style={{ ...styles.actionButton, ...styles.shareBtn }}
            onClick={handleWhatsAppShare}
            className="action-btn"
          >
            <FaWhatsapp size={20} />
            <span>Share on Whatsapp</span>
          </button>

          {/* Row 3: Download Bill and Call Waiter Inline Side-by-Side */}
          <div style={isTakeaway ? { width: '100%' } : styles.grid}>
            <button
              style={{ ...styles.actionButton, ...styles.billBtn, padding: '16px 6px' }}
              onClick={handleGeneratePDF}
              className="action-btn"
            >
              <FaDownload size={18} />
              <span>Download Bill</span>
            </button>

            {!isTakeaway && (
              <div style={{ width: '100%' }} className="action-btn">
                <CallWaiter
                  waiterId={orderData?.waiter?.id}
                  size="large"
                  style={{ width: '100%' }}
                  buttonStyle={{
                    ...styles.actionButton,
                    width: '100%',
                    background: '#eab308',
                    color: '#713f12',
                    padding: '16px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    boxShadow: 'none', // Removed internal shadow to match grid items
                  }}
                />
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
