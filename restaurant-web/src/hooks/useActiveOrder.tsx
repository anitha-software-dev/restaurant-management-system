import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from '../configs/firebaseConfig'
import { Order } from "../types/OrderDetailsType";
import { hooks } from "./index";
import { actions } from "../store/actions";

export function useActiveOrder(statuses: number[] = [0, 1, 2]) {
    const dispatch = hooks.useDispatch();
    const cachedOrder = hooks.useSelector((state) => state.menuSlice.activeOrder);

    const [order, setOrder] = useState<Order | null>(cachedOrder);
    const [fetching, setFetching] = useState<boolean>(!cachedOrder);

    useEffect(() => {
        const orderType = localStorage.getItem("orderType");

        if (!orderType) {
            setOrder(null);
            setFetching(false);
            return;
        }

        const ordersRef = collection(db, "orders");
        let q;

        if (orderType === "dine-in") {
            const tableData = localStorage.getItem("table");
            const table = tableData ? JSON.parse(tableData) : null;
            const tableId = table?.id;

            if (!tableId) {
                setOrder(null);
                setFetching(false);
                return;
            }

            q = query(
                ordersRef,
                where("qrId", "==", tableId),
                where("orderStatus", "in", statuses)
            );
        } else if (orderType === "takeaway") {
            const sessionId = localStorage.getItem("sessionId");
            if (!sessionId) {
                setOrder(null);
                setFetching(false);
                return;
            }

            const takeawayData = localStorage.getItem("takeaway");
            const takeaway = takeawayData ? JSON.parse(takeawayData) : null;
            const takeawayQrId = takeaway?.qrcode;

            if (!takeawayQrId) {
                setOrder(null);
                setFetching(false);
                return;
            }

            q = query(
                ordersRef,
                where("sessionId", "==", sessionId),
                where("orderStatus", "in", statuses)
            );
        } else {
            setOrder(null);
            setFetching(false);
            return;
        }

        // Only show spinner if we don't have a cached order
        if (!order) setFetching(true);

        const stopListening = onSnapshot(
            q,
            (snapshot) => {
                if (snapshot.empty) {
                    setOrder(null);
                    dispatch(actions.setActiveOrder(null));
                } else {
                    const docData = snapshot.docs[0];
                    const rawData = { id: docData.id, ...docData.data() };
                    const orderData = JSON.parse(JSON.stringify(rawData)) as Order;
                    setOrder(orderData);
                    dispatch(actions.setActiveOrder(orderData));
                }
                setFetching(false);
            },
            (error) => {
                console.error("Error fetching order in real-time:", error);
                setOrder(null);
                setFetching(false);
            }
        );

        return () => stopListening();
    }, [statuses]);

    return { order, fetching };
}
