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
  durationMonths: number;
  fees: number;
  feeStatus: 'paid' | 'due';
  photo?: string | null;
  status: 'active' | 'expired' | 'pending';
  membershipType: 'basic' | 'premium' | 'platinum';
  lastCheckIn?: string | null; 
  createdAt :string;
  
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