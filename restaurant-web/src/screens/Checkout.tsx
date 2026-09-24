import React, { useEffect, useState } from 'react';

import { hooks } from '../hooks';

import { actions } from '../store/actions';
import { components } from '../components';
import dayjs from 'dayjs';
import { getCollection } from '../services';
import { collection, doc, getDocs, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../configs/firebaseConfig';
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import "jspdf-autotable"

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface Cart {
  id: number | string;
  name: string;
  full_price: string;
  half_price: string;
  quarter_price: string;
  quantity: number;
  portion: string;
  is_full_portion: string;
  is_half_portion: string;
  is_quarter_portion: string;
  estimated_time: string;
  veg_type: string;
}

export const Checkout: React.FC = () => {

  const dispatch = hooks.useDispatch();

  const nav = useNavigate()

  hooks.useThemeColor('#f2f4f4');

  const [cart, setCart] = useState<Cart[]>([]);
  const [subTotal, setSubTotal] = useState(0)
  const [taxList, setTaxList] = useState([])
  const [totalTax, setTotalTax] = useState([])
  const [grandTotal, setGrandTotal] = useState(0)

  const [isLoading, setIsLoading] = useState(false);
  const [payment, setPayment] = useState<string>('cash')

  const [taxType, setTaxType] = useState<string>('')
  const [taxPercentage, setTaxPercentage] = useState<number>(0)
  const [calculatedTax, setCalculatedTax] = useState(0);

  const [currencySymbol, setCurrencySymbol] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#f2f4f4'));
  }, []);

  const tableData = localStorage.getItem('table');
  const table = tableData ? JSON.parse(tableData) : null;

  const getTaxList = async () => {

    const restaurant = localStorage.getItem("restaurant");
    const res = restaurant ? JSON.parse(restaurant) : null;
    const restaurantId = res?.id;

    const collectionRef = collection(db, 'taxes')

    // Fetch all taxes for the current restaurant
    const baseQuery = query(collectionRef, where('restaurantId', '==', restaurantId))
    const querySnapshot = await getDocs(baseQuery)

    const taxes: any = querySnapshot.docs.map(doc => {
      const data = doc.data()
      const { password, ...rest } = data
      return { ...rest, id: doc.id }
    })
    console.log(taxes)
    setTaxList(taxes)
  }

  useEffect(() => {
    setIsLoading(true);
    getTaxList()
    getCollection("configurations")
      .then(
        (data: { id: string; tax?: { name?: string; value?: string }; currency?: { symbol?: string } }[]) => {

          if (data?.length > 0) {
            const taxConfig = data.find((item) => item.tax);
            const currencyConfig = data.find((item) => item.currency);

            if (taxConfig?.tax?.name) {
              setTaxType(taxConfig.tax.name);
            } else {
              setTaxType("")
            }
            if (taxConfig?.tax?.value) {
              const taxValue = parseFloat(taxConfig.tax.value);
              if (!isNaN(taxValue)) {
                setTaxPercentage(taxValue);
              } else {
                setTaxPercentage(0)
              }
            } else {
              setTaxPercentage(0)
            }

            if (currencyConfig?.currency?.symbol) {
              setCurrencySymbol(currencyConfig.currency.symbol);
            } else {
              setCurrencySymbol("")
            }
          } else {
            setTaxType("")
            setTaxPercentage(0)
            setCurrencySymbol("")
          }

          setIsLoading(false);
        }
      )
      .catch((error) => {
        console.error("Error fetching configurations:", error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const storedCart = localStorage.getItem("cart")
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart))
      } catch (e) {
        setCart([])
      }
    } else {
      setCart([])
    }
  }, [])

  useEffect(() => {
    const restaurant = localStorage.getItem("restaurant")
    if (restaurant) {
      try {
        const res = JSON.parse(restaurant)
        if (res?.currency?.symbol) {
          setCurrency(res.currency.symbol)
        } else {
          setCurrency("")
        }
      } catch (e) {
        setCurrency("")
      }
    } else {
      setCurrency("")
    }
  }, [])

  useEffect(() => {
    const sum = cart.reduce((accumulator, current) => {
      let price = 0;

      if (current.is_full_portion && current.portion === 'full') {
        price = Number(current.full_price);
      } else if (current.is_half_portion && current.portion === 'half') {
        price = Number(current.half_price);
      } else if (current.is_quarter_portion && current.portion === 'quarter') {
        price = Number(current.quarter_price);
      }

      const validPrice = isNaN(price) ? 0 : price;
      return accumulator + validPrice * Number(current.quantity);
    }, 0);

    const calculatedSubTotal = sum > 0 ? sum : 0;
    setSubTotal(calculatedSubTotal);

    const calculatedTax = calculatedSubTotal * (taxPercentage / 100);
    setCalculatedTax(calculatedTax);

    const calculatedGrandTotal = calculatedSubTotal + calculatedTax;
    setGrandTotal(calculatedGrandTotal);

  }, [cart, taxPercentage]);

  const smallScreen = window.innerWidth === 320 && window.innerHeight === 568;

  const handleSubmit = async () => {
    try {
      const storedOrders = localStorage.getItem('orders')

      if (storedOrders) {
        const orders = JSON.parse(storedOrders)

        const tableData = localStorage.getItem('table')
        const table = tableData ? JSON.parse(tableData) : null

        if (table && table.id) {
          const tableOrders = orders[table.id] || []

          if (tableOrders.length > 0) {
            const transactionId = tableOrders[tableOrders.length - 1]

            const params = {
              paymentMode: 'cash',
            }

            const itemRef = doc(db, 'orders', transactionId)
            await updateDoc(itemRef, params)

            // console.log('Order updated successfully:', params)
            nav('/order-successful')
          } else {
            console.log(`No orders found for table ${table.id}.`)
          }
        } else {
          console.log('Table information is missing or invalid.')
        }
      } else {
        console.log('No orders found in localStorage.')
      }
    } catch (error) {
      console.log('Error submitting order:', error)
    }
  }


  const storedOrders = localStorage.getItem('orders')

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showBurger={true}
        showButton={true}
      />
    );
  };


  const renderThankYouMessage = (): JSX.Element | null => {
    return (
      <div
        className='container'
        style={{ marginBottom: '12%', marginTop: 20 }}
      >

        <h5 style={{ textAlign: 'center', fontWeight: 800, fontSize: smallScreen ? 15 : 16 }}>Thank you for dining with us!</h5>
        <p
          className='t18'
          style={{ textAlign: 'center', marginTop: 15, fontWeight: 400, fontSize: smallScreen ? 12 : 13 }}
        >
          We hope you enjoyed your meal and had a
        </p>
        <p
          className='t18'
          style={{ textAlign: 'center', marginBottom: 0, fontWeight: 400, fontSize: smallScreen ? 12 : 13 }}
        >
          great experience. We look forward to serving
        </p>
        <p
          className='t18'
          style={{ textAlign: 'center', marginBottom: 0, fontWeight: 400, fontSize: smallScreen ? 12 : 13 }}
        >
          you again soon!
        </p>
      </div>
    );

  };

  const renderSummary = (): JSX.Element => {
    return (
      <section
        className='container'
        style={{ marginBottom: 12 }}
      >
        <div style={{
          backgroundColor: 'var(--white-color)',
          padding: '15px',
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0px 4px 4px rgba(128, 128, 128, 0.2), 0px -4px 4px rgba(128, 128, 128, 0.2), 4px 0px 4px rgba(128, 128, 128, 0.2), -4px 0px 4px rgba(128, 128, 128, 0.2)',
        }}>
          <div

            style={{ marginBottom: 6 }}
          >
            <span
              className='t16'
              style={{ fontWeight: 500, fontFamily: "Poppins", fontSize: smallScreen ? 12 : 15 }}
            >
              Total Bill - {table ? `${table.type} ${table.number}` : ""}
            </span>
            <span
              className='t16'
              style={{ marginLeft: 10, fontSize: smallScreen ? 10 : 11 }}
            >
              {dayjs().format('dddd, DD MMM YYYY')}
            </span>
          </div>
          <div
            className='row-center-space-between'
            style={{
              paddingBottom: 7,

            }}
          >
            <span className='t16' style={{ fontSize: smallScreen ? 11 : 13 }}>Sub Total Bill</span>
            <span
              className='t16'
              style={{ fontSize: smallScreen ? 12 : 14 }}
            >
              {currency ? currency : currencySymbol} {Number(subTotal).toFixed(2)}
            </span>
          </div>

          {taxPercentage > 0 && (
            <div
              className='row-center-space-between'
              style={{
                paddingBottom: 7,
              }}
            >
              <span className='t16' style={{ fontSize: smallScreen ? 11 : 13 }}>
                {`${taxPercentage}% ${taxType}`}
              </span>
              <span
                className='t16'
                style={{ fontSize: smallScreen ? 12 : 14 }}
              >
                {currency ? currency : currencySymbol} {Number(calculatedTax).toFixed(2)}
              </span>
            </div>
          )}

          <div className='row-center-space-between'>
            <span className='t16' style={{ color: '#000', fontWeight: 700, fontSize: smallScreen ? 11 : 13 }}>Grand Total</span>
            <span
              className='t16'
              style={{ color: '#000', fontWeight: 700, fontSize: smallScreen ? 12 : 14 }}
            >
              {currency ? currency : currencySymbol} {Number(grandTotal).toFixed(2)}
            </span>
          </div>

        </div>


        <div style={{ marginTop: 50, marginBottom: 150, marginLeft: 10 }}>
          <div style={{ marginBottom: 15 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                gap: 8,
                fontSize: '13px',
                fontFamily: "Poppins"
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                style={{ cursor: 'pointer', accentColor: '#f9791d' }}
                onChange={() => setPayment('cash')}
                defaultChecked
              />
              Cash
            </label>
          </div>
          <div style={{ marginBottom: 15 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                gap: 8,
                fontSize: '13px',
                fontFamily: "Poppins"
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="upi"
                style={{ cursor: 'pointer', accentColor: '#f9791d' }}
                onChange={() => setPayment('upi')}
              />
              UPI
            </label>
          </div>
          <div style={{ marginBottom: 15 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                gap: 8,
                fontSize: '13px',
                fontFamily: "Poppins"
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                style={{ cursor: 'pointer', accentColor: '#f9791d' }}
                onChange={() => setPayment('card')}
              />
              Debit / Credit Card
            </label>
          </div>
        </div>
      </section >
    );
  };


  const downloadBill = () => {
    const restaurant = localStorage.getItem("restaurant");
    const res = restaurant ? JSON.parse(restaurant) : null;
    const restaurantName = res?.name || "Restaurant Name";

    const doc = new jsPDF() as jsPDF & { lastAutoTable?: { finalY: number } };
    const tableColumn = ["Item Name", "Price (£)", "Qty", "Total (£)"];
    const tableRows: (string | number)[][] = [];

    cart.forEach((item) => {
      let price = 0;
      if (item.portion === "full" && item.is_full_portion) {
        price = parseFloat(item.full_price);
      } else if (item.portion === "half" && item.is_half_portion) {
        price = parseFloat(item.half_price);
      } else if (item.portion === "quarter" && item.is_quarter_portion) {
        price = parseFloat(item.quarter_price);
      }

      price = isNaN(price) ? 0 : price;
      const total = price * item.quantity;
      tableRows.push([item.name, Number(price).toFixed(2), item.quantity, Number(total).toFixed(2)]);
    });

    const subTotal = tableRows.reduce((acc, row) => acc + parseFloat(String(row[3])), 0);
    const gstRate = 0.12;
    const calculatedTax = subTotal * gstRate;
    const grandTotal = subTotal + calculatedTax;

    const billSummary = [
      { label: "Sub Total:", value: `£${Number(subTotal).toFixed(2)}` },
      { label: "12% GST:", value: ` £${Number(calculatedTax).toFixed(2)}` },
      { label: "Grand Total:", value: `£${Number(grandTotal).toFixed(2)}` },
    ];

    const topMargin = 20;

    doc.setFont("Poppins", "bold");
    const restaurantNameWidth = doc.getTextWidth(restaurantName);
    const pageWidth = doc.internal.pageSize.getWidth();
    const restaurantNameX = (pageWidth - restaurantNameWidth) / 2;
    doc.text(restaurantName, restaurantNameX, topMargin);

    doc.setFont("Poppins", "normal");
    const totalBillText = "Total Bill - Table 02";
    const totalBillX = 13;
    const dateText = `Date: ${dayjs().format("dddd, DD MMM YYYY")}`;
    const dateX = pageWidth - doc.getTextWidth(dateText) - 13;

    doc.text(totalBillText, totalBillX, topMargin + 10);
    doc.text(dateText, dateX, topMargin + 10);

    doc.autoTable({
      startY: topMargin + 20,
      head: [tableColumn],
      body: tableRows,
      theme: "plain",
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], font: "Poppins", fontSize: 15 },
      bodyStyles: { fontSize: 15, font: "Poppins" },
      margin: { top: 10 },
      styles: { cellPadding: 5, fontSize: 15 },
    });

    const tableEndY = doc.lastAutoTable?.finalY || 50;
    let currentY = tableEndY + 20;

    const tableX = 10;
    const tableWidth = pageWidth - 20;
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(tableX, tableEndY + 5, tableWidth, tableEndY + 5);

    const summaryColumnWidth = (pageWidth - 40) / 4;
    billSummary.forEach((item, index) => {
      const labelX = 110;
      const valueX = labelX + summaryColumnWidth;

      if (item.label === "Grand Total:") {
        doc.setFont("Poppins", "bold");
      } else {
        doc.setFont("Poppins", "normal");
      }

      const labelText = item.label;
      const valueText = item.value;

      doc.text(labelText, labelX, currentY);
      doc.text(valueText, valueX, currentY);

      currentY += 12;
    });

    doc.setLineDashPattern([2, 2], 0);
    doc.setLineWidth(0.5);
    doc.line(tableX, currentY + 5, tableWidth, currentY + 5);


    const thankYouMessageMarginTop = 10;
    currentY += thankYouMessageMarginTop;

    const thankYouMessages = [
      "Thank you for dining with us!",
      "Visit us again",
      "We hope you enjoyed your meal and had a great experience.",
      "We look forward to serving you again soon!"
    ];

    thankYouMessages.forEach((message) => {
      const messageWidth = doc.getTextWidth(message);
      const messageX = (pageWidth - messageWidth) / 2;
      currentY += 10;
      doc.text(message, messageX, currentY);
    });

    doc.save("Bill.pdf");
  }

  const renderButton = (): JSX.Element => {
    return (
      <section
        className='container'
        style={{ marginBottom: 20 }}
      >
        <components.Button
          text='Done'
          containerStyle={{
            backgroundColor: '#000',
            color: '#fff',
            textTransform: 'none',
          }}
          onClick={handleSubmit}

        />
      </section>
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{ paddingTop: 16 }}
      >

        {renderThankYouMessage()}
        {renderSummary()}
        {renderButton()}
        {/* {renderButton2()} */}
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

