
import React from 'react';
import { Button } from './Button';
import { AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';

interface CustomDialogProps {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'success';
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const icons = {
    alert: <AlertCircle className="text-red-500" size={48} />,
    confirm: <HelpCircle className="text-blue-500" size={48} />,
    success: <CheckCircle2 className="text-green-500" size={48} />
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in zoom-in duration-200">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="mb-4">{icons[type]}</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 whitespace-pre-wrap">{message}</p>
        </div>
        <div className="flex border-t border-gray-100">
          {type === 'confirm' && (
            <button 
              onClick={onCancel}
              className="flex-1 px-6 py-4 text-gray-500 font-bold hover:bg-gray-50 transition-colors border-r border-gray-100"
            >
              취소
            </button>
          )}
          <button 
            onClick={onConfirm}
            className={`flex-1 px-6 py-4 font-bold transition-colors hover:bg-gray-50 ${type === 'alert' ? 'text-red-500' : 'text-blue-600'}`}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
