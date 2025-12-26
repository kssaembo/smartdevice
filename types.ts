
export type UserRole = 'ADMIN' | 'TEACHER' | 'GUEST';

export interface SchoolClass {
  id: string;
  grade: number;
  room: number;
}

export interface Device {
  id: string;
  serialNumber: string;
  mgmtNumber: string;
  assignedClass: string; // e.g., "1-1"
  classSequence: number;
  chargeBoxNumber: string;
  googleAccount: string;
  notes: string;
}

export interface AppConfig {
  announcement: string;
  schoolName: string;
  isEditingInProgress: boolean;
  editingUser?: string;
}

export interface AuthState {
  role: UserRole;
  isLoggedIn: boolean;
}
