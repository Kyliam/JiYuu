import React, { useState, useEffect } from 'react';
import { User, UserRole, Appointment } from './types';
import { storage } from './services/storage';
import { Navbar } from './components/common/Navbar';
import { AuthModal } from './components/common/AuthModal';

// Patient Components
import { PatientBooking } from './components/patient/PatientBooking';
import { PatientAppointments } from './components/patient/PatientAppointments';
import { PatientMedicalRecords } from './components/patient/PatientMedicalRecords';
import { PatientProfile } from './components/patient/PatientProfile';

// Doctor Components
import { DoctorSchedule } from './components/doctor/DoctorSchedule';
import { DoctorExamination } from './components/doctor/DoctorExamination';
import { DoctorMedicalRecords } from './components/doctor/DoctorMedicalRecords';

// Receptionist Components
import { ReceptionistAppointments } from './components/receptionist/ReceptionistAppointments';
import { ReceptionistDoctorManagement } from './components/receptionist/ReceptionistDoctorManagement';
import { ReceptionistScheduleApproval } from './components/receptionist/ReceptionistScheduleApproval';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';

import {
  HeartPulse,
  Phone,
  Clock,
  MapPin,
  ShieldCheck,
  Calendar,
  Sparkles,
  Award,
} from 'lucide-react';

const getDefaultTabForRole = (role?: UserRole): string => {
  if (role === 'doctor') return 'doctor_exam';
  if (role === 'receptionist') return 'receptionist_appointments';
  if (role === 'admin') return 'admin_dashboard';
  return 'patient_booking';
};

const isTabAllowedForRole = (tab: string, role?: UserRole): boolean => {
  const effectiveRole = role || 'patient';
  if (effectiveRole === 'doctor') {
    return ['doctor_exam', 'doctor_schedule', 'doctor_records'].includes(tab);
  }
  if (effectiveRole === 'receptionist') {
    return ['receptionist_appointments', 'receptionist_doctors', 'receptionist_schedules'].includes(tab);
  }
  if (effectiveRole === 'admin') {
    return ['admin_dashboard'].includes(tab);
  }
  return ['patient_booking', 'patient_appointments', 'patient_records', 'patient_profile'].includes(tab);
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<string>(() => {
    const user = storage.getCurrentUser();
    return getDefaultTabForRole(user?.role);
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  // Reactive subscription to storage changes & ensure tab corresponds to role
  useEffect(() => {
    const unsubscribe = storage.subscribeStorage(() => {
      const user = storage.getCurrentUser();
      setCurrentUser(user);
      setCurrentTab(prev => {
        if (!isTabAllowedForRole(prev, user?.role)) {
          return getDefaultTabForRole(user?.role);
        }
        return prev;
      });
    });
    return () => unsubscribe();
  }, []);

  // Enforce role-based access whenever role or tab changes
  useEffect(() => {
    if (!isTabAllowedForRole(currentTab, currentUser?.role)) {
      setCurrentTab(getDefaultTabForRole(currentUser?.role));
    }
  }, [currentUser?.role, currentTab]);

  const handleOpenLogin = () => {
    setAuthInitialMode('login');
    setIsAuthOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthInitialMode('register');
    setIsAuthOpen(true);
  };

  const handleBookingSuccess = (appointment: Appointment) => {
    // Navigate to appointment list or keep on ticket view
  };

  const config = storage.getConfig();

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Notification / Hotline Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              Tổng đài đặt khám 24/7: <strong className="text-white font-mono">{config.clinicHotline}</strong>
            </span>
            <span className="hidden md:inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              Giờ làm việc: 08:00 - 21:00 (Tất cả các ngày trong tuần)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-teal-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Bảo mật tiêu chuẩn y tế • Huỷ lịch miễn phí trước 4 tiếng
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* PATIENT VIEWS */}
        {currentTab === 'patient_booking' && (
          <PatientBooking
            currentUser={currentUser}
            onOpenAuth={handleOpenLogin}
            onBookingSuccess={handleBookingSuccess}
            onNavigateTab={tab => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'patient_appointments' && (
          <PatientAppointments
            currentUser={currentUser}
            onOpenAuth={handleOpenLogin}
          />
        )}

        {currentTab === 'patient_records' && (
          <PatientMedicalRecords
            currentUser={currentUser}
            onOpenAuth={handleOpenLogin}
          />
        )}

        {currentTab === 'patient_profile' && (
          <PatientProfile
            currentUser={currentUser}
            onOpenAuth={handleOpenLogin}
          />
        )}

        {/* DOCTOR VIEWS */}
        {currentTab === 'doctor_exam' && (
          <DoctorExamination currentUser={currentUser} />
        )}

        {currentTab === 'doctor_schedule' && (
          <DoctorSchedule currentUser={currentUser} />
        )}

        {currentTab === 'doctor_records' && (
          <DoctorMedicalRecords currentUser={currentUser} />
        )}

        {/* RECEPTIONIST VIEWS */}
        {currentTab === 'receptionist_appointments' && (
          <ReceptionistAppointments currentUser={currentUser} />
        )}

        {currentTab === 'receptionist_doctors' && (
          <ReceptionistDoctorManagement currentUser={currentUser} />
        )}

        {currentTab === 'receptionist_schedules' && (
          <ReceptionistScheduleApproval currentUser={currentUser} />
        )}

        {/* ADMIN VIEWS */}
        {currentTab === 'admin_dashboard' && (
          <AdminDashboard currentUser={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-12 py-10 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
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
                <span className="text-base font-black text-slate-900 tracking-tight block">JiYuu Clinic</span>
                <span className="text-[10px] text-teal-600 font-semibold uppercase tracking-wider block">
                  Phòng Khám Đa Khoa Kỹ Thuật Số
                </span>
              </div>
            </div>
            <p className="leading-relaxed text-slate-500 text-[11px]">
              Hệ thống đặt lịch khám bệnh thông minh và quản lý bệnh án điện tử tích hợp QR Code tiện lợi, an toàn và bảo mật cao.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
              Chuyên Khoa Thăm Khám
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li>• Khoa Nội tổng quát & Tim mạch</li>
              <li>• Khoa Tiêu hoá, Gan mật & Hô hấp</li>
              <li>• Khoa Ngoại, Cơ xương khớp & Cột sống</li>
              <li>• Khoa Tai Mũi Họng, Mắt & Da liễu</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
              Địa Chỉ & Liên Hệ
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Số 88 Phố Huế, Quận Hai Bà Trưng, Hà Nội</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="font-mono">Hotline: {config.clinicHotline}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>08:00 - 21:00 hàng ngày</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
              Cam Kết Dịch Vụ
            </h4>
            <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-100 text-[11px] text-teal-900 space-y-1">
              <span className="font-bold block">✓ Tránh trùng lặp giờ khám</span>
              <span>Hệ thống chống xung đột lịch đặt đồng thời và kiểm soát hàng chờ thời gian thực.</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>© {new Date().getFullYear()} JiYuu Medical Clinic. All rights reserved.</span>
          <span>Designed with Vietnamese Healthcare Standards</span>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authInitialMode}
      />
    </div>
  );
}
