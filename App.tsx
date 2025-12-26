
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
  LogOut, Settings, Plus, Download, Upload, Trash2, 
  RefreshCw, CheckCircle2, ChevronRight, LayoutGrid, Search,
  Lock, AlertCircle, QrCode, Loader2, X, SlidersHorizontal, Save
} from 'lucide-react';
import { exportToExcel } from './utils/excelHelper';
import { db } from './firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  getDoc,
  setDoc,
  writeBatch
} from "firebase/firestore";

const App: React.FC = () => {
  // Authentication & Global State
  const [role, setRole] = useState<UserRole>('GUEST');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom Dialog State
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

  // Custom Login State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // Data State
  const [devices, setDevices] = useState<Device[]>([]);
  const [tempDevices, setTempDevices] = useState<Device[]>([]); // For Bulk Edit
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    announcement: '로딩 중...',
    schoolName: '학교 스마트기기 관리 시스템',
    isEditingInProgress: false
  });

  // UI State
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('view');
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isQrBatchModalOpen, setIsQrBatchModalOpen] = useState(false);
  const [isBulkEdit, setIsBulkEdit] = useState(false);

  // Real-time Sync
  useEffect(() => {
    setIsLoading(true);
    const unsubClasses = onSnapshot(query(collection(db, "classes"), orderBy("grade"), orderBy("room")), (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass)));
    });
    const unsubDevices = onSnapshot(collection(db, "devices"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Device));
      setDevices(data);
      setIsLoading(false);
    });
    const unsubConfig = onSnapshot(doc(db, "app_config", "main"), (snap) => {
      if (snap.exists()) setConfig(snap.data() as AppConfig);
    });
    return () => { unsubClasses(); unsubDevices(); unsubConfig(); };
  }, []);

  const filteredDevices = useMemo(() => {
    const list = isBulkEdit ? tempDevices : devices;
    let result = list;
    if (activeTab !== 'all') result = result.filter(d => d.assignedClass === activeTab);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.serialNumber?.toLowerCase().includes(q) || d.mgmtNumber?.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => (a.classSequence || 0) - (b.classSequence || 0));
  }, [devices, tempDevices, isBulkEdit, activeTab, searchQuery]);

  const verifyAdminPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminPassword === '1234') {
      setRole('ADMIN');
      setIsLoggedIn(true);
      setShowPasswordModal(false);
      setAdminPassword('');
    } else {
      showDialog('alert', '로그인 실패', '비밀번호가 올바르지 않습니다.');
    }
  };

  const handleDeleteSelected = () => {
    showDialog('confirm', '삭제 확인', `${selectedIds.length}개의 기기를 삭제하시겠습니까?`, async () => {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, "devices", id)));
      await batch.commit();
      setSelectedIds([]);
      showDialog('success', '삭제 완료', '데이터가 성공적으로 삭제되었습니다.');
    });
  };

  const handleBulkUpdate = (id: string, field: keyof Device, value: any) => {
    setTempDevices(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const saveBulkChanges = async () => {
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      tempDevices.forEach(device => {
        const { id, ...data } = device;
        batch.update(doc(db, "devices", id), data);
      });
      await batch.commit();
      const configRef = doc(db, "app_config", "main");
      await updateDoc(configRef, { isEditingInProgress: false });
      setIsBulkEdit(false);
      showDialog('success', '저장 완료', '모든 변경사항이 반영되었습니다.');
    } catch (error) {
      showDialog('alert', '저장 실패', '수정 중 오류가 발생했습니다.');
    }
    setIsLoading(false);
  };

  const toggleBulkEdit = async () => {
    if (!isBulkEdit) {
      const snap = await getDoc(doc(db, "app_config", "main"));
      if (snap.exists() && snap.data().isEditingInProgress) {
        showDialog('alert', '편집 제한', '현재 다른 사용자가 일괄 수정을 진행 중입니다.');
        return;
      }
      showDialog('confirm', '수정 모드 진입', '일괄 수정 모드에서는 다른 사용자의 접근이 제한됩니다. 계속하시겠습니까?', async () => {
        await updateDoc(doc(db, "app_config", "main"), { isEditingInProgress: true });
        setTempDevices([...devices]);
        setIsBulkEdit(true);
      });
    } else {
      setIsBulkEdit(false);
      await updateDoc(doc(db, "app_config", "main"), { isEditingInProgress: false });
    }
  };

  const handleSaveDevice = async (deviceData: Partial<Device>) => {
    if (modalMode === 'add') {
      await addDoc(collection(db, "devices"), { ...deviceData, createdAt: new Date().toISOString() });
      showDialog('success', '등록 완료', '새 기기가 성공적으로 등록되었습니다.');
    } else if (deviceData.id) {
      const { id, ...data } = deviceData;
      await updateDoc(doc(db, "devices", id), data);
      showDialog('success', '수정 완료', '기기 정보가 업데이트되었습니다.');
    }
  };

  if (new URLSearchParams(window.location.search).get('mode') === 'readonly') {
    const qrId = new URLSearchParams(window.location.search).get('id');
    const qrDevice = devices.find(d => d.id === qrId);
    if (qrDevice) return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-[#1E3A8A] p-10 text-center text-white">
            <h1 className="text-3xl font-black mb-2">기기 정보</h1>
            <p className="opacity-70">{config.schoolName}</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex justify-between border-b pb-4"><span className="text-gray-400">관리번호</span><span className="font-bold text-xl">{qrDevice.mgmtNumber}</span></div>
            <div className="flex justify-between border-b pb-4"><span className="text-gray-400">학급</span><span className="font-bold text-xl">{qrDevice.assignedClass} ({qrDevice.classSequence}번)</span></div>
            <div className="bg-gray-50 p-6 rounded-2xl">
              <span className="text-xs text-gray-400 uppercase font-bold block mb-2 tracking-widest">Notes</span>
              <p className="text-gray-700 leading-relaxed">{qrDevice.notes || "특이사항 없음"}</p>
            </div>
            <Button className="w-full mt-4" onClick={() => window.location.href = window.location.origin + window.location.pathname}>시스템 홈으로</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-[#1E3A8A] flex items-center justify-center p-4">
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in zoom-in duration-300">
            <div className="px-6 py-5 bg-gray-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">관리자 보안 확인</h3>
              <button onClick={() => setShowPasswordModal(false)} className="hover:bg-gray-700 p-2 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={verifyAdminPassword} className="p-8">
              <input autoFocus type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl px-4 py-4 mb-6 focus:border-blue-500 outline-none text-center text-3xl tracking-[1em]" placeholder="****" />
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 py-4" onClick={() => setShowPasswordModal(false)}>취소</Button>
                <Button type="submit" variant="primary" className="flex-1 py-4">로그인</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 w-full max-w-md text-center border border-white/20">
        <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-[#1E3A8A]"><LayoutGrid size={56} /></div>
        <h1 className="text-4xl font-black text-gray-900 mb-2">{config.schoolName}</h1>
        <p className="text-gray-400 font-medium mb-12">스마트기기 통합 관리 시스템</p>
        <div className="space-y-4">
          <button onClick={() => setShowPasswordModal(true)} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all transform hover:scale-[1.02] shadow-xl"><Lock size={20} /> 관리자 로그인</button>
          <button onClick={() => { setRole('TEACHER'); setIsLoggedIn(true); }} className="w-full py-5 border-2 border-[#1E3A8A] text-[#1E3A8A] rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-50 transition-all transform hover:scale-[1.02]"><RefreshCw size={20} /> 교사 공용 로그인</button>
        </div>
      </div>
      <CustomDialog {...dialog} onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <CustomDialog {...dialog} onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))} />
      {isLoading && <div className="fixed inset-0 z-[100] bg-white/70 flex items-center justify-center backdrop-blur-md"><Loader2 className="w-12 h-12 text-[#1E3A8A] animate-spin" /></div>}
      
      <header className="sticky top-0 z-40 bg-[#1E3A8A] text-white px-6 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl"><LayoutGrid size={24} /></div>
            <div><h1 className="font-black text-xl leading-tight">{config.schoolName}</h1><p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Management CMS</p></div>
          </div>
          <div className="flex items-center gap-4">
            {role === 'ADMIN' && <button onClick={() => setIsAdminPanelOpen(true)} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-all"><Settings size={20} /><span className="font-bold text-sm hidden sm:inline">시스템 설정</span></button>}
            <button onClick={() => setIsLoggedIn(false)} className="p-2 hover:bg-red-500 rounded-full transition-colors"><LogOut size={22} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <NoticeBanner content={config.announcement} />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-2">
            {isBulkEdit ? (
              <>
                <Button variant="primary" icon={<Save size={18}/>} onClick={saveBulkChanges} className="bg-green-600 hover:bg-green-700">변경사항 저장</Button>
                <Button variant="outline" onClick={toggleBulkEdit}>취소</Button>
              </>
            ) : (
              <>
                {role === 'ADMIN' && <Button variant="secondary" icon={<SlidersHorizontal size={18}/>} onClick={() => setIsAdminPanelOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">관리자 설정</Button>}
                <Button variant="primary" icon={<Plus size={18}/>} onClick={() => { setModalMode('add'); setCurrentDevice(null); setIsDeviceModalOpen(true); }}>기기 추가</Button>
                <Button variant="outline" icon={<RefreshCw size={18}/>} onClick={toggleBulkEdit}>일괄 수정</Button>
                <Button variant="outline" icon={<Download size={18}/>} onClick={() => exportToExcel(filteredDevices)}>내보내기</Button>
                {selectedIds.length > 0 && <Button variant="danger" icon={<Trash2 size={18}/>} onClick={handleDeleteSelected}>삭제 ({selectedIds.length})</Button>}
                <Button variant="outline" icon={<QrCode size={18}/>} onClick={() => setIsQrBatchModalOpen(true)}>QR 일괄 생성</Button>
              </>
            )}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="검색..." className="w-full pl-10 pr-4 py-3 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="mb-6 flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          <button onClick={() => setActiveTab('all')} className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-sm ${activeTab === 'all' ? 'bg-[#1E3A8A] text-white' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>전체 ({devices.length})</button>
          {classes.map(c => <button key={c.id} onClick={() => setActiveTab(c.id)} className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-sm ${activeTab === c.id ? 'bg-[#1E3A8A] text-white' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>{c.grade}-{c.room}</button>)}
        </div>

        <DeviceTable devices={filteredDevices} role={role} selectedIds={selectedIds} onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} onSelectAll={setSelectedIds} onEdit={(d) => { setCurrentDevice(d); setModalMode('edit'); setIsDeviceModalOpen(true); }} onDelete={(id) => { setSelectedIds([id]); handleDeleteSelected(); }} onView={(d) => { setCurrentDevice(d); setModalMode('view'); setIsDeviceModalOpen(true); }} onGenerateQr={(d) => { setCurrentDevice(d); setIsQrBatchModalOpen(true); }} bulkEditMode={isBulkEdit} onBulkUpdate={handleBulkUpdate} />
      </main>

      <DeviceModal isOpen={isDeviceModalOpen} onClose={() => setIsDeviceModalOpen(false)} onSave={handleSaveDevice} device={currentDevice} mode={modalMode} classes={classes} />
      <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} classes={classes} config={config} onUpdateClasses={() => {}} onUpdateConfig={() => {}} showDialog={showDialog} />
      <QRBatchModal isOpen={isQrBatchModalOpen} onClose={() => { setIsQrBatchModalOpen(false); setCurrentDevice(null); }} devices={currentDevice ? [currentDevice] : filteredDevices} title={currentDevice ? '기기 개별 QR' : '일괄 QR'} schoolName={config.schoolName} />
    </div>
  );
};

export default App;
