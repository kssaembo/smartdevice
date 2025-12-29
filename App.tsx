import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Device, SchoolClass, AppConfig } from './types';
import { NoticeBanner } from './components/NoticeBanner';
import { DeviceTable } from './components/DeviceTable';
import { Button } from './components/Button';
import { DeviceModal } from './components/DeviceModal';
import { AdminPanel } from './components/AdminPanel';
import { QRBatchModal } from './components/QRBatchModal';
import { CustomDialog } from './components/CustomDialog';
import { BulkUploadModal } from './components/BulkUploadModal';
import { 
  LogOut, Settings, Plus, Download, RefreshCw, LayoutGrid, Search,
  Lock, QrCode, Loader2, X, SlidersHorizontal, Save, Trash2, Edit, AlertCircle, ExternalLink,
  Database, Sparkles, Beaker, FileUp, School, ShieldAlert, Copy
} from 'lucide-react';
import { exportToExcel, downloadTemplate, readExcel } from './utils/excelHelper';
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
  const [schoolId, setSchoolId] = useState<string>(() => localStorage.getItem('schoolId') || '');
  const [role, setRole] = useState<UserRole>(() => (localStorage.getItem('userRole') as UserRole) || 'GUEST');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [isLoading, setIsLoading] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  
  const [schoolCodeInput, setSchoolCodeInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loginRole, setLoginRole] = useState<UserRole | null>(null);
  const [loginError, setLoginError] = useState('');

  const [devices, setDevices] = useState<Device[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    announcement: '',
    schoolName: '학교를 선택해주세요',
    isEditingInProgress: false
  });

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

  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('view');
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isQrBatchModalOpen, setIsQrBatchModalOpen] = useState(false);

  useEffect(() => {
    if (!isConfigValid || !db || !schoolId || !isLoggedIn) return;

    setIsLoading(true);
    setPermissionError(false);
    const schoolRef = doc(db, "schools", schoolId);
    
    const handleFirebaseError = (error: any, target: string) => {
      console.error(`Firestore ${target} Error:`, error);
      if (error.code === 'permission-denied') {
        setPermissionError(true);
      }
      setIsLoading(false);
    };

    const unsubClasses = onSnapshot(collection(schoolRef, "classes"), (snap) => {
      const classData = snap.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          grade: parseInt(String(data.grade)) || 0, 
          room: parseInt(String(data.room)) || 0 
        } as SchoolClass;
      }).sort((a, b) => a.grade !== b.grade ? a.grade - b.grade : a.room - b.room);
      setClasses(classData);
    }, (err) => handleFirebaseError(err, "Classes"));

    const unsubDevices = onSnapshot(collection(schoolRef, "devices"), (snap) => {
      setDevices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Device)));
      setIsLoading(false);
    }, (err) => handleFirebaseError(err, "Devices"));

    const unsubConfig = onSnapshot(doc(schoolRef, "config", "main"), (snap) => {
      if (snap.exists()) setConfig(snap.data() as AppConfig);
      else {
        setConfig({
          announcement: '환영합니다! 관리자 메뉴에서 학교 정보를 초기화하세요.',
          schoolName: `${schoolId.toUpperCase()} 스마트기기 관리`,
          isEditingInProgress: false
        });
      }
    }, (err) => handleFirebaseError(err, "Config"));

    return () => { unsubClasses(); unsubDevices(); unsubConfig(); };
  }, [schoolId, isLoggedIn]);

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

  const initializeTestData = async () => {
    if (!db || !schoolId) return;
    try {
      setIsLoading(true);
      const batch = writeBatch(db);
      const schoolRef = doc(db, "schools", schoolId);

      batch.set(doc(schoolRef, "config", "main"), {
        schoolName: `${schoolId.toUpperCase()} 초등학교`,
        announcement: "시스템이 성공적으로 구축되었습니다. 기기 목록을 확인하세요.",
        isEditingInProgress: false
      });

      const targetClasses = [
        { id: '3-1', grade: 3, room: 1 },
        { id: '4-1', grade: 4, room: 1 },
        { id: '5-1', grade: 5, room: 1 },
        { id: '6-1', grade: 6, room: 1 }
      ];

      targetClasses.forEach(cls => {
        batch.set(doc(schoolRef, "classes", cls.id), { grade: cls.grade, room: cls.room });
      });

      await batch.commit();
      showDialog('success', '시스템 구축 완료', `${schoolId} 학교의 기본 데이터가 생성되었습니다.`);
    } catch (e: any) {
      console.error("Init Error:", e);
      if (e.code === 'permission-denied') {
        setPermissionError(true);
      } else {
        showDialog('alert', '생성 실패', '데이터 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpload = async (file: File) => {
    if (!db || !schoolId) return;
    try {
      setIsLoading(true);
      const parsedDevices = await readExcel(file);
      const batch = writeBatch(db);
      const schoolRef = doc(db, "schools", schoolId);
      
      parsedDevices.forEach(d => {
        const { id, ...deviceData } = d;
        const newDocRef = doc(collection(schoolRef, "devices"));
        batch.set(newDocRef, { ...deviceData, createdAt: new Date().toISOString() });
      });

      await batch.commit();
      showDialog('success', '일괄 등록 완료', `${parsedDevices.length}대의 기기가 등록되었습니다.`);
    } catch (error: any) {
      console.error("Bulk Upload Error:", error);
      if (error.code === 'permission-denied') setPermissionError(true);
      else showDialog('alert', '등록 실패', '엑셀 파일 해석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const inputCode = schoolCodeInput.trim().toLowerCase();
    const inputPass = passwordInput.trim();

    if (inputCode !== 'dongan' && inputCode !== 'test') {
      setLoginError('등록되지 않은 학교 코드입니다.');
      showDialog('alert', '입력 오류', '등록되지 않은 학교 코드입니다.');
      return;
    }

    let loginSucceeded = false;
    let targetRole: UserRole = 'GUEST';

    if (loginRole === 'ADMIN') {
      if (inputPass === 'admin123') {
        loginSucceeded = true;
        targetRole = 'ADMIN';
      }
    } else if (loginRole === 'TEACHER') {
      if (inputPass === '1234' || inputPass === 'test') {
        loginSucceeded = true;
        targetRole = 'TEACHER';
      }
    }

    if (loginSucceeded) {
      setLoginError('');
      setSchoolId(inputCode);
      setRole(targetRole);
      setIsLoggedIn(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      localStorage.setItem('schoolId', inputCode);
      localStorage.setItem('userRole', targetRole);
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      setLoginError('비밀번호를 확인해주세요.');
      showDialog('alert', '로그인 실패', '비밀번호를 다시 확인해주세요.');
    }
  };

  const handleLogout = () => {
    setRole('GUEST'); setIsLoggedIn(false); setSchoolId('');
    localStorage.clear();
  };

  const startLogin = (targetRole: UserRole) => {
    setLoginRole(targetRole); 
    setPasswordInput(''); 
    setLoginError('');
    setShowPasswordModal(true);
  };

  const handleSaveDevice = async (deviceData: Partial<Device>) => {
    if (!db || !schoolId) return;
    try {
      const schoolRef = doc(db, "schools", schoolId);
      if (modalMode === 'add') {
        await addDoc(collection(schoolRef, "devices"), { ...deviceData, createdAt: new Date().toISOString() });
        showDialog('success', '등록 완료', '새 기기가 등록되었습니다.');
      } else if (deviceData.id) {
        const { id, ...data } = deviceData;
        await updateDoc(doc(schoolRef, "devices", id), data);
        showDialog('success', '수정 완료', '기기 정보가 업데이트되었습니다.');
      }
    } catch (e: any) {
      console.error("Device Save Error:", e);
      if (e.code === 'permission-denied') setPermissionError(true);
      else showDialog('alert', '저장 오류', '데이터베이스 오류가 발생했습니다.');
    }
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-[#1E3A8A] flex items-center justify-center p-4">
      <CustomDialog {...dialog} onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))} />
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-sm:max-w-xs max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="px-8 py-6 bg-gray-900 text-white flex justify-between items-center">
              <h3 className="font-black text-lg">{loginRole === 'ADMIN' ? '관리자' : '교사'} 인증</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={verifyPassword} className="p-10 space-y-6">
              <div>
                <label className="text-xs font-black text-gray-400 block mb-2 uppercase tracking-widest ml-1">School Access Code</label>
                <div className="relative">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input 
                    type="text" value={schoolCodeInput} 
                    onChange={(e) => { setSchoolCodeInput(e.target.value); setLoginError(''); }} 
                    className="w-full border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-4 focus:border-blue-500 outline-none font-bold text-gray-700" 
                    placeholder="학교 코드를 입력하세요 (dongan/test)" 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-2 uppercase tracking-widest ml-1">Access Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input 
                    autoFocus type="password" value={passwordInput} 
                    onChange={(e) => { setPasswordInput(e.target.value); setLoginError(''); }} 
                    className={`w-full border-2 rounded-2xl pl-12 pr-4 py-4 focus:border-blue-500 focus:bg-white outline-none text-2xl font-black tracking-widest transition-all ${loginError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`} 
                    placeholder="****" 
                  />
                </div>
                {loginError && (
                  <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1 animate-pulse">
                    <AlertCircle size={12} /> {loginError}
                  </p>
                )}
              </div>
              <Button type="submit" variant="primary" className="w-full py-5 rounded-2xl text-lg shadow-xl shadow-blue-100">입장하기</Button>
            </form>
          </div>
        </div>
      )}
      <div className="bg-white rounded-[3rem] shadow-2xl p-16 w-full max-w-md text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-[#1E3A8A]"><LayoutGrid size={48} /></div>
        <h1 className="text-4xl font-black text-gray-900 mb-2">스마트기기 관리</h1>
        <p className="text-gray-400 font-medium mb-16 tracking-tight">통합 기기 관리 시스템 (v2.5 Multi-School)</p>
        <div className="space-y-4">
          <button onClick={() => startLogin('ADMIN')} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-transform"><Lock size={20} /> 관리자 모드</button>
          <button onClick={() => startLogin('TEACHER')} className="w-full py-5 border-2 border-[#1E3A8A] text-[#1E3A8A] rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-50 transition-colors"><RefreshCw size={20} /> 교사 모드</button>
        </div>
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
            <School size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl leading-tight">{config.schoolName}</h1>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">School ID: {schoolId}</p>
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
        {permissionError ? (
          <div className="bg-white border-2 border-red-200 rounded-[3rem] p-12 text-center flex flex-col items-center shadow-2xl animate-in zoom-in">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-8">
              <ShieldAlert size={48} />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">Firebase 보안 규칙 수정 필요</h3>
            <p className="text-gray-500 font-medium mb-10 max-w-2xl leading-relaxed text-lg">
              현재 Firebase Console의 <strong>Firestore Database &gt; Rules</strong> 탭 설정이 <br/>
              데이터 저장 경로(<code>/schools/</code>)를 허용하지 않고 있습니다.<br/>
              아래 코드를 복사하여 Rules 탭에 붙여넣고 <strong>[게시]</strong>를 눌러주세요.
            </p>
            
            <div className="w-full max-w-xl bg-gray-900 rounded-3xl p-8 mb-10 text-left relative group">
              <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /schools/{schoolId}/{allPaths=**} {
      allow read, write: if true;
    }
  }
}`}
              </pre>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /schools/{schoolId}/{allPaths=**} {\n      allow read, write: if true;\n    }\n  }\n}`);
                  showDialog('success', '복사 완료', '규칙 코드가 클립보드에 복사되었습니다.');
                }}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all text-white flex items-center gap-2 text-xs font-bold"
              >
                <Copy size={14} /> 복사하기
              </button>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => window.location.reload()} variant="primary" className="py-5 px-12 rounded-2xl text-lg shadow-xl shadow-blue-100">설정 완료 후 새로고침</Button>
              <Button onClick={() => setPermissionError(false)} variant="outline" className="py-5 px-8 rounded-2xl text-lg">닫기</Button>
            </div>
          </div>
        ) : (
          <>
            <NoticeBanner content={config.announcement} />
            
            <div className="flex flex-col xl:flex-row justify-between items-stretch gap-6 mb-10 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" icon={<Plus size={18}/>} className="rounded-2xl px-6" onClick={() => { setModalMode('add'); setCurrentDevice(null); setIsDeviceModalOpen(true); }}>기기 개별 등록</Button>
                <Button variant="secondary" icon={<FileUp size={18}/>} className="rounded-2xl px-6" onClick={() => setIsBulkUploadModalOpen(true)}>일괄 등록</Button>
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

            {devices.length === 0 && classes.length === 0 && !isLoading ? (
              <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-blue-100 flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6">
                  <Sparkles size={40} />
                </div>
                <h3 className="text-2xl font-black mb-2">{schoolId} 학교의 첫 데이터가 없습니다</h3>
                <p className="text-gray-400 mb-10 max-w-sm mx-auto">
                  현재 이 학교 코드로 등록된 기기 정보가 없습니다. 관리자라면 아래 버튼을 눌러 즉시 기초 데이터를 생성할 수 있습니다.
                </p>
                <Button onClick={initializeTestData} className="py-4 px-10 rounded-2xl text-lg" icon={<Beaker size={20}/>}>
                  테스트 데이터로 즉시 구축하기
                </Button>
              </div>
            ) : (
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
                    showDialog('confirm', '기기 삭제', '정말 삭제하시겠습니까?', async () => {
                      try {
                        await deleteDoc(doc(db, "schools", schoolId, "devices", id));
                        showDialog('success', '삭제 완료', '데이터베이스에서 제거되었습니다.');
                      } catch (e: any) {
                        if (e.code === 'permission-denied') setPermissionError(true);
                        else showDialog('alert', '삭제 실패', '서버 오류가 발생했습니다.');
                      }
                    });
                  }} 
                  onView={(d) => { setCurrentDevice(d); setModalMode('view'); setIsDeviceModalOpen(true); }} 
                  onGenerateQr={(d) => { setCurrentDevice(d); setIsQrBatchModalOpen(true); }} 
                  bulkEditMode={false} 
                />
              </>
            )}
          </>
        )}
      </main>

      <DeviceModal isOpen={isDeviceModalOpen} onClose={() => setIsDeviceModalOpen(false)} onSave={handleSaveDevice} device={currentDevice} mode={modalMode} classes={classes} />
      <BulkUploadModal isOpen={isBulkUploadModalOpen} onClose={() => setIsBulkUploadModalOpen(false)} onDownload={downloadTemplate} onUpload={handleBulkUpload} />
      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
        schoolId={schoolId}
        classes={classes} 
        config={config} 
        onUpdateClasses={() => {}} 
        onUpdateConfig={() => {}} 
        showDialog={showDialog} 
      />
      <QRBatchModal isOpen={isQrBatchModalOpen} onClose={() => { setIsQrBatchModalOpen(false); setCurrentDevice(null); }} devices={currentDevice ? [currentDevice] : filteredDevices} title={currentDevice ? '기기 개별 QR' : '일괄 QR'} schoolName={config.schoolName} />
    </div>
  );
};

export default App;