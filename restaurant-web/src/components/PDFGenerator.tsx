import jsPDF from "jspdf";
import Config from "../configs/config.json";
import { loadPoppinsFont } from "../utils/poppinsFont";
import { Order } from "../types/OrderDetailsType";

const toJsDate = (ts: any): Date => {
    if (!ts) return new Date();
    if (ts instanceof Date) return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
};

export const generatePDF = async (order: Order) => {
    if (!order) return;

    const doc = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: [90, 200],
    });

    loadPoppinsFont(doc);

    let y = 8;
    const pageWidth = doc.internal.pageSize.getWidth();

    const COL_ITEM_X = 5;
    const COL_ITEM_WIDTH = 36;
    const COL_PRICE_X = 54;
    const COL_QTY_X = 66;
    const COL_TOTAL_X = pageWidth - 5;

    const restaurant = JSON.parse(
        localStorage.getItem("restaurant") || "{}"
    );

    doc.setFont("Poppins", "bold");
    doc.setFontSize(11);
    doc.text(restaurant?.name || "Restaurant", pageWidth / 2, y, {
        align: "center",
    });
    y += 5;

    doc.setFont("Poppins", "normal");
    doc.setFontSize(8);
    doc.text(
        toJsDate(order.createdAt).toLocaleString(),
        pageWidth / 2,
        y,
        { align: "center" }
    );
    y += 4;

    doc.text(
        `Order #${order.orderNumber || order.transactionId}`,
        pageWidth / 2,
        y,
        { align: "center" }
    );

    y += 4;
    doc.line(5, y, pageWidth - 5, y);
    y += 4;

    doc.setFont("Poppins", "bold");
    doc.setFontSize(8);
    doc.text("Item", COL_ITEM_X, y);
    doc.text("Price", COL_PRICE_X, y, { align: "right" });
    doc.text("Qty", COL_QTY_X, y, { align: "center" });
    doc.text("Total", COL_TOTAL_X, y, { align: "right" });

    y += 3;
    doc.line(5, y, pageWidth - 5, y);
    y += 4;

    order.items.forEach((item: any) => {
        const basePrice = Number(item.base_price || item.price || 0);
        const sidePrice = Number(item.side_choice_price || 0);
        const qty = item.quantity;
        const portion = item.portion ? `(${item.portion})` : "";
        const total = (basePrice + sidePrice) * qty;

        const sideChoice = item.additional_info?.find(
            (i: any) => i.key?.toLowerCase() === "side choices"
        );

        doc.setFont("Poppins", "bold");
        doc.setFontSize(8);
        doc.text(item.name, COL_ITEM_X, y, {
            maxWidth: COL_ITEM_WIDTH,
        });

        doc.text(
            `${order.currencySymbol}${basePrice.toFixed(2)}`,
            COL_PRICE_X,
            y,
            { align: "right" }
        );

        doc.setFont("Poppins", "normal");
        doc.text(`${qty} ${portion}`, COL_QTY_X, y, { align: "center" });

        doc.setFont("Poppins", "bold");
        doc.text(
            `${order.currencySymbol}${total.toFixed(2)}`,
            COL_TOTAL_X,
            y,
            { align: "right" }
        );

        y += 4;

        if (sideChoice?.value) {
            doc.setFont("Poppins", "normal");
            doc.setFontSize(7);
            doc.text("Side Choices", COL_ITEM_X + 2, y);
            y += 3;

            doc.text(`• ${sideChoice.value}`, COL_ITEM_X + 4, y, {
                maxWidth: COL_ITEM_WIDTH - 4,
            });

            if (sidePrice > 0) {
                doc.text(
                    `${order.currencySymbol}${sidePrice.toFixed(2)}`,
                    COL_PRICE_X,
                    y,
                    { align: "right" }
                );
            }
            y += 4;
        }

        y += 1;
    });

    y += 2;
    doc.line(5, y, pageWidth - 5, y);
    y += 4;

    doc.setFont("Poppins", "normal");
    doc.setFontSize(8);
    doc.text("Subtotal", 5, y);
    doc.text(
        `${order.currencySymbol}${order.subTotal.toFixed(2)}`,
        COL_TOTAL_X,
        y,
        { align: "right" }
    );
    y += 4;

    if (order.taxBreakdown && order.taxBreakdown.length > 0) {
        order.taxBreakdown.forEach((t: any) => {
            doc.text(t.taxName, 5, y);
            doc.text(
                `${order.currencySymbol}${Number(t.taxAmount).toFixed(2)}`,
                COL_TOTAL_X,
                y,
                { align: "right" }
            );
            y += 4;
        });
    } else if ((order as any).taxName && Number((order as any).taxValue) > 0) {
        const taxVal = Number((order as any).taxValue);
        const taxAmt = (taxVal / 100) * order.subTotal;
        doc.text(`${(order as any).taxName} (${taxVal}%)`, 5, y);
        doc.text(
            `${order.currencySymbol}${taxAmt.toFixed(2)}`,
            COL_TOTAL_X,
            y,
            { align: "right" }
        );
        y += 4;
    }

    doc.setFont("Poppins", "bold");
    doc.text("Grand Total", 5, y);
    doc.text(
        `${order.currencySymbol}${order.grandTotal.toFixed(2)}`,
        COL_TOTAL_X,
        y,
        { align: "right" }
    );

    y += 8;
    doc.setFont("Poppins", "normal");
    doc.setFontSize(7);
    doc.text("Thank you for dining with us!", pageWidth / 2, y, {
        align: "center",
    });

    y += 5;
    doc.text("Visit us again", pageWidth / 2, y, {
        align: "center",
    });

    doc.save(`order-${order.orderNumber || order.transactionId}.pdf`);
};

export default generatePDF;
