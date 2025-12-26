
import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface NoticeBannerProps {
  content: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ content }) => {
  return (
    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 shadow-sm rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-orange-600" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-bold text-orange-800">꼭 읽어주세요</h3>
          <div className="mt-1 text-base text-orange-700 font-medium">
            {content || "관리자가 설정한 공지사항이 여기에 표시됩니다."}
          </div>
        </div>
      </div>
    </div>
  );
};
