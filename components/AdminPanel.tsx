
import React, { useState, useEffect } from 'react';
import { SchoolClass, AppConfig } from '../types';
import { Button } from './Button';
import { Plus, Trash2, Save, X, School, Settings, LayoutGrid } from 'lucide-react';
import { db } from '../firebaseConfig';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  config: AppConfig;
  onUpdateClasses: (classes: SchoolClass[]) => void;
  onUpdateConfig: (config: AppConfig) => void;
  showDialog: (type: 'alert' | 'confirm' | 'success', title: string, message: string, onConfirm?: () => void) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  classes,
  config,
  showDialog
}) => {
  const [newGrade, setNewGrade] = useState<number>(1);
  const [newRoom, setNewRoom] = useState<number>(1);
  const [announcement, setAnnouncement] = useState(config.announcement);
  const [schoolName, setSchoolName] = useState(config.schoolName);

  useEffect(() => {
    setAnnouncement(config.announcement);
    setSchoolName(config.schoolName);
  }, [config]);

  if (!isOpen) return null;

  const handleAddClass = async () => {
    const id = `${newGrade}-${newRoom}`;
    if (classes.some(c => c.id === id)) {
      showDialog('alert', '추가 실패', '이미 존재하는 학급입니다.');
      return;
    }
    
    try {
      await setDoc(doc(db, "classes", id), {
        grade: newGrade,
        room: newRoom
      });
      showDialog('success', '학급 추가', `${newGrade}학년 ${newRoom}반이 추가되었습니다.`);
    } catch (error) {
      showDialog('alert', '오류', '학급 추가 중 서버 오류가 발생했습니다.');
    }
  };

  const handleRemoveClass = async (id: string) => {
    showDialog('confirm', '학급 삭제', `${id} 학급을 삭제하시겠습니까? 기기 데이터는 유지되지만 탭 목록에서 사라집니다.`, async () => {
      try {
        await deleteDoc(doc(db, "classes", id));
        showDialog('success', '삭제 완료', '학급이 목록에서 제거되었습니다.');
      } catch (error) {
        showDialog('alert', '오류', '삭제 중 오류가 발생했습니다.');
      }
    });
  };

  const handleSaveConfig = async () => {
    try {
      await updateDoc(doc(db, "app_config", "main"), {
        announcement,
        schoolName
      });
      showDialog('success', '저장 완료', '기본 설정(학교명, 공지사항)이 성공적으로 반영되었습니다.');
    } catch (error) {
      showDialog('alert', '저장 실패', '설정 업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
        <div className="px-8 py-6 bg-gray-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Settings size={22} className="text-blue-400" />
            <h2 className="text-2xl font-black">시스템 환경 설정</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-10 no-scrollbar">
          <section>
            <h3 className="text-sm font-black mb-4 flex items-center gap-2 text-gray-400 uppercase tracking-widest">
              <School size={16} /> SCHOOL INFO
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1">학교 이름</label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 focus:border-blue-500 outline-none bg-gray-50 transition-all font-bold text-gray-700"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="학교명을 입력하세요"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1">공지사항 내용</label>
                <textarea
                  className="w-full border-2 border-gray-100 rounded-2xl p-5 focus:border-blue-500 outline-none bg-gray-50 transition-all font-medium text-gray-600 leading-relaxed"
                  rows={3}
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="공지 내용을 입력하세요"
                />
              </div>
              <Button icon={<Save size={18}/>} onClick={handleSaveConfig} variant="primary" className="w-full py-4 rounded-2xl">기본 설정 저장</Button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black mb-4 flex items-center gap-2 text-gray-400 uppercase tracking-widest">
              <LayoutGrid size={16} /> CLASS TABS
            </h3>
            <div className="flex flex-wrap gap-3 items-end bg-blue-50/50 p-6 rounded-3xl border border-blue-100 mb-6">
              <div className="flex-1 min-w-[100px] space-y-1">
                <label className="text-[10px] font-black text-blue-400 uppercase ml-1">Grade</label>
                <select 
                  className="w-full p-3.5 rounded-xl border-none bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-400 font-bold"
                  value={newGrade}
                  onChange={(e) => setNewGrade(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}학년</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[100px] space-y-1">
                <label className="text-[10px] font-black text-blue-400 uppercase ml-1">Class</label>
                <select 
                  className="w-full p-3.5 rounded-xl border-none bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-400 font-bold"
                  value={newRoom}
                  onChange={(e) => setNewRoom(Number(e.target.value))}
                >
                  {Array.from({length: 15}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}반</option>)}
                </select>
              </div>
              <Button icon={<Plus size={18}/>} variant="secondary" onClick={handleAddClass} className="h-[52px] px-8 rounded-xl shadow-lg shadow-orange-200">학급 추가</Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {classes.map(c => (
                <div key={c.id} className="flex items-center justify-between px-5 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm group hover:border-blue-400 transition-all">
                  <span className="font-black text-gray-700">{c.grade}-{c.room}</span>
                  <button onClick={() => handleRemoveClass(c.id)} className="text-gray-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all">
                    <Trash2 size={18}/>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-8 border-t bg-gray-50 flex justify-end">
          <Button variant="outline" onClick={onClose} className="px-10 rounded-2xl">설정 닫기</Button>
        </div>
      </div>
    </div>
  );
};
