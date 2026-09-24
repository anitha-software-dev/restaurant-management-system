// orderTypes.ts

import { Timestamp } from "firebase/firestore";

// --- Cart Item ---
export interface OrderCart {
    id: number | string;
    chefId: string | number | null;
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
    images: string[];
    type: string;
    taxes?: string[];
    // category: string;
    // subCategory: string;
}

// --- Filtered Cart Item ---
export type FilteredCartItem = {
    chefId: string | number | null;
    estimated_time: string | number;
    price: string;
    id: string | number;
    images: string[];
    name: string;
    portion: string;
    quantity: number;
    type: string;
    veg_type: string;
    taxes: string[];
    additional_info?: {
        key?: string;
        value?: string;
        price?: string;
        include_price?: boolean;
    }[];
};
// --- Waiter Info ---
export interface WaiterType {
    id: string;
    name: string;
}

// --- Platform Fee Transaction ---
export interface PlatformFeeTransaction {
    restaurantId: string;
    tableId: string;
    orderId: string;
    platformFeeAmount: number;
}

// --- Tax Breakdown ---
export type TaxBreakdownItem = {
    taxName: string;
    taxAmount: number;
};

interface DineInCustomer {
    firstName: string
    lastName: string
}

interface TakeawayCustomer {
    firstName: string
    lastName: string
    phoneNumber: string
}

// --- Order Request ---
export interface OrderRequest {
    restaurantId: string;
    qrId: string;
    qrNumber: string;
    qrType: string;
    sessionId?: string | null;
    items: FilteredCartItem[];
    preparationTime: number;
    subTotal: number;
    orderType: string | null;
    taxBreakdown: TaxBreakdownItem[];
    grandTotal: number;
    instructions: string;
    paymentStatus: number;
    orderStatus: number;
    createdAt: Timestamp;
    transactionId?: string;
    currencySymbol?: string | null;
    currency?: {
        name: string;
        symbol: string;
        value: string;
    } | null;
    customer: DineInCustomer | TakeawayCustomer
    waiter?: WaiterType;
    waiterId?: string;
}
