import React, { useState } from 'react';
import { User, UserRole, SystemNotification } from '../../types';
import { storage } from '../../services/storage';
import {
  Stethoscope,
  Calendar,
  UserCheck,
  Bell,
  LogOut,
  LogIn,
  Menu,
  X,
  Phone,
  FileText,
  Clock,
  QrCode,
  Users,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeRole?: UserRole;
  currentView?: string;
  onNavigate?: (view: string) => void;
  onOpenAuth?: () => void;
  onOpenQrScanner?: () => void;
  notifications?: SystemNotification[];
  // Backwards compatibility with App.tsx
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeRole,
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenQrScanner,
  notifications,
  currentTab,
  onSelectTab,
  onOpenLogin,
  onOpenRegister,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const effectiveRole: UserRole = activeRole || currentUser?.role || 'patient';
  const effectiveTab = currentView || currentTab || (
    effectiveRole === 'patient' ? 'patient_booking' :
    effectiveRole === 'doctor' ? 'doctor_exam' :
    effectiveRole === 'receptionist' ? 'receptionist_appointments' : 'admin_dashboard'
  );

  const effectiveNotifications = Array.isArray(notifications)
    ? notifications
    : (storage.getNotifications() || []);
  const unreadNotifs = (effectiveNotifications || []).filter(n => !n.read);

  const handleNav = (view: string) => {
    // Map between hyphenated and underscored keys
    const tabMap: Record<string, string> = {
      'patient-booking': 'patient_booking',
      'patient-appointments': 'patient_appointments',
      'patient-records': 'patient_records',
      'patient-profile': 'patient_profile',
      'doctor-appointments': 'doctor_exam',
      'doctor-schedules': 'doctor_schedule',
      'doctor-records': 'doctor_records',
      'doctor-profile': 'doctor_schedule',
      'receptionist-appointments': 'receptionist_appointments',
      'receptionist-doctors': 'receptionist_doctors',
      'receptionist-approvals': 'receptionist_schedules',
      'receptionist-billing': 'receptionist_appointments',
      'admin-receptionists': 'admin_dashboard',
      'admin-config': 'admin_dashboard',
    };
    const target = tabMap[view] || view;

    if (onSelectTab) onSelectTab(target);
    if (onNavigate) onNavigate(view);
  };

  const handleOpenAuthModal = () => {
    if (onOpenAuth) onOpenAuth();
    else if (onOpenLogin) onOpenLogin();
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    handleOpenAuthModal();
  };

  const isTabActive = (tabKey: string) => {
    if (effectiveTab === tabKey) return true;
    if (tabKey === 'patient-booking' && (effectiveTab === 'patient_booking' || effectiveTab === 'patient-booking')) return true;
    if (tabKey === 'patient-appointments' && (effectiveTab === 'patient_appointments' || effectiveTab === 'patient-appointments')) return true;
    if (tabKey === 'patient-records' && (effectiveTab === 'patient_records' || effectiveTab === 'patient-records')) return true;
    if (tabKey === 'patient-profile' && (effectiveTab === 'patient_profile' || effectiveTab === 'patient-profile')) return true;
    if (tabKey === 'doctor-appointments' && (effectiveTab === 'doctor_exam' || effectiveTab === 'doctor-appointments' || effectiveTab === 'doctor_appointments')) return true;
    if (tabKey === 'doctor-schedules' && (effectiveTab === 'doctor_schedule' || effectiveTab === 'doctor-schedules' || effectiveTab === 'doctor_schedules')) return true;
    if (tabKey === 'doctor-records' && (effectiveTab === 'doctor_records' || effectiveTab === 'doctor-records')) return true;
    if (tabKey === 'doctor-profile' && effectiveTab === 'doctor-profile') return true;
    if (tabKey === 'receptionist-appointments' && (effectiveTab === 'receptionist_appointments' || effectiveTab === 'receptionist-appointments')) return true;
    if (tabKey === 'receptionist-doctors' && (effectiveTab === 'receptionist_doctors' || effectiveTab === 'receptionist-doctors')) return true;
    if (tabKey === 'receptionist-approvals' && (effectiveTab === 'receptionist_schedules' || effectiveTab === 'receptionist-approvals')) return true;
    if (tabKey === 'receptionist-billing' && effectiveTab === 'receptionist-billing') return true;
    if (tabKey === 'admin-receptionists' && (effectiveTab === 'admin_dashboard' || effectiveTab === 'admin-receptionists')) return true;
    if (tabKey === 'admin-config' && effectiveTab === 'admin-config') return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Banner with Clinic Info */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-teal-300 font-medium">
            <Stethoscope className="w-3.5 h-3.5" />
            Hệ Thống Y Tế & Phòng Khám Quốc Tế JiYuu
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:flex items-center gap-1 text-slate-400">
            <Phone className="w-3 h-3 text-teal-400" />
            Hotline đặt lịch 24/7: <strong className="text-white">1900 6868</strong>
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => handleNav(effectiveRole === 'patient' ? 'patient-booking' : `${effectiveRole}-appointments`)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-teal-600/15 group-hover:scale-105 transition border border-slate-200/80 bg-white flex items-center justify-center shrink-0">
            <img
              src="/logo.jpg"
              alt="JiYuu Clinic Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=100';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">JiYuu</span>
              <span className="text-xs uppercase font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">Clinic</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium -mt-0.5">Đặt Lịch & Quản Lý Khám Bệnh</p>
          </div>
        </div>

        {/* Role Nav Items (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {effectiveRole === 'patient' && (
            <>
              <button
                onClick={() => handleNav('patient-booking')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive('patient-booking')
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Đặt lịch khám
              </button>
              <button
                onClick={() => handleNav('patient-appointments')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive('patient-appointments')
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                Lịch khám của tôi
              </button>
              <button
                onClick={() => handleNav('patient-records')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive('patient-records')
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                Bệnh án điện tử
              </button>
              <button
                onClick={() => handleNav('patient-profile')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive('patient-profile')
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Hồ sơ tài khoản
              </button>
            </>
          )}

          {effectiveRole === 'doctor' && (
            <>
              <button
                onClick={() => handleNav('doctor-appointments')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive('doctor-appointments')
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                Lịch khám bệnh nhân
              </button>
              <button
                onClick={() => handleNav('doctor-schedules')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive('doctor-schedules')
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Lịch làm việc (Google Calendar UI)
              </button>
              <button
                onClick={() => handleNav('doctor-records')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive('doctor-records')
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                Quản lý bệnh án
              </button>
            </>
          )}

          {effectiveRole === 'receptionist' && (
            <>
              <button
                onClick={() => handleNav('receptionist-appointments')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive('receptionist-appointments')
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                Lịch khám bệnh
              </button>
              <button
                onClick={() => handleNav('receptionist-doctors')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive('receptionist-doctors')
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Quản lý Bác sĩ
              </button>
              <button
                onClick={() => handleNav('receptionist-approvals')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive('receptionist-approvals')
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Duyệt lịch Bác sĩ
              </button>
            </>
          )}

          {effectiveRole === 'admin' && (
            <>
              <button
                onClick={() => handleNav('admin-receptionists')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive('admin-receptionists')
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Quản lý Tiếp tân & Hệ thống
              </button>
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick QR Checkin Button for Receptionist */}
          {effectiveRole === 'receptionist' && onOpenQrScanner && (
            <button
              onClick={onOpenQrScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Quét QR Tiếp Nhận</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Thông báo hệ thống"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Thông báo hệ thống ({effectiveNotifications.length})</span>
                  <span className="text-[10px] text-teal-600 font-semibold">Tự động cập nhật</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {effectiveNotifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Không có thông báo mới nào
                    </div>
                  ) : (
                    effectiveNotifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => storage.markNotificationAsRead(n.id)}
                        className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition ${
                          !n.read ? 'bg-teal-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{n.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Auth */}
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={currentUser.fullName}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{currentUser.phone}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập / Đăng ký</span>
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          {effectiveRole === 'patient' && (
            <>
              <button
                onClick={() => {
                  handleNav('patient-booking');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-teal-50"
              >
                Đặt lịch khám bệnh
              </button>
              <button
                onClick={() => {
                  handleNav('patient-appointments');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-teal-50"
              >
                Lịch khám của tôi
              </button>
              <button
                onClick={() => {
                  handleNav('patient-records');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-teal-50"
              >
                Bệnh án điện tử
              </button>
              <button
                onClick={() => {
                  handleNav('patient-profile');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-teal-50"
              >
                Hồ sơ tài khoản
              </button>
            </>
          )}
          {effectiveRole === 'doctor' && (
            <>
              <button
                onClick={() => {
                  handleNav('doctor-appointments');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-cyan-50"
              >
                Lịch khám bệnh nhân
              </button>
              <button
                onClick={() => {
                  handleNav('doctor-schedules');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-cyan-50"
              >
                Lịch làm việc (Google Calendar UI)
              </button>
              <button
                onClick={() => {
                  handleNav('doctor-records');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-cyan-50"
              >
                Quản lý bệnh án
              </button>
            </>
          )}
          {effectiveRole === 'receptionist' && (
            <>
              <button
                onClick={() => {
                  handleNav('receptionist-appointments');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-purple-50"
              >
                Lịch khám bệnh & Tiếp nhận
              </button>
              <button
                onClick={() => {
                  handleNav('receptionist-doctors');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-purple-50"
              >
                Quản lý Bác sĩ
              </button>
              <button
                onClick={() => {
                  handleNav('receptionist-approvals');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-purple-50"
              >
                Duyệt lịch làm việc Bác sĩ
              </button>
            </>
          )}
          {effectiveRole === 'admin' && (
            <>
              <button
                onClick={() => {
                  handleNav('admin-receptionists');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-rose-50"
              >
                Quản lý Tiếp tân & Hệ thống
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
