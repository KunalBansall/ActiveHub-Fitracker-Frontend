/// <reference types="react" />
/// <reference types="react-dom" />

declare module 'react-datepicker';

// Additional type definitions
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  discountPrice?: number;
}

interface Attendance {
  _id: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string;
  duration?: number;
  gymId?: string;
} 