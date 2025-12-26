
import React from 'react';
import { Device, UserRole } from '../types';
import { QrCode, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from './Button';

interface DeviceTableProps {
  devices: Device[];
  onEdit: (device: Device) => void;
  onDelete: (id: string) => void;
  onView: (device: Device) => void;
  onGenerateQr: (device: Device) => void;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  bulkEditMode: boolean;
  onBulkUpdate?: (id: string, field: keyof Device, value: any) => void;
  role: UserRole;
  isReadOnly?: boolean;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
  onEdit,
  onDelete,
  onView,
  onGenerateQr,
  selectedIds,
  onSelect,
  onSelectAll,
  bulkEditMode,
  onBulkUpdate,
  role,
  isReadOnly = false
}) => {
  const toggleSelectAll = () => {
    if (selectedIds.length === devices.length) {
      onSelectAll([]);
    } else {
      onSelectAll(devices.map(d => d.id));
    }
  };

  const renderCell = (device: Device, field: keyof Device, type: string = 'text') => {
    if (bulkEditMode && onBulkUpdate && field !== 'id') {
      return (
        <input
          type={type}
          value={device[field] as string | number}
          onChange={(e) => onBulkUpdate(device.id, field, type === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-full px-2 py-1 border border-blue-200 rounded focus:ring-2 focus:ring-blue-400 outline-none text-sm"
        />
      );
    }
    return <span className="text-gray-700">{device[field]}</span>;
  };

  return (
    <div className="overflow-hidden">
      <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {!isReadOnly && (
                <th className="px-4 py-4 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === devices.length && devices.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                </th>
              )}
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">시리얼 번호</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">관리 번호</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">학급 순번</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">충전함</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">구글 계정</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {devices.map((device) => (
              <tr key={device.id} className={`${bulkEditMode ? 'bg-blue-50/30' : 'hover:bg-gray-50'} transition-colors`}>
                {!isReadOnly && (
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(device.id)}
                      onChange={() => onSelect(device.id)}
                      className="w-5 h-5 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                  </td>
                )}
                <td className="px-6 py-4 text-sm font-medium">{renderCell(device, 'serialNumber')}</td>
                <td className="px-6 py-4 text-sm">{renderCell(device, 'mgmtNumber')}</td>
                <td className="px-6 py-4 text-sm w-24">{renderCell(device, 'classSequence', 'number')}</td>
                <td className="px-6 py-4 text-sm w-24">{renderCell(device, 'chargeBoxNumber')}</td>
                <td className="px-6 py-4 text-sm">{renderCell(device, 'googleAccount')}</td>
                <td className="px-6 py-4 text-sm font-medium">
                  {!bulkEditMode && (
                    <div className="flex space-x-1">
                      <button onClick={() => onView(device)} title="상세" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={18} /></button>
                      {!isReadOnly && (
                        <>
                          <button onClick={() => onEdit(device)} title="수정" className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit size={18} /></button>
                          <button onClick={() => onGenerateQr(device)} title="QR" className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><QrCode size={18} /></button>
                          <button onClick={() => onDelete(device.id)} title="삭제" className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {devices.map((device) => (
          <div key={device.id} className={`bg-white p-5 rounded-xl shadow-sm border ${bulkEditMode ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-3">
               <div className="flex-1 mr-2">
                 <label className="text-[10px] text-gray-400 block mb-1 uppercase">Management NO.</label>
                 {renderCell(device, 'mgmtNumber')}
               </div>
               {!isReadOnly && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(device.id)}
                  onChange={() => onSelect(device.id)}
                  className="w-6 h-6 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
               <div>
                 <label className="text-[10px] text-gray-400 block mb-1">시리얼</label>
                 {renderCell(device, 'serialNumber')}
               </div>
               <div>
                 <label className="text-[10px] text-gray-400 block mb-1">번호</label>
                 {renderCell(device, 'classSequence', 'number')}
               </div>
            </div>
            {!bulkEditMode && (
              <div className="flex space-x-2 pt-3 border-t border-gray-50">
                <Button variant="outline" size="sm" onClick={() => onView(device)} className="flex-1" icon={<Eye size={14}/>}>상세</Button>
                {!isReadOnly && <Button variant="outline" size="sm" onClick={() => onEdit(device)} className="flex-1" icon={<Edit size={14}/>}>수정</Button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
