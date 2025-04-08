export interface Member {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  weight: number;
  height: number;
  trainerAssigned: string;
  membershipStartDate: string;
  membershipEndDate: string;
  durationMonths?: number;
  fees: number;
  feeStatus: 'paid' | 'due';
  photo?: string | null;
  status: 'active' | 'expired' | 'pending';
  slot: 'Morning' | 'Evening' | 'free pass';
  lastCheckIn?: string | null; 
  createdAt :string;
  attendance:Attendance[];
  
}

export interface DashboardStatsData {
  totalMembers: {
    count: number;
    growth: number;
  };
  activeToday: {
    count: number;
    growth: number;
  };
  newJoins: {
    count: number;
    growth: number;
  };
  expiringSoon: {
    count: number;
    growth: number;
  };
}

export interface Attendance {
  _id: string;
  memberId: string | Member;
  entryTime: string;
  exitTime?: string | null;
}

export interface CustomJwtPayload {
  id: string;
  email: string;
  role: string;
}

// Shop related interfaces
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: ProductCategory;
  images: ProductImage[];
  featuredImageId?: string;
  inventory: number;
  sold: number;
  rating: number;
  reviews?: ProductReview[];
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = 'supplements' | 'wearables' | 'equipment' | 'accessories' | 'other';

export interface ProductImage {
  publicId: string;
  url: string;
}

export interface ProductReview {
  _id: string;
  memberId: string;
  memberName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Order {
  _id: string;
  memberId: string;
  products: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  address: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet';

export interface ShippingAddress {
  name: string;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
