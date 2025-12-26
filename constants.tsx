
import { Device, SchoolClass } from './types';

export const COLORS = {
  primary: '#1E3A8A', // Deep Blue
  accent: '#F97316',  // Orange
  background: '#F8FAFC',
};

export const INITIAL_CLASSES: SchoolClass[] = [
  { id: '1-1', grade: 1, room: 1 },
  { id: '1-2', grade: 1, room: 2 },
  { id: '2-1', grade: 2, room: 1 },
  { id: '2-2', grade: 2, room: 2 },
];

export const INITIAL_DEVICES: Device[] = [
  {
    id: '1',
    serialNumber: 'SN-0001',
    mgmtNumber: 'TAB-2024-001',
    assignedClass: '1-1',
    classSequence: 1,
    chargeBoxNumber: 'C-01',
    googleAccount: 'student1-1-01@school.ed.kr',
    notes: '정상 작동',
  },
  {
    id: '2',
    serialNumber: 'SN-0002',
    mgmtNumber: 'TAB-2024-002',
    assignedClass: '1-1',
    classSequence: 2,
    chargeBoxNumber: 'C-01',
    googleAccount: 'student1-1-02@school.ed.kr',
    notes: '충전 케이블 접촉 불량',
  },
];
