export interface OrderItem {
    id: string;
    name: string;
    portion: string;
    quantity: number;
    price: string;
    base_price?: string;
    side_choice_price?: string;
    images: string[];
    additional_info?: {
        key?: string;
        value?: string;
        price?: string;
        include_price?: boolean;
    }[];
}

export interface TaxBreakdownItem {
    taxName: string;
    taxAmount: number;
}

export interface CustomerInfo {
    firstName: string;
    lastName: string;
}

export interface WaiterInfo {
    id: string;
    name: string;
}

export interface Order {
    id: string;
    qrId: string;
    qrType: string;
    qrNumber: string;
    createdAt: { seconds: number; nanoseconds: number };
    grandTotal: number;
    items: OrderItem[];
    orderStatus: number;
    orderNumber: number;
    paymentMode: string;
    paymentStatus: number;
    taxBreakdown: TaxBreakdownItem[];
    subTotal: number;
    vat: string;
    vatEnabled: boolean;
    transactionId: string;
    restaurantId: string;
    currencySymbol?: string | null;
    customer?: CustomerInfo;
    waiter?: WaiterInfo;
    orderType?: 'dine-in' | 'takeaway';
}
