import { useEffect, useState } from "react";
import { getCollection } from "../services";
import { PlatformFee } from "../types/shopType";

export function useRestaurantConfig() {

    const getInitialRestaurant = () => {
        const restaurant = localStorage.getItem("restaurant");
        return restaurant ? JSON.parse(restaurant) : null;
    };
    
    const initialRes = getInitialRestaurant();

    const [currencyObj, setCurrencyObj] = useState<{
        name: string;
        symbol: string;
        value: string;
    } | null>(initialRes?.currency || null);
    const [currency, setCurrency] = useState<string | null>(initialRes?.currency?.symbol || null);
    const [walletBalance, setWalletBalance] = useState<number | null>(initialRes?.walletBalance ?? null);
    const [platformFee, setPlatformFee] = useState<PlatformFee | null>(() => {
        const cachedFee = sessionStorage.getItem("platformFeeConfig");
        return cachedFee ? JSON.parse(cachedFee) : null;
    });
    const [restaurantId, setRestaurantId] = useState<string | null>(initialRes?.id || null);
    const [isLoading, setIsLoading] = useState<boolean>(() => {
        const cachedFee = sessionStorage.getItem("platformFeeConfig");
        return !cachedFee;
    });

    // --- Fetch configurations from API ---
    useEffect(() => {
        // Check session storage first for cached platform fee
        const cachedFee = sessionStorage.getItem("platformFeeConfig");
        if (cachedFee) {
            try {
                const parsedFee = JSON.parse(cachedFee);
                setPlatformFee(parsedFee);
                setIsLoading(false); // cached data available, no need to show loader
            } catch (e) {
                console.error("Error parsing cached fee", e);
            }
        }

        // Fetch fresh data in background (stale-while-revalidate)
        getCollection("configurations")
            .then(
                (
                    data: {
                        id: string;
                        platformFee?: { value?: string; currency?: string };
                    }[]
                ) => {
                    if (data?.length > 0) {

                        // Load platform fee config
                        const feeConfig = data.find(
                            (item) => item.platformFee?.value && item.platformFee?.currency
                        );
                        if (feeConfig?.platformFee) {
                            const { value, currency } = feeConfig.platformFee;
                            if (typeof value === "string" && typeof currency === "string") {
                                const newFee = { value, currency };
                                setPlatformFee(newFee);
                                sessionStorage.setItem("platformFeeConfig", JSON.stringify(newFee));
                            } else {
                                setPlatformFee(null);
                                sessionStorage.removeItem("platformFeeConfig");
                            }
                        } else {
                            setPlatformFee(null);
                            sessionStorage.removeItem("platformFeeConfig");
                        }
                    } else {
                        setPlatformFee(null);
                        sessionStorage.removeItem("platformFeeConfig");
                    }
                    setIsLoading(false);
                }
            )
            .catch((error) => {
                console.error("Error fetching configurations:", error);
                // If we have cached data, we might want to keep it, or clear it if we suspect it's invalid.
                // For resilience, if we have cache, we keep it. If not, we ensure state is null.
                if (!sessionStorage.getItem("platformFeeConfig")) {
                    setPlatformFee(null);
                }
                setIsLoading(false);
            });
    }, []);

    // --- Helper to hydrate from localStorage ---
    const hydrateFromLocalStorage = () => {
        const restaurant = localStorage.getItem("restaurant");
        const res = restaurant ? JSON.parse(restaurant) : null;

        if (res?.currency) {
            setCurrencyObj(res.currency);
            setCurrency(res.currency.symbol ?? null);
        } else {
            setCurrencyObj(null);
            setCurrency(null);
        }

        if (typeof res?.walletBalance === "number") {
            setWalletBalance(res.walletBalance);
        } else {
            setWalletBalance(null);
        }

        if (res?.id) {
            setRestaurantId(res.id);
        } else {
            setRestaurantId(null);
        }
    };

    // --- Load restaurant info from localStorage and listen for updates ---
    useEffect(() => {
        // Initial hydrate
        hydrateFromLocalStorage();

        // Listen to custom events to re-hydrate on updates
        const handleUpdate = () => hydrateFromLocalStorage();
        window.addEventListener("restaurant-updated", handleUpdate);
        window.addEventListener("restaurant-cleared", handleUpdate);

        return () => {
            window.removeEventListener("restaurant-updated", handleUpdate);
            window.removeEventListener("restaurant-cleared", handleUpdate);
        };
    }, []);

    return {
        currency,
        currencyObj,
        walletBalance,
        setWalletBalance,
        platformFee,
        restaurantId,
        isLoading,
        refreshFromLocalStorage: hydrateFromLocalStorage,
    };
}
