import { useNavigate } from "react-router-dom";

const ACTIVE_ORDER_STATE = { state: { skipActiveOrderCheck: true } };

export function useOrderNavigation() {
    const nav = useNavigate();

    const navigateToOrder = () => {
        const token = localStorage.getItem("token");
        const orderType = localStorage.getItem("orderType");

        if (!token) return;

        if (orderType === "takeaway") {
            nav(`/takeaway/menu/${token}`, ACTIVE_ORDER_STATE);
        } else {
            nav(`/menu/${token}`, ACTIVE_ORDER_STATE);
        }
    };

    return { navigateToOrder };
}