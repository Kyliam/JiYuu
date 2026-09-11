import React, { useState } from 'react';
import { User } from '../../types';
import { storage } from '../../services/storage';
import { readFileAsOptimizedDataUrl } from '../../utils/imageUtils';
import {
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  Upload,
} from 'lucide-react';

interface PatientProfileProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const PatientProfile: React.FC<PatientProfileProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
        <UserIcon className="w-12 h-12 text-teal-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Vui lòng đăng nhập</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Đăng nhập để cập nhật thông tin cá nhân và mật khẩu.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [dob, setDob] = useState(currentUser.dob || '1995-06-15');
  const [address, setAddress] = useState(currentUser.address || '');
  const [avatar, setAvatar] = useState(
    currentUser.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const updates: Partial<User> = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      dob,
      address: address.trim(),
      avatar,
    };

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
        return;
      }
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_~`\-+=]/;
      if (!specialCharRegex.test(newPassword)) {
        setMessage({
          type: 'error',
          text: 'Mật khẩu mới phải chứa ít nhất một ký tự đặc biệt (ví dụ: @, #, $, %, !, *, ?, &).',
        });
        return;
      }
      updates.password = newPassword;
    }

    try {
      const ok = storage.updateUser(currentUser.id, updates);
      if (ok) {
        setMessage({ type: 'success', text: 'Cập nhật thông tin hồ sơ thành công!' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: 'Không thể cập nhật hồ sơ.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Có lỗi xảy ra.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Hồ Sơ Tài Khoản
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thay đổi họ tên, số điện thoại, ảnh đại diện, ngày sinh, địa chỉ, email và mật khẩu
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative group/patient-avatar shrink-0">
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs bg-teal-50"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                  }}
                />
                <label
                  htmlFor="patient-profile-avatar-upload"
                  className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover/patient-avatar:opacity-100 flex flex-col items-center justify-center text-white transition cursor-pointer"
                  title="Tải ảnh từ máy tính"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <span className="text-[9px] font-bold mt-0.5">Đổi ảnh</span>
                </label>
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="patient-profile-avatar-upload"
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy tính</span>
                  </label>
                  <input
                    id="patient-profile-avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const dataUrl = await readFileAsOptimizedDataUrl(f);
                        setAvatar(dataUrl);
                      } catch (err: any) {
                        setMessage({ type: 'error', text: err.message || 'Không thể tải ảnh.' });
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Chọn ảnh đại diện JPG, PNG hoặc WEBP từ thiết bị của bạn.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              {/*<label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Hoặc nhập liên kết ảnh trực tiếp (URL):
              </label>
              <input
                type="url"
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono bg-white"
              />*/}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Số điện thoại (Tên đăng nhập) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-mono font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ngày tháng năm sinh
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Địa chỉ thường trú / Liên hệ
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Số nhà, Phố, Quận/Huyện, Tỉnh/TP"
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-teal-600" />
                Đổi mật khẩu mới (Tùy chọn)
              </span>
              <span className="text-[10px] text-teal-600 font-medium">Bắt buộc ký tự đặc biệt</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Để trống nếu không đổi"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi hồ sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
