import React, { useState } from "react";
import { FaBell } from "react-icons/fa";
import { httpsCallable } from "firebase/functions";
import { db, functions } from '../configs/firebaseConfig'

interface CallWaiterProps {
    waiterId?: string;
    size?: "small" | "large";
    style?: React.CSSProperties;
    className?: string;
    buttonStyle?: React.CSSProperties;
}

const CallWaiter: React.FC<CallWaiterProps> = ({ waiterId, size = "large", style, className, buttonStyle }) => {
    const [isBuzzerDisabled, setIsBuzzerDisabled] = useState(false);

    const handleBuzzerClick = async () => {
        if (isBuzzerDisabled || !waiterId) {
            console.log(" Cannot call waiter. isBuzzerDisabled:", isBuzzerDisabled, "waiterId:", waiterId);
            return;
        }

        const callToWaiter = httpsCallable(functions, "callToWaiter")
        // const callToWaiter = functions.httpsCallable('callToWaiter');
        try {
            setIsBuzzerDisabled(true);

            const result = await callToWaiter({ waiterId });

            // if (result.data) {
            //     console.log("Response data:", result.data);
            // }
        } catch (error) {
            console.error("Failed to send notification:", error);
        } finally {
            setIsBuzzerDisabled(false);
        }
    };

    const defaultStyles: React.CSSProperties = {
        background: "#fdd835",
        fontFamily: "Poppins",
        border: "none",
        borderRadius: 20,
        padding: size === "large" ? "12px 20px" : "11px 22px",
        fontSize: size === "large" ? 16 : 14,
        cursor: isBuzzerDisabled ? "not-allowed" : "pointer",
        opacity: isBuzzerDisabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        ...buttonStyle
    };

    return (
        <button
            onClick={handleBuzzerClick}
            disabled={isBuzzerDisabled}
            style={{ ...defaultStyles, ...style }}
            className={className}
        >
            <FaBell style={{ marginRight: 8 }} /> Call waiter
        </button>
    );
};

export default CallWaiter;