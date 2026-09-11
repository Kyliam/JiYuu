import React, { useState } from 'react';
import { User, SystemConfig, AuditLog } from '../../types';
import { storage } from '../../services/storage';
import {
  ShieldAlert,
  Users,
  Settings,
  Database,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  Download,
  Upload,
  RefreshCw,
  Search,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const users = storage.getUsers();
  const receptionists = users.filter(u => u.role === 'receptionist');
  const auditLogs = storage.getAuditLogs();
  const currentConfig = storage.getConfig();

  // Tabs
  const [activeTab, setActiveTab] = useState<'receptionists' | 'config' | 'logs' | 'backup'>('receptionists');

  // Receptionist Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecep, setEditingRecep] = useState<User | null>(null);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('JiYuu@2025');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // System Config State
  const [cancelHoursLimit, setCancelHoursLimit] = useState(currentConfig.cancelHoursLimit);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(currentConfig.slotDurationMinutes);
  const [maxPatientsPerSlot, setMaxPatientsPerSlot] = useState(currentConfig.maxPatientsPerSlot);
  const [enableConcurrentLock, setEnableConcurrentLock] = useState(currentConfig.enableConcurrentLock);
  const [clinicHotline, setClinicHotline] = useState(currentConfig.clinicHotline);

  // Search in logs
  const [logSearch, setLogSearch] = useState('');

  // Feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingRecep(null);
    setPhone('');
    setFullName('');
    setPassword('JiYuu@2025');
    setEmail('');
    setAddress('Quầy Lễ Tân JiYuu - Cơ sở 1');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingRecep(user);
    setPhone(user.phone);
    setFullName(user.fullName);
    setPassword('');
    setEmail(user.email || '');
    setAddress(user.address || '');
    setIsModalOpen(true);
  };

  const handleToggleActive = (user: User) => {
    const nextActive = user.isActive === false ? true : false;
    storage.updateUser(user.id, { isActive: nextActive });
    showToast(
      'success',
      nextActive
        ? `Đã MỞ KHOÁ tài khoản tiếp tân ${user.fullName}.`
        : `Đã KHOÁ tài khoản tiếp tân ${user.fullName}.`
    );
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Bạn có chắc chắn muốn xoá tài khoản tiếp tân ${user.fullName}?`)) {
      const ok = storage.deleteUser(user.id);
      if (ok) {
        showToast('success', `Đã xoá tài khoản ${user.fullName}.`);
      } else {
        showToast('error', 'Không thể xoá tài khoản này.');
      }
    }
  };

  const handleSaveReceptionist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !fullName.trim()) {
      showToast('error', 'Vui lòng điền số điện thoại và họ tên.');
      return;
    }

    if (editingRecep) {
      const updates: Partial<User> = {
        phone: phone.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        address: address.trim(),
      };
      if (password.trim()) {
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_~`\-+=]/;
        if (!specialCharRegex.test(password)) {
          showToast('error', 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.');
          return;
        }
        updates.password = password;
      }
      storage.updateUser(editingRecep.id, updates);
      showToast('success', `Đã cập nhật tài khoản tiếp tân ${fullName}.`);
    } else {
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_~`\-+=]/;
      if (!specialCharRegex.test(password)) {
        showToast('error', 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.');
        return;
      }
      const res = storage.register({
        phone: phone.trim(),
        fullName: fullName.trim(),
        password,
        role: 'receptionist',
        email: email.trim(),
        address: address.trim(),
        dob: '1995-01-01',
      });
      if (!res.success) {
        showToast('error', res.message);
        return;
      }
      showToast('success', `Đã tạo tài khoản tiếp tân ${fullName} thành công!`);
    }

    setIsModalOpen(false);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateConfig({
      cancelHoursLimit,
      slotDurationMinutes,
      maxPatientsPerSlot,
      enableConcurrentLock,
      clinicHotline,
    });
    showToast('success', 'Đã lưu cấu hình hệ thống phòng khám thành công!');
  };

  const handleExportBackup = () => {
    const backupJson = storage.exportBackupData();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jiyuu_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Đã xuất file sao lưu dữ liệu hệ thống (JSON).');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const ok = storage.importBackupData(content);
      if (ok) {
        showToast('success', 'Phục hồi dữ liệu từ bản sao lưu thành công!');
      } else {
        showToast('error', 'File sao lưu không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  const filteredLogs = auditLogs.filter(log => {
    const q = logSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Navigation Tabs */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Bảng Điều Khiển Quản Trị Hệ Thống (Admin)
            </h2>
            <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Root Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý tài khoản Tiếp tân, Cấu hình quy tắc đặt lịch, Sao lưu dữ liệu và Kiểm toán bảo mật
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('receptionists')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'receptionists' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>Tài khoản Tiếp tân</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'config' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-teal-600" />
            <span>Cấu hình phòng khám</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
            <span>Nhật ký bảo mật</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>Sao lưu & Phục hồi</span>
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{toast.text}</span>
        </div>
      )}

      {/* TAB 1: RECEPTIONIST ACCOUNT MANAGEMENT */}
      {activeTab === 'receptionists' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Danh Sách Tài Khoản Tiếp Tân (Lễ tân)</h3>
              <p className="text-xs text-slate-500">
                Admin có quyền tạo mới, điều chỉnh quyền hạn, khoá hoặc mở khoá tài khoản tiếp tân
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Tiếp Tân Mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Số điện thoại (Login)</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Trạng thái tài khoản</th>
                  <th className="py-3 px-4 text-right">Thao tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receptionists.map(u => {
                  const isActive = u.isActive !== false;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.fullName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">{u.phone}</td>
                      <td className="py-3.5 px-4 text-slate-500">{u.email || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isActive ? 'Đang hoạt động' : 'Đã bị khoá'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer inline-flex ${
                            isActive
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={isActive ? 'Khoá tài khoản này' : 'Mở khoá tài khoản'}
                        >
                          {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer inline-flex"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer inline-flex"
                          title="Xoá tài khoản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cấu Hình Quy Tắc Đặt Lịch & Vận Hành Phòng Khám</h3>
            <p className="text-xs text-slate-500">
              Thiết lập quy định huỷ lịch 4 tiếng, thời lượng khám bệnh, và khoá chống trùng lịch đặt đồng thời
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-5 text-xs max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <label className="block font-bold text-slate-800">
                  Thời gian cho phép huỷ lịch tối thiểu (Tiếng)
                </label>
                <input
                  type="number"
                  min={1}
                  max={48}
                  value={cancelHoursLimit}
                  onChange={e => setCancelHoursLimit(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-bold font-mono text-slate-900 bg-white"
                />
                <span className="text-[11px] text-slate-500 block">
                  Quy định phòng khám yêu cầu tối thiểu <strong>4 tiếng</strong> trước giờ hẹn.
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <label className="block font-bold text-slate-800">
                  Thời lượng tối thiểu mỗi lượt khám (Phút)
                </label>
                <input
                  type="number"
                  min={15}
                  max={60}
                  step={5}
                  value={slotDurationMinutes}
                  onChange={e => setSlotDurationMinutes(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-bold font-mono text-slate-900 bg-white"
                />
                <span className="text-[11px] text-slate-500 block">
                  Khoảng cách tiêu chuẩn giữa 2 ca khám (Mặc định 30 phút).
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <label className="block font-bold text-slate-800">
                  Số bệnh nhân tối đa trong 1 khung giờ
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={maxPatientsPerSlot}
                  onChange={e => setMaxPatientsPerSlot(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-bold font-mono text-slate-900 bg-white"
                />
                <span className="text-[11px] text-slate-500 block">
                  Giới hạn để ngăn chặn quá tải tại phòng khám (Mặc định: 1 BN / Bác sĩ).
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <label className="block font-bold text-slate-800">
                  Hotline tổng đài tiếp nhận phòng khám
                </label>
                <input
                  type="text"
                  value={clinicHotline}
                  onChange={e => setClinicHotline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-bold font-mono text-slate-900 bg-white"
                />
                <span className="text-[11px] text-slate-500 block">
                  Hiển thị trên phiếu đặt lịch và chân trang.
                </span>
              </div>
            </div>

            {/* Concurrent Booking Prevention Switch */}
            <div className="p-5 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-teal-950 text-sm block">
                  Chế độ khoá chống xung đột lịch trùng nhau (Concurrent Booking Lock)
                </span>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  Tự động kiểm tra thời gian thực khi có 2 bệnh nhân cùng thao tác đặt lịch cùng một bác sĩ trong cùng khung giờ.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={enableConcurrentLock}
                  onChange={e => setEnableConcurrentLock(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu cấu hình hệ thống</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Nhật Ký Kiểm Toán & Bảo Mật Hệ Thống (Audit Logs)</h3>
              <p className="text-xs text-slate-500">
                Ghi nhận chi tiết mọi hành vi đăng nhập, huỷ lịch, khám bệnh và cấp quyền
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                placeholder="Tìm nhật ký..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Hành động</th>
                  <th className="py-2.5 px-3">Tác nhân</th>
                  <th className="py-2.5 px-3">IP / Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.slice(0, 30).map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-teal-800">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {log.userName} <span className="text-slate-400">({log.userRole})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sao Lưu & Khôi Phục Dữ Liệu Phòng Khám</h3>
            <p className="text-xs text-slate-500">
              Đảm bảo tính liên tục của dữ liệu bệnh án, lịch khám và tài khoản người dùng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Xuất bản sao lưu dữ liệu (Export Backup)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Tải toàn bộ cơ sở dữ liệu (Người dùng, Bác sĩ, Lịch hẹn, Bệnh án, Đơn thuốc, Nhật ký) thành định dạng tệp JSON an toàn.
                </p>
              </div>

              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Tải về file sao lưu ngay</span>
              </button>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Khôi phục dữ liệu từ file (Restore)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Tải lên tệp sao lưu định dạng JSON để khôi phục trạng thái toàn hệ thống khi cần thiết.
                </p>
              </div>

              <label className="w-full py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Chọn tệp JSON để phục hồi</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Receptionist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4 border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              {editingRecep ? 'Chỉnh Sửa Tài Khoản Tiếp Tân' : 'Tạo Mới Tài Khoản Tiếp Tân'}
            </h3>

            <form onSubmit={handleSaveReceptionist} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên lễ tân</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="VD: Trần Thị Mai"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại (Tên đăng nhập)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0911223344"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mật khẩu {editingRecep ? '(Để trống nếu không đổi)' : '(Bắt buộc ký tự đặc biệt)'}
                </label>
                <input
                  type="password"
                  required={!editingRecep}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mật khẩu chứa ký tự đặc biệt..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tieptan@jiyuu.clinic"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ phân công quầy</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Quầy 01, Tầng 1"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Lưu tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
