import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { actions } from '../store/actions';
import { components } from '../components';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { hooks } from '../hooks';
import dayjs from 'dayjs';
import { getDocs, query, where, collection, doc, runTransaction, Timestamp, getDoc, updateDoc, addDoc } from 'firebase/firestore'
import { db } from '../configs/firebaseConfig';
import { useNavigate } from 'react-router-dom'
import { OrderCart, PlatformFeeTransaction, FilteredCartItem, WaiterType, OrderRequest, TaxBreakdownItem } from '../types';
import { Loader } from '../components/Loader'
import { BeatLoader } from "react-spinners";
import { FaArrowLeft, FaTrash, FaUtensils, FaMapMarkerAlt } from 'react-icons/fa';
import { HiOutlineTrash } from "react-icons/hi";


const { useRestaurantConfig, useOrderNavigation, useCart, useSelector } = hooks;
export const OrderHistory: React.FC = () => {

  const dispatch = hooks.useDispatch();
  const [value, setValue] = useState<string>('')
  const cachedTaxes = useSelector((state) => state.menuSlice.taxes);
  const [orderType, setOrderType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [waiter, setWaiter] = useState<WaiterType | null>(null);

  const { currency, currencyObj, walletBalance, setWalletBalance, platformFee, isLoading } = useRestaurantConfig();
  const { cart, handleItemCountChange } = useCart();
  const { navigateToOrder } = useOrderNavigation();

  // --- Validation on change ---
  const validateField = (field: string, value: string) => {
    let error = "";

    if (field === "firstName" && !value.trim()) {
      error = "First name is required";
    }
    if (field === "lastName" && !value.trim()) {
      error = "Last name is required";
    }
    if (field === "phoneNumber" && orderType === "takeaway") {
      if (!value.trim()) {
        error = "Phone number is required";
      } else if (!/^[0-9]+$/.test(value)) {
        error = "Phone number must contain only digits";
      }
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const isFormValid = () => {
    if (!firstName.trim() || !lastName.trim()) return false;
    if (orderType === "takeaway") {
      if (!phoneNumber.trim()) return false;
      if (!/^[0-9]+$/.test(phoneNumber)) return false;
    }
    return true;
  }

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value)
  }

  hooks.useThemeColor('#fff');
  const nav = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#fff'));
  }, []);

  // Fetch tax list for restaurant
  const getTaxList = async () => {

    const restaurant = localStorage.getItem("restaurant");
    const res = restaurant ? JSON.parse(restaurant) : null;
    const restaurantId = res?.id;

    const collectionRef = collection(db, 'taxes')

    const baseQuery = query(collectionRef, where('restaurantId', '==', restaurantId))
    const querySnapshot = await getDocs(baseQuery)
    const taxes: any = querySnapshot.docs.map(doc => {
      const data = doc.data()
      const { password, ...rest } = data
      return { ...rest, id: doc.id }
    })
    dispatch(actions.setTaxes(taxes))
  }

  useEffect(() => {
    getTaxList()
  }, [])

  const tableData = localStorage.getItem('table');
  const table = tableData ? JSON.parse(tableData) : null;

  // --- Price calculation per item (handles portion, price, side choices)
  const calculatePrice = (item: any) => {
    let basePrice = 0;

    if (item.portion === "quarter" && item.is_quarter_portion) {
      basePrice = Number(item.quarter_price) || 0;
    } else if (item.portion === "half" && item.is_half_portion) {
      basePrice = Number(item.half_price) || 0;
    } else if (item.portion === "full" && item.is_full_portion) {
      basePrice = Number(item.full_price) || 0;
    } else if (item.price) {
      basePrice = Number(item.price) || 0;
    }

    let sideChoicePrice = 0;
    if (Array.isArray(item.additional_info)) {
      item.additional_info.forEach((info: any) => {
        if (info.key?.toLowerCase() === "side choices" && info.include_price) {
          const priceToAdd = Number(info.price) || 0;
          sideChoicePrice += priceToAdd;
        }
      });
    }

    const total = (basePrice + sideChoicePrice) * Number(item.quantity || 1);

    return {
      basePrice: basePrice.toFixed(2),
      sideChoicePrice: sideChoicePrice.toFixed(2),
      total: isNaN(total) ? "0.00" : total.toFixed(2),
    };
  };

  // --- Tax calculation per cart (using calculatePrice)
  const taxCalculation = (cart: any[], taxList: any[]) => {
    const taxMap: any = {};
    taxList.forEach((tax: any) => {
      taxMap[tax.id] = {
        name: tax.taxName,
        value: parseFloat(tax.taxValue),
      };
    });

    let newSubtotal = 0;
    let taxAccumulator: any = {};

    cart.forEach((item: any) => {
      const { total } = calculatePrice(item);
      const itemTotal = Number(total);
      newSubtotal += itemTotal;

      // Apply taxes for this item
      if (Array.isArray(item.taxes)) {
        item.taxes.forEach((taxId: any) => {
          const taxInfo = taxMap[taxId];
          if (taxInfo) {
            const taxAmount = (itemTotal * taxInfo.value) / 100;
            taxAccumulator[taxInfo.name] =
              (taxAccumulator[taxInfo.name] || 0) + taxAmount;
          }
        });
      }
    });

    // Convert tax accumulator object → array
    const taxBreakdownArray: any[] = Object.entries(taxAccumulator).map(
      ([taxName, amount]: any) => ({
        taxName,
        taxAmount: parseFloat(Number(amount).toFixed(2)),
      })
    );

    const totalTax = parseFloat(
      taxBreakdownArray.reduce((acc, tax) => acc + tax.taxAmount, 0).toFixed(2)
    );

    const finalGrandTotal = parseFloat((newSubtotal + totalTax).toFixed(2));

    return {
      newSubtotal: parseFloat(newSubtotal.toFixed(2)),
      newTaxBreakdown: taxBreakdownArray,
      newCalculatedTax: totalTax,
      newGrandTotal: finalGrandTotal,
    };
  };

  const { subTotal, taxBreakdown, calculatedTax, grandTotal } = useMemo(() => {
    const { newSubtotal, newTaxBreakdown, newCalculatedTax, newGrandTotal } =
      taxCalculation(cart, cachedTaxes);
    return {
      subTotal: newSubtotal,
      taxBreakdown: newTaxBreakdown,
      calculatedTax: newCalculatedTax,
      grandTotal: newGrandTotal,
    };
  }, [cart, cachedTaxes]);


  const calculatePreparationTime = (items: any[]): number => {
    if (items.length === 0) return -1;

    const times = items
      .map(item => parseInt(item.estimated_time || "0", 10))
      .filter(t => !isNaN(t) && t > 0);

    if (times.length === 0) {
      return -1; // all items have 0 prep time (instant items)
    }

    if (items.length === 1) {
      return times[0];
    }

    const sum = times.reduce((acc, t) => acc + t, 0);
    return Math.round(sum / times.length);

  };

  useEffect(() => {
    if (cart?.length > 0) {
      // console.log("cart:", cart)
      const finalTime = calculatePreparationTime(cart);
      localStorage.setItem("estimated_time", finalTime.toString());
      // console.log("estimated_time:", finalTime);
    } else {
      localStorage.removeItem("estimated_time");
    }
  }, [cart]);


  // Fetch waiter (dine-in orders)
  useEffect(() => {
    const fetchWaiter = async () => {
      const storedOrderType = localStorage.getItem("orderType");
      const restaurant = localStorage.getItem("restaurant");
      const res = restaurant ? JSON.parse(restaurant) : null;

      if (!res?.id) {
        console.log("Restaurant ID missing. Cannot fetch waiter.");
        return;
      }

      let table = null;
      if (storedOrderType === "dine-in") {
        const tableData = localStorage.getItem("table");
        table = tableData ? JSON.parse(tableData) : null;
      }

      try {
        let waiterSnapshot;

        // If dine-in with table → assign waiter for table
        if (storedOrderType === "dine-in" && table?.id) {
          waiterSnapshot = await getDocs(
            query(collection(db, "waiters"), where("table", "==", table.id))
          );

          if (!waiterSnapshot.empty) {
            waiterSnapshot.forEach((doc) => {
              const data = doc.data() as { name: string };
              setWaiter({ id: doc.id, name: data.name });
            });
            return;
          }
        }
        // Otherwise → assign random waiter from restaurant
        const restaurantWaitersSnapshot = await getDocs(
          query(collection(db, "waiters"), where("restaurantId", "==", res.id))
        );

        const waiterList: WaiterType[] = [];
        restaurantWaitersSnapshot.forEach((doc) => {
          const data = doc.data() as { name: string };
          waiterList.push({ id: doc.id, name: data.name });
        });

        if (waiterList.length > 0) {
          const randomIndex = Math.floor(Math.random() * waiterList.length);
          setWaiter(waiterList[randomIndex]);
        } else {
          console.log("No waiters found for this restaurant.");
        }
      } catch (err) {
        console.error("Error fetching waiter:", err);
      }
    };

    fetchWaiter();
  }, []);

  // Add platform fee transaction log in DB
  const addPlatformFeeTransaction = async ({ restaurantId, tableId, orderId, platformFeeAmount,
  }: PlatformFeeTransaction) => {
    try {
      const platformFeeTransactionRef = collection(db, 'platform_fee_transaction');

      const data = {
        restaurantId,
        tableId,
        orderId,
        platformFeeAmount,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(platformFeeTransactionRef, data);

    } catch (error) {
      console.error(" Failed to add platform fee transaction:", error);
    }
  };

  const updatePartnerQR = async ({
    tableId,
    orderId,
    orderStatus,
    grandTotal,
  }: {
    tableId: string;
    orderId: string;
    orderStatus: number;
    grandTotal: number;
  }) => {
    const orderDetails = {
      orderId,
      orderStatus,
      createdAt: Timestamp.now(),
      currency: currencyObj,
      currencySymbol: currency,
      grandTotal,
    };

    await updateDoc(doc(db, "partnerqrs", tableId), {
      orderDetails,
    });

    // console.log("partnerqrs updated:", tableId, orderDetails);
  };

  useEffect(() => {
    const storedOrderType = localStorage.getItem("orderType");
    if (storedOrderType) {
      setOrderType(storedOrderType);
    }
  }, []);

  // Place / Update order
  const handleSubmit = async () => {
    let sessionId = localStorage.getItem("sessionId");

    if (orderType === "takeaway" && !sessionId) {
      sessionId = Math.random().toString(36).substring(2, 11);
      localStorage.setItem("sessionId", sessionId);
      console.warn("Session ID missing for takeaway order, generated a new one:", sessionId);
    }
    validateField("firstName", firstName);
    validateField("lastName", lastName);

    if (orderType === "takeaway") validateField("phoneNumber", phoneNumber);

    if (!isFormValid()) return;

    try {
      setLoading(true);

      // Validate restaurant & order type
      const restaurant = localStorage.getItem("restaurant");
      const res = restaurant ? JSON.parse(restaurant) : null;

      if (!res?.id) {
        console.error("Restaurant information is missing");
        setLoading(false);
        return;
      }

      const storedOrderType = orderType;

      let table = null;
      let takeaway: any = null;

      // Validate dine-in or takeaway
      if (storedOrderType === "dine-in") {
        const tableData = localStorage.getItem("table");
        table = tableData ? JSON.parse(tableData) : null;

        if (!table?.id || !table?.number || !table?.type) {
          console.error("Table (QR) information is missing");
          setLoading(false);
          return;
        }
      } else if (storedOrderType === "takeaway") {
        const takeawayData = localStorage.getItem("takeaway");
        takeaway = takeawayData ? JSON.parse(takeawayData) : null;

        if (!takeaway?.qrcode) {
          console.error("Takeaway (QR) information is missing");
          setLoading(false);
          return;
        }
      } else {
        console.error("Invalid order type");
        setLoading(false);
        return;
      }

      // Build cart payload for order
      const filteredCart: FilteredCartItem[] = cart.map((item) => {
        let basePrice = 0;
        if (item.portion === "full" && item.is_full_portion) {
          basePrice = parseFloat(item.full_price || "0");
        } else if (item.portion === "half" && item.is_half_portion) {
          basePrice = parseFloat(item.half_price || "0");
        } else if (item.portion === "quarter" && item.is_quarter_portion) {
          basePrice = parseFloat(item.quarter_price || "0");
        }

        let sideChoicePrice = 0;
        if (Array.isArray(item.additional_info)) {
          item.additional_info.forEach(
            (info: { key?: string; value?: string; price?: string; include_price?: boolean }) => {
              if (
                info.include_price &&
                info.key?.toLowerCase() === "side choices" &&
                info.price
              ) {
                sideChoicePrice += parseFloat(info.price);
              }
            }
          );
        }

        const finalPrice = basePrice + sideChoicePrice;

        return {
          chefId: item.chefId || null,
          estimated_time: item.estimated_time ?? 0,
          price: finalPrice.toString(),
          base_price: basePrice.toString(),
          side_choice_price: sideChoicePrice.toString(),
          id: item.id,
          images: item.images || [],
          name: item.name,
          portion: item.portion,
          quantity: item.quantity,
          type: item.type,
          veg_type: item.veg_type || null,
          taxes: Array.isArray(item.taxes) ? item.taxes : [],
          additional_info: Array.isArray(item.additional_info)
            ? item.additional_info
            : [],
        };
      });

      const finalPreparationTime = calculatePreparationTime(filteredCart);

      // Check existing active order for this table/takeaway QR
      const ordersRef = collection(db, "orders");

      let q;
      if (storedOrderType === "dine-in" && table) {
        q = query(
          ordersRef,
          where("restaurantId", "==", res.id),
          where("qrId", "==", table.id),
          where("orderStatus", "in", [0, 1])
        );
      } else if (storedOrderType === "takeaway" && takeaway) {
        q = query(
          ordersRef,
          where("restaurantId", "==", res.id),
          where("sessionId", "==", sessionId),
          where("orderStatus", "in", [0, 1])
        );
      } else {
        console.error("Invalid order type for querying orders");
        setLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);

      const shouldCreateNewOrder = querySnapshot.empty;
      const existingOrderDoc = !shouldCreateNewOrder
        ? querySnapshot.docs[0]
        : null;
      const existingOrderDocRef = existingOrderDoc
        ? doc(db, "orders", existingOrderDoc.id)
        : null;
      const existingOrderData = existingOrderDoc?.data() as OrderRequest | null;

      let orderId: string | null = null;

      if (!shouldCreateNewOrder && existingOrderDocRef && existingOrderData &&
        existingOrderData.orderStatus <= 1) {
        const existingItems = existingOrderData.items || [];
        const updatedItems = [...existingItems];

        const extractSideChoices = (infoArray?: any[]): string[] => {
          if (!Array.isArray(infoArray)) return [];
          return infoArray
            .filter((info) => info.key?.toLowerCase() === "side choices")
            .map((info) => info.value?.trim().toLowerCase() || "")
            .sort();
        };

        filteredCart.forEach((newItem) => {
          const newSideChoices = extractSideChoices(newItem.additional_info);

          const matchIndex = updatedItems.findIndex((item) => {
            const existingSideChoices = extractSideChoices(item.additional_info);

            const sameName =
              item.name.trim().toLowerCase() === newItem.name.trim().toLowerCase();
            const samePortion = item.portion === newItem.portion;
            const sameSideChoices =
              JSON.stringify(existingSideChoices) === JSON.stringify(newSideChoices);

            return sameName && samePortion && sameSideChoices;
          });

          if (matchIndex > -1 && existingOrderData.orderStatus !== 2) {
            updatedItems[matchIndex].quantity += newItem.quantity;
          } else {
            updatedItems.push(newItem);
          }
        });

        // Recalculate totals
        const itemsForCalculation = updatedItems.map((item: any) => {
          const isFull = item.portion === "full";
          const isHalf = item.portion === "half";
          const isQuarter = item.portion === "quarter";

          return {
            full_price: isFull ? item.price : "0",
            half_price: isHalf ? item.price : "0",
            quarter_price: isQuarter ? item.price : "0",
            is_full_portion: isFull,
            is_half_portion: isHalf,
            is_quarter_portion: isQuarter,
            quantity: item.quantity,
            portion: item.portion,
            taxes: item.taxes || [],
          };
        });

        const { newSubtotal, newTaxBreakdown, newCalculatedTax, newGrandTotal } =
          taxCalculation(itemsForCalculation, cachedTaxes);

        await updateDoc(existingOrderDocRef, {
          items: updatedItems,
          subTotal: newSubtotal,
          grandTotal: newGrandTotal,
          taxBreakdown: newTaxBreakdown,
          instructions: value,
        });

        orderId = existingOrderDocRef.id;

        //UPDATE partnerqrs for EXISTING dine-in orders
        if (storedOrderType === "dine-in" && table?.id) {
          await updatePartnerQR({
            tableId: table.id,
            orderId,
            orderStatus: existingOrderData.orderStatus,
            grandTotal: newGrandTotal,
          });
        }
      } else {
        // ----------------- CREATE NEW ORDER -----------------

        // handles wallet balance deduction, platform fee
        const fee = platformFee?.value ? parseFloat(platformFee.value) : 0;
        const currentBalance =
          typeof walletBalance === "number" ? walletBalance : 0;

        if (fee > currentBalance) {
          console.log("Insufficient wallet balance to cover the platform fee.");
          setLoading(false);
          return;
        }

        const newWalletBalance = currentBalance - fee;

        // update wallet in Firestore + localStorage + state
        const restaurantRef = doc(db, "restaurants", res.id);
        await updateDoc(restaurantRef, { walletBalance: newWalletBalance });

        const updatedRes = { ...res, walletBalance: newWalletBalance };
        localStorage.setItem("restaurant", JSON.stringify(updatedRes));
        setWalletBalance(newWalletBalance);

        const collectionRef = collection(db, "orders");
        const newDocRef = doc(collectionRef);

        const params: OrderRequest = {
          restaurantId: res.id,
          qrId: table?.id || takeaway?.qrcode || null,
          sessionId: storedOrderType === "takeaway" ? sessionId : null,
          qrNumber: table?.number || null,
          qrType: table?.type || null,
          orderType: storedOrderType,
          items: filteredCart,
          preparationTime: finalPreparationTime,
          subTotal,
          taxBreakdown,
          grandTotal,
          instructions: value,
          orderStatus: 0,
          paymentStatus: 0,
          createdAt: Timestamp.now(),
          transactionId: newDocRef.id,
          currency: currencyObj,
          currencySymbol: currency,
          customer:
            storedOrderType === 'dine-in'
              ? { firstName, lastName }
              : { firstName, lastName, phoneNumber },
          ...(waiter && {
            waiter,
            waiterId: waiter.id,
          }),
        };

        const counterRef = doc(db, "counters", "orders");
        const existingOrders = localStorage.getItem("orders");
        let orders = existingOrders ? JSON.parse(existingOrders) : {};

        if (storedOrderType === "dine-in" && table?.id) {
          if (orders[table.id]) {
            orders[table.id].push(newDocRef.id);
          } else {
            orders[table.id] = [newDocRef.id];
          }
        } else if (storedOrderType === "takeaway" && sessionId) {
          if (orders[sessionId]) {
            orders[sessionId].push(newDocRef.id);
          } else {
            orders[sessionId] = [newDocRef.id];
          }
        }

        localStorage.setItem("orders", JSON.stringify(orders));
        localStorage.setItem("orderId", newDocRef.id);

        await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          let newOrderNumber = 1;

          if (counterDoc.exists()) {
            newOrderNumber = counterDoc.data().latestOrderNumber + 1;
          }

          transaction.set(counterRef, { latestOrderNumber: newOrderNumber });
          transaction.set(newDocRef, { ...params, orderNumber: newOrderNumber });
        });

        orderId = newDocRef.id;

        await addPlatformFeeTransaction({
          restaurantId: res.id,
          tableId: table?.id || takeaway?.qrcode || null,
          orderId,
          platformFeeAmount: fee,
        });

        // UPDATE partnerqrs for NEW dine-in orders
        if (storedOrderType === "dine-in" && table?.id && orderId) {
          await updatePartnerQR({
            tableId: table.id,
            orderId,
            orderStatus: 0,
            grandTotal,
          });
        }

        // console.log("Order created successfully:", params)
      }

      localStorage.removeItem("cart");

      if (orderId) {
        nav(`/order-successful/${orderId}`);
      } else {
        console.error("Order ID is missing. Navigation skipped.");
      }

    } catch (error) {
      console.error("Error submitting order:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showBurger={true}
        showButton={true}
        headerStyle={{
          backgroundColor: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50
        }}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    const renderOverlay = () => (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(5px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000,
          flexDirection: 'column'
        }}
      >
        <BeatLoader color="#F97316" size={15} />
        <p
          style={{
            marginTop: "20px",
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            fontFamily: "Poppins"
          }}
        >
          Placing your order...
        </p>
      </div>
    );

    return (
      <main style={{
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#f9fafb',
        paddingTop: '80px',
        paddingBottom: '110px',
        fontFamily: 'Poppins'
      }}>
        {loading && renderOverlay()}

        <div style={{
          maxWidth: '480px',
          width: '100%',
          margin: '0 auto',
          padding: '0 20px',
        }}>

          {cart && cart.length > 0 ? (
            <>
              {/* ===== CART HEADER ===== */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Your Cart</h2>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f97316', background: '#fff7ed', padding: '4px 10px', borderRadius: '12px' }}>
                  {cart.reduce((total, item) => total + (item.quantity || 1), 0)} {cart.reduce((total, item) => total + (item.quantity || 1), 0) === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {/* ===== CART ITEMS LIST ===== */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                <AnimatePresence>
                  {cart.map((item) => {
                    const { basePrice, sideChoicePrice, total } = calculatePrice(item);

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          background: '#fff',
                          borderRadius: '20px',
                          padding: '16px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '4px' }}>
                              {item.name}
                            </h3>
                            {/* Tags / Badges */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {item.portion && (
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#EA580C', background: '#FFF7ED', padding: '2px 6px', borderRadius: '6px' }}>
                                  {item.portion}
                                </span>
                              )}
                              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
                                {currency}{basePrice}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>
                              {currency}{total}
                            </span>
                          </div>
                        </div>

                        {/* Side Choices */}
                        {Array.isArray(item.additional_info) && item.additional_info.some((info: any) => info.key?.toLowerCase() === "side choices") && (
                          <div style={{ marginTop: '8px', marginBottom: '12px', paddingLeft: '10px', borderLeft: '2px solid #F3F4F6' }}>
                            {item.additional_info
                              .filter((info: any) => info.key?.toLowerCase() === "side choices")
                              .map((info: any, idx: number) => (
                                <div key={idx} style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>
                                  • {info.value} {info.include_price && info.price ? `(+${currency}${info.price})` : ''}
                                </div>
                              ))
                            }
                          </div>
                        )}

                        <div style={{ width: '100%', height: '1px', background: '#F3F4F6', margin: '12px 0' }} />

                        {/* Actions Row */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: '#F9FAFB',
                            borderRadius: '12px',
                            padding: '4px',
                            border: '1px solid #E5E7EB'
                          }}>
                            <button
                              onClick={() => item.quantity > 1 ? handleItemCountChange(item, "decrement") : null}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: item.quantity > 1 ? '#fff' : 'transparent',
                                color: item.quantity > 1 ? '#EF4444' : '#E5E7EB', // Red delete or gray
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: item.quantity > 1 ? 'pointer' : 'default',
                                boxShadow: item.quantity > 1 ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                              }}
                            >
                              {item.quantity === 1 ? (
                                <HiOutlineTrash size={16} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => handleItemCountChange(item, "decrement")} />
                              ) : (
                                <FiMinus size={16} />
                              )}
                            </button>

                            <span style={{ width: '30px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => handleItemCountChange(item, "increment")}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#111827',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            >
                              <FiPlus size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* ===== BILL SUMMARY (Receipt Style) ===== */}
              <div style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                position: 'relative'
              }}>
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', fontWeight: 700, marginBottom: '20px' }}>
                  Bill Summary
                </h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#4B5563' }}>Item Total</span>
                  <span style={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{currency}{subTotal.toFixed(2)}</span>
                </div>

                {taxBreakdown && taxBreakdown.length > 0 && (
                  taxBreakdown.map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#4B5563' }}>{t.taxName}</span>
                      <span style={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{currency}{Number(t.taxAmount).toFixed(2)}</span>
                    </div>
                  ))
                )}

                {/* Divider */}
                <div style={{ borderBottom: '2px dashed #E5E7EB', margin: '16px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>To Pay</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{currency}{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* ===== CUSTOMER DETAILS ===== */}
              <div style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                    {orderType === 'dine-in' ? <FaUtensils size={18} /> : <FaMapMarkerAlt size={18} />}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>
                      {orderType === 'dine-in' ? 'Customer Details' : 'Takeaway Details'}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                      Please provide your details
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setErrors(prev => ({ ...prev, firstName: "" }));
                      }}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: errors.firstName ? '1px solid #EF4444' : '1px solid #E5E7EB',
                        fontSize: '13px',
                        color: '#111827',
                        outline: 'none',
                        background: '#F9FAFB'
                      }}
                      className={errors.firstName ? 'input-error' : ''}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setErrors(prev => ({ ...prev, lastName: "" }));
                      }}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: errors.lastName ? '1px solid #EF4444' : '1px solid #E5E7EB',
                        fontSize: '13px',
                        color: '#111827',
                        outline: 'none',
                        background: '#F9FAFB'
                      }}
                    />
                  </div>
                </div>

                {orderType === "takeaway" && (
                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          setPhoneNumber(val);
                          setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                        }
                      }}
                      maxLength={10}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: errors.phoneNumber ? '1px solid #EF4444' : '1px solid #E5E7EB',
                        fontSize: '13px',
                        color: '#111827',
                        outline: 'none',
                        background: '#F9FAFB'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ===== INSTRUCTIONS ===== */}
              <div style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '24px', // Standardized spacing since main has paddingBottom
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}>
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', fontWeight: 700, marginBottom: '16px' }}>
                  Cooking Instructions
                </h4>
                <textarea
                  rows={3}
                  placeholder="Add any special cooking instructions or requests..."
                  value={value}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    fontSize: '13px',
                    color: '#111827',
                    outline: 'none',
                    background: '#F9FAFB',
                    resize: 'none',
                    fontFamily: 'inherit',
                    overflowY: 'auto'
                  }}
                />
              </div>

            </>
          ) : (
            /* ===== EMPTY STATE ===== */
            <div style={{ textAlign: 'center', paddingTop: '100px', opacity: 0.6 }}>
              <div style={{ fontSize: '14px', marginBottom: '20px' }}>🛒</div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Your cart is empty</h3>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Add some delicious items from the menu to get started!</p>
              <button
                onClick={() => nav(-1)}
                style={{
                  background: '#111827',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'block',
                  margin: '0 auto'
                }}
              >
                Browse Menu
              </button>
            </div>
          )}
        </div>

        {/* ===== FIXED BOTTOM BAR ===== */}
        {cart && cart.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#fff',
            padding: '16px 24px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
            zIndex: 40,
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              paddingBottom: '8px' // Safe area adjustment
            }}>
              <button
                onClick={() => nav(-1)}
                style={{
                  height: '56px',
                  flex: 0.9,
                  borderRadius: '16px',
                  background: '#fff',
                  border: '1px solid #D1D5DB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <FiPlus size={20} />
                <span>Add More</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading || !isFormValid()}
                style={{
                  flex: 1.1,
                  height: '56px',
                  background: loading || !isFormValid() ? '#E5E7EB' : '#111827',
                  color: loading || !isFormValid() ? '#9CA3AF' : '#fff',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: loading || !isFormValid() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: loading || !isFormValid() ? 'none' : '0 8px 16px rgba(17, 24, 39, 0.2)'
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Place Order</span>
                <FaArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>
          </div>
        )}

      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
    </>
  );
};

