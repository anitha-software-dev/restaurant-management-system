// Menu type
export interface Menu {
    id: string;
    name: string;
}

// Platform fee type
export interface PlatformFee {
    value: string;
    currency: string;
}

// Cart item type
export interface Cart {
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
    taxes: string[];
}

export interface AvailabilitySlot {
    day: string;
    start: string;
    end: string;
}

export type AdditionalOption = {
    option: string;
    price?: number | string;
};


export type AdditionalInfo = {
    title: string;
    exclusive: boolean;
    include_price: boolean;
    options: AdditionalOption[];
};

// Items type
export interface Items {
    id: string;
    chefId: string | number | null;
    name: string;
    description: string;
    full_price: string;
    half_price: string;
    quarter_price: string;
    images: string[];
    estimated_time: string;
    is_full_portion: string;
    is_half_portion: string;
    is_quarter_portion: string;
    veg_type: string;
    status: number | string;
    taxes: string[];
    availability?: AvailabilitySlot[];
    additional_info?: AdditionalInfo[];
    is_bestseller?: boolean;
}
