
import React, { useEffect, useState, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { MdRestaurantMenu, MdChevronRight } from "react-icons/md";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import food from "../assets/images/food.png";
import { getFirebaseImageUrl, handleImageError } from "../utils/imageUtils";
import { components } from "../components";
import { Loader } from "../components/Loader";
import InvalidContent from "../components/InvalidContent";
import { getCollectionById } from "../services";
import { db } from "../configs/firebaseConfig";
import { getDocs, collection, where, query } from "firebase/firestore";
import { hooks } from "../hooks";

const { useRestaurantConfig, useWindowSize } = hooks;

export const Home: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [restaurantInvalid, setRestaurantInvalid] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [validId, setValidId] = useState<string | null>(null);
    const [orderType, setOrderType] = useState<'takeaway' | 'dine-in' | null>(null);

    const { isSmallMobile } = useWindowSize();

    // Detect order type (dine-in or takeaway) based on route
    useLayoutEffect(() => {
        setOrderType(null);
        setValidId(null);

        // Empty route "/" or no QR id → invalid
        if (location.pathname === "/" || !id?.trim()) {
            setLoading(true);
            const timeout = setTimeout(() => {
                setLoading(false);
                setRestaurantInvalid(true);
                setErrorMsg("Invalid or missing restaurant QR code!");
            }, 2000);

            return () => clearTimeout(timeout);
        }

        // Check for takeaway route specifically
        if (location.pathname.startsWith("/takeaway/")) {
            setOrderType("takeaway");
            setValidId(id.trim());
            localStorage.setItem("orderType", "takeaway");
        } else {
            // All other valid ID routes are dine-in
            setOrderType("dine-in");
            setValidId(id.trim());
            localStorage.setItem("orderType", "dine-in");
        }
    }, [id, location.pathname]);

    // Validate or initialize "validId" from props or localStorage
    useEffect(() => {
        if (id) {
            setValidId(id);
        } else {
            const token = localStorage.getItem('token');
            if (token && token !== "") {
                setValidId(token);
            }
        }
    }, [id]);

    // Fetch takeaway by QR Id
    async function getTakeawayByQrId(qrId: string) {
        const q = query(collection(db, "takeaways"), where("qrcode", "==", qrId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    // Validate takeaway or dine-in QR codes
    useEffect(() => {
        if (!validId || !orderType) return;

        // Clear if switching restaurants
        const existingToken = localStorage.getItem('token')
        if (existingToken && existingToken !== validId) {
            localStorage.clear()
            window.dispatchEvent(new Event('restaurant-cleared'))
            localStorage.setItem("orderType", orderType);
        }

        // reset state before validation
        setLoading(true);
        setErrorMsg(null);
        setRestaurantInvalid(false);

        const handleInvalid = (msg: string) => {
            setErrorMsg(msg);
            setRestaurantInvalid(true);
            setLoading(false);
        };

        if (orderType === "takeaway") {
            // Handle takeaway validation
            getTakeawayByQrId(validId).then((takeawayData: any) => {

                if (!takeawayData || !takeawayData.restaurantId) {
                    handleInvalid("Not a valid takeaway id!");
                    return;
                }
                // Fetch restaurant for takeaway
                getCollectionById("restaurants", takeawayData.restaurantId).then(
                    (restaurantData: any) => {
                        if (!restaurantData) {
                            handleInvalid("Not a valid restaurant for this takeaway!");
                            return;
                        }
                        setRestaurant(restaurantData);
                        localStorage.setItem("takeaway", JSON.stringify(takeawayData));
                        localStorage.setItem("restaurant", JSON.stringify(restaurantData));
                        localStorage.setItem("token", validId);
                        window.dispatchEvent(new Event('restaurant-updated'))
                        setLoading(false);
                    }
                );
            });
        } else if (orderType === "dine-in") {
            // Fetch restaurant for dine-in
            getCollectionById("partnerqrs", validId).then((tableData: any) => {

                if (!tableData || !tableData.restaurantId) {
                    handleInvalid("Not a valid dine-in id!");
                    return;
                }
                // Fetch restaurant for dine-in
                getCollectionById("restaurants", tableData.restaurantId).then(
                    (restaurantData: any) => {
                        if (!restaurantData) {
                            handleInvalid("Not a valid restaurant for this table!");
                            return;
                        }
                        setRestaurant(restaurantData);
                        // console.log("restaurant data:", restaurantData)
                        localStorage.setItem("table", JSON.stringify(tableData));
                        localStorage.setItem("restaurant", JSON.stringify(restaurantData));
                        localStorage.setItem("token", validId);
                        window.dispatchEvent(new Event('restaurant-updated'))
                        setLoading(false);
                    }
                );
            });
        }
    }, [validId, orderType]);

    if (loading) return <Loader />;

    if (restaurantInvalid) return <InvalidContent message={errorMsg || undefined} />;

    const logoUrl = getFirebaseImageUrl(restaurant?.logo, food);

    const restaurantName = restaurant?.name || "our restaurant";

    const handleBrowseMenu = () => {
        if (orderType === 'takeaway') {
            navigate(`/takeaway/menu/${id}`);
        } else {
            navigate(`/menu/${id}`);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #ea580c 0%, #ea580c 50%, #c2410c 100%)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "24px",
                overflow: "hidden",
                position: "relative"
            }}
        >
            {/* Background Decorative Elements */}
            <div style={{
                position: "absolute",
                top: "-10%",
                left: "-10%",
                width: "300px",
                height: "300px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "50%",
                filter: "blur(80px)"
            }} />
            <div style={{
                position: "absolute",
                bottom: "-10%",
                right: "-10%",
                width: "300px",
                height: "300px",
                background: "rgba(0,0,0,0.1)",
                borderRadius: "50%",
                filter: "blur(80px)"
            }} />


            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                    width: "100%",
                    maxWidth: 420,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "40px 20px",
                    zIndex: 10
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                    style={{
                        width: isSmallMobile ? "180px" : "220px",
                        height: isSmallMobile ? "180px" : "220px",
                        borderRadius: "30px",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "40px",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                        padding: "20px"
                    }}
                >
                    <img
                        src={logoUrl}
                        alt={restaurantName}
                        onError={handleImageError}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                        }}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    <div style={{
                        background: "rgba(255,255,255,0.2)",
                        padding: "6px 16px",
                        borderRadius: "20px",
                        display: "inline-block",
                        backdropFilter: "blur(4px)",
                        marginBottom: "24px",
                        border: "1px solid rgba(255,255,255,0.3)"
                    }}>
                        <span style={{
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.7rem", // Decreased
                            textTransform: "uppercase",
                            letterSpacing: "1px"
                        }}>
                            Taste the Magic
                        </span>
                    </div>

                    <h1
                        style={{
                            fontSize: "1.8rem", // Decreased
                            fontWeight: 800,
                            color: "#fff",
                            marginBottom: "12px",
                            lineHeight: 1.1,
                            textShadow: "0 2px 10px rgba(0,0,0,0.1)"
                        }}
                    >
                        {restaurantName}
                    </h1>

                    <p
                        style={{
                            fontSize: "0.9rem", // Decreased
                            color: "rgba(255,255,255,0.9)",
                            lineHeight: 1.6,
                            marginBottom: "50px",
                            maxWidth: "300px",
                            marginInline: "auto",
                            fontWeight: 400
                        }}
                    >
                        {restaurant?.address || "Address not available"} <br />
                        <span style={{ fontSize: "0.8rem", opacity: 0.8, fontStyle: "italic" }}>
                            "Experience the best culinary delights."
                        </span>
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ width: '100%' }}
                >
                    <button
                        onClick={handleBrowseMenu}
                        style={{
                            width: "100%",
                            height: "64px",
                            fontSize: "1.2rem",
                            fontWeight: 700,
                            borderRadius: "20px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                            background: "#fff",
                            border: "none",
                            color: "#111827",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between", // Space between icon and text
                            padding: "0 24px",
                            cursor: "pointer"
                        }}
                    >
                        {/* Placeholder icon on left */}
                        <div style={{
                            width: 40, height: 40, background: "#ffedd5", borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <MdRestaurantMenu size={24} color="#ea580c" />
                        </div>

                        <span style={{ flex: 1 }}>Browse Menu</span>

                        <div style={{
                            width: 40, height: 40, background: "#f3f4f6", borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <MdChevronRight size={24} color="#111827" />
                        </div>
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
};
