import React, { useState } from 'react';
import { UserRole } from '../../types';
import { storage } from '../../services/storage';
import { X, Lock, Phone, User, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, UserPlus } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'patient',
  onSuccess,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('1998-05-12');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!phone.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ số điện thoại và mật khẩu.');
      return;
    }

    if (isRegister) {
      if (!fullName.trim()) {
        setErrorMsg('Vui lòng nhập họ và tên của bạn.');
        return;
      }

      const res = storage.registerPatient({
        phone: phone.trim(),
        password,
        fullName: fullName.trim(),
        address: address.trim(),
        dob,
        email: email.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.message || 'Đăng ký không thành công.');
        return;
      }

      setSuccessMsg('Đăng ký tài khoản thành công! Đang đăng nhập...');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } else {
      const res = storage.login(phone.trim(), password);
      if (!res.success) {
        setErrorMsg(res.message || 'Đăng nhập không thành công.');
        return;
      }

      setSuccessMsg(`Đăng nhập thành công! Xin chào ${res.user?.fullName}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 600);
    }
  };

  const handleQuickLogin = (rolePhone: string, rolePass: string) => {
    setPhone(rolePhone);
    setPassword(rolePass);
    setErrorMsg('');
    const res = storage.login(rolePhone, rolePass);
    if (res.success) {
      setSuccessMsg(`Đã đăng nhập tài khoản demo: ${res.user?.fullName}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            JiYuu Clinic Health Portal
          </div>
          <h3 className="text-xl font-bold">
            {isRegister ? 'Đăng ký tài khoản Bệnh nhân' : 'Đăng nhập hệ thống JiYuu'}
          </h3>
          <p className="text-teal-100 text-xs mt-1">
            {isRegister
              ? 'Tên đăng nhập là số điện thoại di động chính chủ'
              : 'Nhập số điện thoại và mật khẩu đã được cấp hoặc đăng ký'}
          </p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên bệnh nhân <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Thị Lan"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số điện thoại (Tên đăng nhập) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Mật khẩu <span className="text-rose-500">*</span></span>
                {isRegister && (
                  <span className="text-[10px] text-teal-600 font-normal">Yêu cầu ký tự đặc biệt (@, #, $, !)</span>
                )}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mật khẩu của bạn"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {isRegister && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email (nếu có)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Quận/Huyện, Tỉnh/TP"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full mt-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isRegister ? <UserPlus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isRegister ? 'Hoàn tất Đăng ký Bệnh nhân' : 'Đăng nhập ngay'}
            </button>
          </form>

          <div className="flex items-center justify-center pt-2 text-xs">
            <span className="text-slate-500">
              {isRegister ? 'Đã có tài khoản khám bệnh?' : 'Chưa có tài khoản bệnh nhân?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
              }}
              className="ml-1.5 text-teal-600 font-bold hover:underline cursor-pointer"
            >
              {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
            </button>
          </div>

          {/* Quick Demo Logins Section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Đăng nhập nhanh các vai trò để kiểm thử hệ thống:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('0912345678', 'Password@123')}
                className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-left font-medium border border-teal-200/60 transition cursor-pointer"
              >
                <div className="font-bold">1. Bệnh nhân (Patient)</div>
                <div className="text-[10px] text-teal-600">Lê Thị Thu Hương</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('0987654321', 'Doctor@2026!')}
                className="p-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-left font-medium border border-cyan-200/60 transition cursor-pointer"
              >
                <div className="font-bold">2. Bác sĩ (Doctor)</div>
                <div className="text-[10px] text-cyan-600">BS.CKII Nguyễn Văn An</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('0901234567', 'Recep@2026#')}
                className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-left font-medium border border-purple-200/60 transition cursor-pointer"
              >
                <div className="font-bold">3. Tiếp tân (Reception)</div>
                <div className="text-[10px] text-purple-600">Ngô Mỹ Linh (Check-in)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('0999888777', 'Admin@2026$')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-left font-medium border border-slate-300 transition cursor-pointer"
              >
                <div className="font-bold">4. Quản trị viên (Admin)</div>
                <div className="text-[10px] text-slate-600">Đoàn Nhật Minh (Cấu hình)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
