// Adding the Member type definition if it doesn't exist or updating it if it does 

export interface Member {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  weight: number;
  height: number;
  trainerAssigned?: string;
  membershipStartDate: string;
  membershipEndDate: string;
  durationMonths: number;
  fees: number;
  feeStatus: 'paid' | 'due';
  photo?: string;
  status: 'active' | 'expired' | 'pending';
  slot: 'Morning' | 'Evening' | 'Free Pass';
  gymId: string;
  createdAt?: string;
  updatedAt?: string;
  lastVisit?: string;
  lastNotificationSent?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  featured?: boolean;
  gymId?: string;
}

export interface Attendance {
  _id: string;
  memberId: string;
  checkInTime: string;
  checkOutTime?: string;
  gymId?: string;
  createdAt?: string;
  updatedAt?: string;
} 