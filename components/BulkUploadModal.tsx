import React, { useRef } from 'react';
import { Button } from './Button';
import { X, Download, Upload, FileText, AlertCircle } from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onUpload: (file: File) => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  onUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      onClose();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="px-8 py-6 bg-gray-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Upload size={22} className="text-blue-400" />
            <h2 className="text-xl font-black">기기 일괄 등록</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {/* 양식 다운로드 버튼 */}
            <button 
              onClick={onDownload}
              className="flex items-center gap-5 p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 rounded-3xl transition-all group text-left"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                <Download size={28} />
              </div>
              <div>
                <h4 className="font-black text-blue-900 text-lg">1. 양식 다운로드</h4>
                <p className="text-sm text-blue-700 font-medium">등록용 엑셀 파일을 내려받습니다.</p>
              </div>
            </button>

            {/* 양식 업로드 버튼 */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-5 p-6 bg-orange-50 hover:bg-orange-100 border-2 border-orange-100 rounded-3xl transition-all group text-left"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <div>
                <h4 className="font-black text-orange-900 text-lg">2. 양식 업로드</h4>
                <p className="text-sm text-orange-700 font-medium">작성한 엑셀 파일을 업로드합니다.</p>
              </div>
            </button>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl flex gap-3 items-start border border-gray-100">
            <AlertCircle size={18} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
              업로드 시 기존 데이터와 시리얼 번호가 중복되지 않도록 주의해주세요. <br/>
              배부학급 명칭(예: 3-1)이 시스템에 등록된 학급과 일치해야 합니다.
            </p>
          </div>
        </div>

        <div className="p-8 border-t bg-gray-50 flex justify-end">
          <Button variant="outline" onClick={onClose} className="px-8 rounded-2xl">취소</Button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".xlsx, .xls" 
          className="hidden" 
        />
      </div>
    </div>
  );
};
