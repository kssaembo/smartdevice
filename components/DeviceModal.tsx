
import React, { useState, useEffect } from 'react';
import { Device, SchoolClass } from '../types';
import { Button } from './Button';
import { X } from 'lucide-react';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: Partial<Device>) => void;
  device?: Device | null;
  mode: 'add' | 'edit' | 'view';
  classes: SchoolClass[];
}

export const DeviceModal: React.FC<DeviceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  device,
  mode,
  classes
}) => {
  const [formData, setFormData] = useState<Partial<Device>>({
    serialNumber: '',
    mgmtNumber: '',
    assignedClass: '',
    classSequence: 1,
    chargeBoxNumber: '',
    googleAccount: '',
    notes: '',
  });

  useEffect(() => {
    if (device) {
      setFormData(device);
    } else {
      setFormData({
        serialNumber: '',
        mgmtNumber: '',
        assignedClass: classes[0]?.id || '',
        classSequence: 1,
        chargeBoxNumber: '',
        googleAccount: '',
        notes: '',
      });
    }
  }, [device, classes]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'classSequence' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const title = mode === 'add' ? '기기 개별 등록' : mode === 'edit' ? '기기 정보 수정' : '기기 상세 정보';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-[#1E3A8A] text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">시리얼 번호</label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                readOnly={mode === 'view'}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">학교 관리 번호</label>
              <input
                type="text"
                name="mgmtNumber"
                value={formData.mgmtNumber}
                onChange={handleChange}
                readOnly={mode === 'view'}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">배부학급</label>
              <select
                name="assignedClass"
                value={formData.assignedClass}
                onChange={handleChange}
                disabled={mode === 'view'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.grade}학년 {c.room}반</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">학급일련번호</label>
              <input
                type="number"
                name="classSequence"
                value={formData.classSequence}
                onChange={handleChange}
                readOnly={mode === 'view'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">충전함 번호</label>
              <input
                type="text"
                name="chargeBoxNumber"
                value={formData.chargeBoxNumber}
                onChange={handleChange}
                readOnly={mode === 'view'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">연결 구글 계정</label>
              <input
                type="email"
                name="googleAccount"
                value={formData.googleAccount}
                onChange={handleChange}
                readOnly={mode === 'view'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">비고</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              readOnly={mode === 'view'}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} type="button">닫기</Button>
            {mode !== 'view' && (
              <Button variant="primary" type="submit">저장하기</Button>
            )}
            {mode === 'view' && (
              <Button variant="secondary" onClick={() => onSave(formData)} type="button">수정 모드로 전환</Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
