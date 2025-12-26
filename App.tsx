import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Device, SchoolClass, AppConfig } from './types';
import { NoticeBanner } from './components/NoticeBanner';
import { DeviceTable } from './components/DeviceTable';
import { Button } from './components/Button';
import { DeviceModal } from './components/DeviceModal';
import { AdminPanel } from './components/AdminPanel';
import { QRBatchModal } from './components/QRBatchModal';
import { CustomDialog } from './components/CustomDialog';
import { 
  LogOut, Settings, Plus, Download, RefreshCw, LayoutGrid, Search,
  Lock, QrCode, Loader2, X, SlidersHorizontal, Save, Trash2, Edit, AlertCircle, ExternalLink,
  Database, Sparkles
} from 'lucide-react';
import { exportToExcel } from './utils/excelHelper';
import { db, isConfigValid } from './firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  writeBatch
} from "firebase/firestore";

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(() => (localStorage.getItem('userRole') as UserRole) || 'GUEST');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [isLoading, setIsLoading] = useState(isConfigValid);
  
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'success';
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showDialog = (type: 'alert' | 'confirm' | 'success', title: string, message: string, onConfirm?: () => void) => {
    setDialog({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loginRole, setLoginRole] = useState<UserRole | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  const [devices, setDevices] = useState<Device[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    announcement: '연결 중...',
    schoolName: '스마트기기 관리 시스템',
    isEditingInProgress: false
  });

  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('view');
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isQrBatchModalOpen, setIsQrBatchModalOpen] = useState(false);
  const [isBulkEdit, setIsBulkEdit] = useState(false);

  useEffect(() => {
    if (!isConfigValid || !db) return;

    setIsLoading(true);
    const unsubClasses = onSnapshot(collection(db, "classes"), (snap) => {
      const classData = snap.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          grade: parseInt(String(data.grade)) || 0, 
          room: parseInt(String(data.room)) || 0 
        } as SchoolClass;
      }).sort((a, b) => a.grade !== b.grade ? a.grade - b.grade : a.room - b.room);
      setClasses(classData);
    });

    const unsubDevices = onSnapshot(collection(db, "devices"), (snap) => {
      setDevices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Device)));
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setIsLoading(false);
    });

    const unsubConfig = onSnapshot(doc(db, "app_config", "main"), (snap) => {
      if (snap.exists()) setConfig(snap.data() as AppConfig);
      else {
        // 기본 설정이 없는 경우 (최초 실행)
        setConfig({
          announcement: '새로운 시스템이 시작되었습니다. 관리자 메뉴에서 정보를 설정하세요.',
          schoolName: '우리 학교 스마트기기 관리',
          isEditingInProgress: false
        });
      }
    });

    return () => { unsubClasses(); unsubDevices(); unsubConfig(); };
  }, []);

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesTab = activeTab === 'all' || device.assignedClass === activeTab;
      const matchesSearch = 
        device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.mgmtNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.googleAccount?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    }).sort((a, b) => (a.classSequence || 0) - (b.classSequence || 0));
  }, [devices, activeTab, searchQuery]);

  // 최초 데이터 초기화 함수 (데이터가 하나도 없을 때 사용)
  const initializeDatabase = async () => {
    if (!db) return;
    try {
      setIsLoading(true);
      // 1. 기본 설정 생성
      await setDoc(doc(db, "app_config", "main"), {
        schoolName: "우리 학교 스마트기기 관리",
        announcement: "관리자 메뉴에서 공지사항을 수정할 수 있습니다.",
        isEditingInProgress: false
      });
      // 2. 기본 학급 생성 (예시: 1학년 1반)
      await setDoc(doc(db, "classes", "1-1"), { grade: 1, room: 1 });
      showDialog('success', '초기화 완료', '기본 데이터가 생성되었습니다. 이제 시스템을 사용할 수 있습니다.');
    } catch (e) {
      showDialog('alert', '초기화 실패', '보안 규칙(Rules)이 "테스트 모드"인지 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConfigValid) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-gray-900">
        <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-blue-50">
          <div className="bg-[#1E3A8A] p-12 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <Database size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black mb-3">프로젝트 코드 업데이트가 필요합니다</h1>
            <p className="text-blue-100 opacity-80 leading-relaxed font-medium">
              콘솔 설정을 마치셨다면, 이제 <strong>firebaseConfig.ts</strong> 파일에<br/>
              본인의 API 키 정보를 복사해 붙여넣어야 합니다.
            </p>
          </div>
          
          <div className="p-10 space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex gap-4 items-start">
              <AlertCircle className="text-amber-500 shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-black text-amber-900 mb-1">코드가 아직 비어있습니다</h4>
                <p className="text-sm text-amber-800 leading-relaxed">
                  현재 앱의 <code>firebaseConfig.ts</code> 파일 내용이 수정되지 않아 브라우저가 본인의 Firebase 프로젝트를 찾지 못하고 있습니다. 
                  복사한 키 값을 코드 블록에 붙여넣어주세요.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <a 
                href="https://console.firebase.google.com/" 
                target="_blank" 
                className="flex items-center justify-center gap-3 w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black hover:bg-black transition-all shadow-xl group"
              >
                Firebase 콘솔로 이동하여 키 확인 <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <p className="text-center text-[11px] font-bold text-gray-400">키 값을 저에게 주시면 코드를 업데이트해 드릴 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const verifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loginRole === 'ADMIN' && passwordInput === 'admin123') {
      setRole('ADMIN'); setIsLoggedIn(true); setShowPasswordModal(false); setPasswordInput('');
      localStorage.setItem('userRole', 'ADMIN'); localStorage.setItem('isLoggedIn', 'true');
    } 
    else if ((loginRole === 'TEACHER' || loginRole === 'GUEST') && passwordInput === '1234') {
      setRole('TEACHER'); setIsLoggedIn(true); setShowPasswordModal(false); setPasswordInput('');
      localStorage.setItem('userRole', 'TEACHER'); localStorage.setItem('isLoggedIn', 'true');
    } 
    else {
      showDialog('alert', '로그인 실패', '비밀번호가 올바르지 않습니다.');
    }
  };

  const handleLogout = () => {
    setRole('GUEST');
    setIsLoggedIn(false);
    localStorage.removeItem('userRole');
    localStorage.removeItem('isLoggedIn');
  };

  const startLogin = (targetRole: UserRole) => {
    setLoginRole(targetRole);
    setPasswordInput('');
    setShowPasswordModal(true);
  };

  const handleSaveDevice = async (deviceData: Partial<Device>) => {
    if (!db) return;
    try {
      if (modalMode === 'add') {
        await addDoc(collection(db, "devices"), { ...deviceData, createdAt: new Date().toISOString() });
        showDialog('success', '등록 완료', '새 기기가 성공적으로 등록되었습니다.');
      } else if (deviceData.id) {
        const { id, ...data } = deviceData;
        await updateDoc(doc(db, "devices", id), data);
        showDialog('success', '수정 완료', '기기 정보가 업데이트되었습니다.');
      }
    } catch (e) {
      showDialog('alert', '저장 오류', '데이터베이스 권한 설정(Rules)을 확인해주세요.');
    }
  };

  const qrId = new URLSearchParams(window.location.search).get('id');
  const isReadOnlyMode = new URLSearchParams(window.location.search).get('mode') === 'readonly';

  if (isReadOnlyMode && qrId) {
    const qrDevice = devices.find(d => d.id === qrId);
    if (qrDevice) return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-gray-900">
        <CustomDialog {...dialog} onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))} />
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-[#1E3A8A] p-10 text-center text-white">
            <h1 className="text-3xl font-black mb-1">기기 상세 정보</h1>
            <p className="opacity-60 text-xs font-bold uppercase tracking-widest">{config.schoolName}</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-gray-400 font-bold">학교 관리 번호</span>
              <span className="font-black text-xl text-blue-900">{qrDevice.mgmtNumber}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-gray-400 font-bold">배부학급</span>
              <span className="font-bold text-lg">{qrDevice.assignedClass}</span>
            </div>
            <div className="bg-blue-50/50 p-6 rounded-3xl">
              <span className="text-[10px] text-blue-400 uppercase font-black block mb-2">비고(Notes)</span>
              <p className="text-gray-700 font-medium">{qrDevice.notes || "등록된 특이사항이 없습니다."}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-[#1E3A8A] flex items-center justify-center p-4">
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-sm:max-w-xs max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="px-8 py-6 bg-gray-900 text-white flex justify-between items-center">
              <h3 className="font-black text-lg">{loginRole === 'ADMIN' ? '관리자' : '교사'} 인증</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={verifyPassword} className="p-10">
              <label className="text-xs font-black text-gray-400 block mb-3 uppercase tracking-widest ml-1">Access Password</label>
              <input 
                autoFocus type="password" value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-5 mb-8 focus:border-blue-500 outline-none text-center text-3xl font-black tracking-widest" 
                placeholder="****" 
              />
              <Button type="submit" variant="primary" className="w-full py-5 rounded-2xl text-lg">로그인</Button>
            </form>
          </div>
        </div>
      )}
      <div className="bg-white rounded-[3rem] shadow-2xl p-16 w-full max-w-md text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-[#1E3A8A]"><LayoutGrid size={48} /></div>
        <h1 className="text-4xl font-black text-gray-900 mb-2">{config.schoolName}</h1>
        <p className="text-gray-400 font-medium mb-16 tracking-tight">통합 기기 관리 시스템</p>
        <div className="space-y-4">
          <button onClick={() => startLogin('ADMIN')} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-transform"><Lock size={20} /> 관리자 모드</button>
          <button onClick={() => startLogin('TEACHER')} className="w-full py-5 border-2 border-[#1E3A8A] text-[#1E3A8A] rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-50 transition-colors"><RefreshCw size={20} /> 교사 모드</button>
        </div>
        
        {/* 최초 데이터가 하나도 없을 때를 위한 안내 */}
        {role === 'GUEST' && devices.length === 0 && classes.length === 0 && (
          <div className="mt-8 pt-8 border-t border-gray-50">
            <p className="text-[11px] text-gray-400 mb-4">연결은 되었으나 데이터가 없습니다.</p>
            <button 
              onClick={initializeDatabase}
              className="text-xs font-bold text-blue-500 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <Sparkles size={14}/> 시스템 초기 데이터 생성하기
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <CustomDialog {...dialog} onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))} />
      {isLoading && <div className="fixed inset-0 z-[100] bg-white/70 flex items-center justify-center backdrop-blur-md"><Loader2 className="w-12 h-12 text-[#1E3A8A] animate-spin" /></div>}
      
      <header className="sticky top-0 z-40 bg-[#1E3A8A] text-white px-8 py-5 shadow-2xl flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl leading-tight">{config.schoolName}</h1>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Device CMS v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {role === 'ADMIN' && (
            <button 
              onClick={() => setIsAdminPanelOpen(true)} 
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-2xl transition-all font-bold text-sm"
            >
              <Settings size={18} /> 설정
            </button>
          )}
          <button onClick={handleLogout} className="p-3 hover:bg-red-500 rounded-2xl transition-colors"><LogOut size={22} /></button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <NoticeBanner content={config.announcement} />
        
        <div className="flex flex-col xl:flex-row justify-between items-stretch gap-6 mb-10 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" icon={<Plus size={18}/>} className="rounded-2xl px-6" onClick={() => { setModalMode('add'); setCurrentDevice(null); setIsDeviceModalOpen(true); }}>기기 개별 등록</Button>
            <Button variant="outline" icon={<Download size={18}/>} className="rounded-2xl px-6" onClick={() => exportToExcel(filteredDevices)}>엑셀 파일 추출</Button>
            <Button variant="outline" icon={<QrCode size={18}/>} className="rounded-2xl px-6" onClick={() => setIsQrBatchModalOpen(true)}>일괄 QR 생성</Button>
          </div>
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="시리얼, 관리번호 검색..." 
              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 focus:bg-white outline-none border-2 border-transparent focus:border-blue-500 transition-all font-medium" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        {/* 학급이 하나도 없을 때 안내 */}
        {classes.length === 0 && !isLoading && (
          <div className="bg-white rounded-[2rem] p-16 text-center border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Plus size={32} />
            </div>
            <h3 className="text-xl font-black mb-2">등록된 학급이 없습니다</h3>
            <p className="text-gray-400 mb-8">관리자 설정 메뉴에서 학급을 먼저 추가해주세요.</p>
            {role === 'ADMIN' && <Button onClick={() => setIsAdminPanelOpen(true)}>학급 설정하러 가기</Button>}
          </div>
        )}

        {classes.length > 0 && (
          <>
            <div className="mb-8 flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              <button 
                onClick={() => setActiveTab('all')} 
                className={`px-8 py-3.5 rounded-2xl font-black text-sm whitespace-nowrap transition-all shadow-sm border ${activeTab === 'all' ? 'bg-[#1E3A8A] text-white border-blue-900' : 'bg-white text-gray-400 hover:bg-gray-100 border-gray-100'}`}
              >
                전체 현황 ({devices.length})
              </button>
              {classes.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setActiveTab(c.id)} 
                  className={`px-8 py-3.5 rounded-2xl font-black text-sm whitespace-nowrap transition-all shadow-sm border ${activeTab === c.id ? 'bg-[#1E3A8A] text-white border-blue-900' : 'bg-white text-gray-400 hover:bg-gray-100 border-gray-100'}`}
                >
                  {c.grade}-{c.room}
                </button>
              ))}
            </div>

            <DeviceTable 
              devices={filteredDevices} role={role} 
              selectedIds={selectedIds} onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} 
              onSelectAll={setSelectedIds} 
              onEdit={(d) => { setCurrentDevice(d); setModalMode('edit'); setIsDeviceModalOpen(true); }} 
              onDelete={(id) => { 
                showDialog('confirm', '기기 삭제', '정말 이 기기를 삭제하시겠습니까? 데이터는 즉시 제거됩니다.', async () => {
                  try {
                    await deleteDoc(doc(db, "devices", id));
                    showDialog('success', '삭제 완료', '데이터베이스에서 제거되었습니다.');
                  } catch (e) {
                    showDialog('alert', '삭제 실패', '삭제 권한이 없거나 네트워크 오류가 발생했습니다.');
                  }
                });
              }} 
              onView={(d) => { setCurrentDevice(d); setModalMode('view'); setIsDeviceModalOpen(true); }} 
              onGenerateQr={(d) => { setCurrentDevice(d); setIsQrBatchModalOpen(true); }} 
              bulkEditMode={isBulkEdit} 
            />
          </>
        )}
      </main>

      <DeviceModal isOpen={isDeviceModalOpen} onClose={() => setIsDeviceModalOpen(false)} onSave={handleSaveDevice} device={currentDevice} mode={modalMode} classes={classes} />
      <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} classes={classes} config={config} onUpdateClasses={() => {}} onUpdateConfig={() => {}} showDialog={showDialog} />
      <QRBatchModal isOpen={isQrBatchModalOpen} onClose={() => { setIsQrBatchModalOpen(false); setCurrentDevice(null); }} devices={currentDevice ? [currentDevice] : filteredDevices} title={currentDevice ? '기기 개별 QR' : '일괄 QR'} schoolName={config.schoolName} />
    </div>
  );
};

export default App;
