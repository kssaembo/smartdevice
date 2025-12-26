
import { utils, writeFile, read } from 'xlsx';
import { Device } from '../types';

export const downloadTemplate = () => {
  const ws = utils.json_to_sheet([
    {
      '시리얼 번호': '',
      '학교 관리 번호': '',
      '배부학급': '1-1',
      '학급일련번호': 1,
      '충전함 번호': '',
      '연결 구글 계정': '',
      '비고': '',
    }
  ]);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'DeviceTemplate');
  writeFile(wb, 'tablet_management_template.xlsx');
};

export const exportToExcel = (devices: Device[]) => {
  const data = devices.map(d => ({
    '시리얼 번호': d.serialNumber,
    '학교 관리 번호': d.mgmtNumber,
    '배부학급': d.assignedClass,
    '학급일련번호': d.classSequence,
    '충전함 번호': d.chargeBoxNumber,
    '연결 구글 계정': d.googleAccount,
    '비고': d.notes,
  }));
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Devices');
  writeFile(wb, 'school_devices.xlsx');
};

export const readExcel = async (file: File): Promise<Partial<Device>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = utils.sheet_to_json(sheet) as any[];
        
        const devices = json.map((row, index) => ({
          id: `new-${Date.now()}-${index}`,
          serialNumber: row['시리얼 번호']?.toString() || '',
          mgmtNumber: row['학교 관리 번호']?.toString() || '',
          assignedClass: row['배부학급']?.toString() || '',
          classSequence: Number(row['학급일련번호']) || 0,
          chargeBoxNumber: row['충전함 번호']?.toString() || '',
          googleAccount: row['연결 구글 계정']?.toString() || '',
          notes: row['비고']?.toString() || '',
        }));
        resolve(devices);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
};
