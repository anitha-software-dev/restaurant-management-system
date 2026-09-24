import { useState, useEffect } from "react";

export function useCart() {
    const [cart, setCart] = useState<any[]>(() => {
        const storedCart = localStorage.getItem("cart");
        return storedCart ? JSON.parse(storedCart) : [];
    });

    // Keep cart in sync with localStorage
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    const handleItemCountChange = (item: any, action: "increment" | "decrement") => {
        if (!item || !action) return;

        setCart((prevData: any[]) => {
            const existingIndex = prevData.findIndex((obj) => obj.id === item.id);
            let updatedCart: any[] = [];

            if (existingIndex !== -1) {
                // Item exists → update quantity
                updatedCart = prevData
                    .map((cartItem, index) => {
                        if (index === existingIndex) {
                            const updatedQuantity =
                                action === "increment"
                                    ? cartItem.quantity + 1
                                    : cartItem.quantity - 1;

                            return updatedQuantity > 0
                                ? { ...cartItem, quantity: updatedQuantity }
                                : null;
                        }
                        return cartItem;
                    })
                    .filter(Boolean);
            } else {
                // Item not in cart → add with default portion
                let portion = "full";
                if (item.is_half_portion && item.half_price) portion = "half";
                else if (item.is_quarter_portion && item.quarter_price) portion = "quarter";

                const newItem: any = {
                    id: item.id,
                    chefId: item.chefId ?? null,
                    name: item.name,
                    full_price: item.full_price,
                    is_full_portion: item.is_full_portion,
                    half_price: item.half_price,
                    is_half_portion: item.is_half_portion,
                    quarter_price: item.quarter_price,
                    is_quarter_portion: item.is_quarter_portion,
                    portion,
                    estimated_time: item.estimated_time ?? 0,
                    veg_type: item.veg_type ?? null,
                    type: item.type ?? null,
                    images: item.images ?? [],
                    quantity: 1,
                    taxes: Array.isArray(item.taxes) ? item.taxes : [],
                    additional_info: item.additional_info ?? [],
                };

                updatedCart = [...prevData, newItem];
            }

            return updatedCart;
        });
    };

    return { cart, setCart, handleItemCountChange };
}
