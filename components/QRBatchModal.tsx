
import React, { useRef } from 'react';
import { Device } from '../types';
import { Button } from './Button';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { X, Download } from 'lucide-react';

interface QRBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  title: string;
  schoolName: string;
}

export const QRBatchModal: React.FC<QRBatchModalProps> = ({ isOpen, onClose, devices, title, schoolName }) => {
  const qrRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  if (!isOpen) return null;

  const downloadPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let x = 10;
    let y = 10;
    const itemWidth = 60;
    const itemHeight = 85;
    const gap = 10;

    devices.forEach((device, index) => {
      const canvas = qrRefs.current[device.id];
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        
        // QR Code
        pdf.addImage(imgData, 'PNG', x + 5, y + 5, 50, 50);
        
        // Texts
        pdf.setFontSize(11);
        pdf.setTextColor(0);
        // Management Number
        pdf.text(`${device.mgmtNumber}`, x + 30, y + 62, { align: 'center' });
        
        // School Name (Fixed bottom position)
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        pdf.text(`${schoolName}`, x + 30, y + 78, { align: 'center' });

        // Borders
        pdf.setDrawColor(220);
        pdf.rect(x, y, itemWidth, itemHeight);

        // Grid Logic
        x += itemWidth + gap;
        if (x + itemWidth > 200) {
          x = 10;
          y += itemHeight + gap;
        }
        if (y + itemHeight > 280) {
          if (index < devices.length - 1) {
            pdf.addPage();
            x = 10;
            y = 10;
          }
        }
      }
    });

    pdf.save(`${schoolName}_QR_Codes.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-6 py-4 bg-[#1E3A8A] text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">{title} QR 코드 미리보기 ({devices.length}건)</h2>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {devices.map(device => (
              <div key={device.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center group hover:border-blue-300 transition-colors">
                <div className="mb-4 bg-white p-2 rounded-lg border border-gray-50 group-hover:scale-105 transition-transform">
                  <QRCodeCanvas
                    value={`${window.location.origin}${window.location.pathname}?id=${device.id}&mode=readonly`}
                    size={120}
                    level="H"
                    ref={(el) => (qrRefs.current[device.id] = el)}
                  />
                </div>
                <div className="text-center w-full">
                  <div className="text-sm font-black text-gray-900 truncate mb-1">{device.mgmtNumber}</div>
                  <div className="h-px bg-gray-100 w-full my-2"></div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{schoolName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-400 font-medium">※ 라벨지 인쇄를 위한 PDF 문서가 생성됩니다.</div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">닫기</Button>
            <Button variant="primary" icon={<Download size={18}/>} onClick={downloadPDF} className="flex-1 sm:flex-initial">PDF로 일괄 저장</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
