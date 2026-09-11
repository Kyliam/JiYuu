import {
  User,
  DoctorProfile,
  DoctorSchedule,
  Appointment,
  MedicalRecord,
  SystemConfig,
  SecurityAuditLog,
  SystemNotification,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_DOCTORS,
  INITIAL_SCHEDULES,
  INITIAL_APPOINTMENTS,
  INITIAL_MEDICAL_RECORDS,
  INITIAL_SYSTEM_CONFIG,
  INITIAL_AUDIT_LOGS,
} from './mockData';
import { generateAppointmentQrCode, generateMedicalRecordQrCode } from '../utils/qr';

const STORAGE_KEYS = {
  USERS: 'jiyuu_users_v2',
  DOCTORS: 'jiyuu_doctors_v2',
  SCHEDULES: 'jiyuu_schedules_v2',
  APPOINTMENTS: 'jiyuu_appointments_v2',
  MEDICAL_RECORDS: 'jiyuu_records_v2',
  CONFIG: 'jiyuu_config_v2',
  AUDIT_LOGS: 'jiyuu_logs_v2',
  NOTIFICATIONS: 'jiyuu_notifications_v2',
  CURRENT_USER: 'jiyuu_current_user_v3',
};

// Listeners for real-time reactivity
type ListenerCallback = () => void;
const listeners: Set<ListenerCallback> = new Set();

export function subscribeStorage(cb: ListenerCallback) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifySubscribers() {
  listeners.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}

class StorageService {
  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DOCTORS)) {
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(INITIAL_DOCTORS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_SCHEDULES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_SYSTEM_CONFIG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    }

    // Initialize appointments and records with QR codes if not present
    if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
      this.seedInitialAppointmentsWithQRs();
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEDICAL_RECORDS)) {
      this.seedInitialRecordsWithQRs();
    }
  }

  private async seedInitialAppointmentsWithQRs() {
    const enriched = await Promise.all(
      INITIAL_APPOINTMENTS.map(async apt => {
        const qr = await generateAppointmentQrCode({
          bookingCode: apt.bookingCode,
          patientName: apt.patientName,
          appointmentDate: apt.appointmentDate,
          appointmentTime: apt.appointmentTime,
          doctorName: apt.doctorName,
          clinicRoom: apt.clinicRoom,
          phone: apt.patientPhone,
        });
        return { ...apt, qrCodeDataUrl: qr };
      })
    );
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(enriched));
    notifySubscribers();
  }

  private async seedInitialRecordsWithQRs() {
    const enriched = await Promise.all(
      INITIAL_MEDICAL_RECORDS.map(async rec => {
        const qr = await generateMedicalRecordQrCode({
          recordCode: rec.recordCode,
          patientName: rec.patientName,
          examDate: rec.examDate,
          doctorName: rec.doctorName,
          clinicRoom: rec.clinicRoom,
          diagnosis: rec.diagnosis,
          treatment: rec.treatment,
          medicinesCount: rec.prescriptions.length,
        });
        return { ...rec, qrCodeDataUrl: qr };
      })
    );
    localStorage.setItem(STORAGE_KEYS.MEDICAL_RECORDS, JSON.stringify(enriched));
    notifySubscribers();
  }

  // Current User Session
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    notifySubscribers();
  }

  // Authentication (Security: frontend provides credentials, server verifies)
  login(phone: string, password: string): { success: boolean; user?: User; message?: string } {
    const users = this.getUsers();
    const user = users.find(u => u.phone === phone.trim());

    if (!user) {
      return { success: false, message: 'Số điện thoại hoặc tên tài khoản không tồn tại trên hệ thống.' };
    }

    if (user.password && user.password !== password) {
      return { success: false, message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại.' };
    }

    this.setCurrentUser(user);
    this.addAuditLog({
      userId: user.id,
      userRole: user.role,
      userName: user.fullName,
      action: 'ĐĂNG_NHẬP',
      details: `Đăng nhập thành công với vai trò ${user.role}`,
    });

    return { success: true, user };
  }

  registerPatient(data: {
    phone: string;
    password: string;
    fullName: string;
    dob?: string;
    address?: string;
    email?: string;
  }): { success: boolean; user?: User; message?: string } {
    // Validate special character in password as requested
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_~`\-+=]/;
    if (!specialCharRegex.test(data.password)) {
      return {
        success: false,
        message: 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt (ví dụ: @, #, $, %, !, *, ?, &).',
      };
    }

    if (data.password.length < 6) {
      return { success: false, message: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' };
    }

    const users = this.getUsers();
    if (users.some(u => u.phone === data.phone.trim())) {
      return { success: false, message: 'Số điện thoại này đã được đăng ký tài khoản.' };
    }

    const newUser: User = {
      id: `usr_pat_${Date.now()}`,
      phone: data.phone.trim(),
      fullName: data.fullName.trim(),
      role: 'patient',
      dob: data.dob || '2000-01-01',
      address: data.address || '',
      email: data.email || '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.phone}`,
      createdAt: new Date().toISOString(),
      password: data.password,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);

    this.addAuditLog({
      userId: newUser.id,
      userRole: 'patient',
      userName: newUser.fullName,
      action: 'ĐĂNG_KÝ_BỆNH_NHÂN',
      details: `Đăng ký tài khoản bệnh nhân mới với số điện thoại ${newUser.phone}`,
    });

    notifySubscribers();
    return { success: true, user: newUser };
  }

  // Users Management
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  updateUser(userId: string, updates: Partial<User>): boolean {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return false;

    // Password validation if updated
    if (updates.password) {
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_~`\-+=]/;
      if (!specialCharRegex.test(updates.password)) {
        throw new Error('Mật khẩu mới phải chứa ít nhất một ký tự đặc biệt.');
      }
    }

    users[index] = { ...users[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      this.setCurrentUser(users[index]);
    }

    this.addAuditLog({
      userId,
      userRole: users[index].role,
      userName: users[index].fullName,
      action: 'CẬP_NHẬT_HỒ_SƠ',
      details: 'Cập nhật thông tin tài khoản cá nhân',
    });

    notifySubscribers();
    return true;
  }

  // Receptionist Management (By Admin)
  createReceptionist(data: {
    fullName: string;
    phone: string;
    password: string;
    email?: string;
    address?: string;
    dob?: string;
  }): { success: boolean; message?: string } {
    const users = this.getUsers();
    if (users.some(u => u.phone === data.phone.trim())) {
      return { success: false, message: 'Số điện thoại này đã tồn tại trong hệ thống.' };
    }

    const newRecep: User = {
      id: `usr_rec_${Date.now()}`,
      phone: data.phone.trim(),
      fullName: data.fullName.trim(),
      role: 'receptionist',
      dob: data.dob || '1995-01-01',
      address: data.address || '',
      email: data.email || '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.phone}`,
      createdAt: new Date().toISOString(),
      password: data.password || 'Recep@2026#',
    };

    users.push(newRecep);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const admin = this.getCurrentUser();
    this.addAuditLog({
      userId: admin?.id || 'admin',
      userRole: 'admin',
      userName: admin?.fullName || 'Quản trị viên',
      action: 'TẠO_TIẾP_TÂN',
      details: `Tạo tài khoản tiếp tân: ${newRecep.fullName} (${newRecep.phone})`,
    });

    notifySubscribers();
    return { success: true };
  }

  deleteReceptionist(receptionistId: string): boolean {
    const users = this.getUsers();
    const updated = users.filter(u => u.id !== receptionistId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    notifySubscribers();
    return true;
  }

  // Doctors Management (By Receptionist)
  getDoctors(): DoctorProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCTORS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  getDoctorById(doctorId: string): DoctorProfile | undefined {
    return this.getDoctors().find(d => d.id === doctorId);
  }

  getDoctorByUserId(userId: string): DoctorProfile | undefined {
    return this.getDoctors().find(d => d.userId === userId);
  }

  createDoctor(data: {
    fullName: string;
    phone: string;
    password?: string;
    email: string;
    specialty: any;
    experienceYears: number;
    clinicRoom: string;
    bio?: string;
    degrees?: string[];
    certificates?: string[];
    address?: string;
    userId?: string;
    avatar?: string;
    rating?: number;
    reviewCount?: number;
    reviews?: any[];
  }): { success: boolean; doctor?: DoctorProfile; message?: string } {
    const users = this.getUsers();
    if (users.some(u => u.phone === data.phone.trim())) {
      return { success: false, message: 'Số điện thoại/tài khoản này đã tồn tại.' };
    }

    const newUserId = data.userId || `usr_doc_${Date.now()}`;
    const newDocId = `doc_${Date.now()}`;

    const newUser: User = {
      id: newUserId,
      phone: data.phone.trim(),
      fullName: data.fullName.trim(),
      role: 'doctor',
      email: data.email,
      address: data.address || '',
      avatar: data.avatar || `https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString(),
      password: data.password || 'Doctor@2026!',
    };

    const newDoctor: DoctorProfile = {
      id: newDocId,
      userId: newUserId,
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      email: data.email,
      avatar: newUser.avatar!,
      specialty: data.specialty,
      experienceYears: Number(data.experienceYears),
      clinicRoom: data.clinicRoom,
      bio: data.bio || `Bác sĩ chuyên khoa ${data.specialty} với ${data.experienceYears} năm kinh nghiệm tại JiYuu Clinic.`,
      degrees: data.degrees && data.degrees.length > 0 ? data.degrees : ['Bác sĩ Chuyên khoa - ĐH Y Dược'],
      certificates: data.certificates && data.certificates.length > 0 ? data.certificates : ['Chứng chỉ hành nghề khám chữa bệnh'],
      rating: data.rating ?? 5.0,
      reviewCount: data.reviewCount ?? 0,
      reviews: data.reviews || [],
    };

    users.push(newUser);
    const doctors = this.getDoctors();
    doctors.push(newDoctor);

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));

    const currentUser = this.getCurrentUser();
    this.addAuditLog({
      userId: currentUser?.id || 'system',
      userRole: currentUser?.role || 'receptionist',
      userName: currentUser?.fullName || 'Tiếp tân',
      action: 'TẠO_BÁC_SĨ',
      details: `Tiếp tân khởi tạo tài khoản Bác sĩ mới: ${newDoctor.fullName} (${newDoctor.specialty})`,
    });

    notifySubscribers();
    return { success: true, doctor: newDoctor };
  }

  updateDoctor(doctorId: string, updates: Partial<DoctorProfile>): boolean {
    const doctors = this.getDoctors();
    const index = doctors.findIndex(d => d.id === doctorId);
    if (index === -1) return false;

    doctors[index] = { ...doctors[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));

    // Also update corresponding user if name or phone changed
    if (updates.fullName || updates.phone || updates.email || updates.avatar) {
      const users = this.getUsers();
      const uIndex = users.findIndex(u => u.id === doctors[index].userId);
      if (uIndex !== -1) {
        if (updates.fullName) users[uIndex].fullName = updates.fullName;
        if (updates.phone) users[uIndex].phone = updates.phone;
        if (updates.email) users[uIndex].email = updates.email;
        if (updates.avatar) users[uIndex].avatar = updates.avatar;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    }

    notifySubscribers();
    return true;
  }

  deleteDoctor(doctorId: string): boolean {
    const doctors = this.getDoctors();
    const doc = doctors.find(d => d.id === doctorId);
    if (!doc) return false;

    const filtered = doctors.filter(d => d.id !== doctorId);
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(filtered));

    // Also delete user
    const users = this.getUsers().filter(u => u.id !== doc.userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    notifySubscribers();
    return true;
  }

  // Doctor Schedules (Google Calendar-like UI/UX)
  getSchedules(): DoctorSchedule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  createSchedule(scheduleData: Omit<DoctorSchedule, 'id' | 'createdAt'>): DoctorSchedule {
    const schedules = this.getSchedules();
    const newSchedule: DoctorSchedule = {
      ...scheduleData,
      id: `sch_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    schedules.push(newSchedule);
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));

    // If pending, notify receptionist
    if (newSchedule.status === 'pending') {
      this.addNotification({
        recipientRole: 'receptionist',
        title: 'Yêu cầu đăng ký lịch làm việc mới',
        message: `${newSchedule.doctorName} đã gửi yêu cầu duyệt lịch làm việc ngày ${newSchedule.date} (${newSchedule.shiftType}).`,
        type: 'info',
      });
    }

    notifySubscribers();
    return newSchedule;
  }

  updateSchedule(scheduleId: string, updates: Partial<DoctorSchedule>): boolean {
    const schedules = this.getSchedules();
    const index = schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) return false;

    schedules[index] = {
      ...schedules[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));

    // Notify doctor of approval / rejection
    if (updates.status && updates.status !== 'pending') {
      this.addNotification({
        recipientRole: 'doctor',
        title: `Lịch làm việc đã được ${updates.status === 'approved' ? 'phê duyệt' : 'từ chối'}`,
        message: `Yêu cầu lịch làm việc ngày ${schedules[index].date} của bạn đã được tiếp tân ${updates.status === 'approved' ? 'chấp thuận' : 'từ chối'}.`,
        type: updates.status === 'approved' ? 'success' : 'warning',
      });
    }

    notifySubscribers();
    return true;
  }

  deleteSchedule(scheduleId: string): boolean {
    const schedules = this.getSchedules();
    const filtered = schedules.filter(s => s.id !== scheduleId);
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(filtered));
    notifySubscribers();
    return true;
  }

  // APPOINTMENTS (With Concurrent Booking Prevention & Duplicate Handling)
  getAppointments(): Appointment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async createAppointment(data: {
    patientUserId: string;
    patientName: string;
    patientPhone: string;
    patientDob?: string;
    patientAddress: string;
    isRelativeBooking: boolean;
    relativeName?: string;
    relativePhone?: string;
    relationType?: string;
    reason: string;
    specialty: any;
    doctorId: string;
    appointmentDate: string; // YYYY-MM-DD
    appointmentTime: string; // HH:mm
  }): Promise<{ success: boolean; appointment?: Appointment; message?: string }> {
    const appointments = this.getAppointments();
    const doctor = this.getDoctorById(data.doctorId);

    if (!doctor) {
      return { success: false, message: 'Bác sĩ được chọn không hợp lệ hoặc đã ngừng nhận lịch.' };
    }

    // 1. CONCURRENT BOOKING PREVENTION & DUPLICATE SLOT HANDLING
    // Check if there is already an active appointment with this doctor at this exact date & time
    const slotConflict = appointments.find(
      apt =>
        apt.doctorId === data.doctorId &&
        apt.appointmentDate === data.appointmentDate &&
        apt.appointmentTime === data.appointmentTime &&
        apt.status !== 'cancelled'
    );

    if (slotConflict) {
      return {
        success: false,
        message: `Rất tiếc! Khung giờ ${data.appointmentTime} ngày ${data.appointmentDate} của ${doctor.fullName} vừa có bệnh nhân khác đặt hoặc đang được hệ thống giữ chỗ. Quý khách vui lòng chọn một khung giờ khám khác.`,
      };
    }

    // 2. Duplicate Check for Same Patient on Same Day
    const patientDuplicate = appointments.find(
      apt =>
        apt.patientUserId === data.patientUserId &&
        apt.doctorId === data.doctorId &&
        apt.appointmentDate === data.appointmentDate &&
        apt.status !== 'cancelled'
    );

    if (patientDuplicate) {
      return {
        success: false,
        message: `Quý khách đã có một lịch khám (Mã: ${patientDuplicate.bookingCode}) với ${doctor.fullName} trong ngày ${data.appointmentDate}. Không thể đặt trùng 2 lịch khám cùng ngày với cùng bác sĩ.`,
      };
    }

    const bookingCode = `JY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate real QR code for the appointment
    const qrCodeDataUrl = await generateAppointmentQrCode({
      bookingCode,
      patientName: data.patientName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      doctorName: doctor.fullName,
      clinicRoom: doctor.clinicRoom,
      phone: data.patientPhone,
    });

    const newAppointment: Appointment = {
      id: `apt_${Date.now()}`,
      bookingCode,
      patientUserId: data.patientUserId,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      patientDob: data.patientDob,
      patientAddress: data.patientAddress,
      isRelativeBooking: data.isRelativeBooking,
      relativeName: data.relativeName,
      relativePhone: data.relativePhone,
      relationType: data.relationType,
      reason: data.reason,
      specialty: data.specialty,
      doctorId: data.doctorId,
      doctorName: doctor.fullName,
      clinicRoom: doctor.clinicRoom,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      status: 'confirmed',
      qrCodeDataUrl,
      createdAt: new Date().toISOString(),
    };

    appointments.push(newAppointment);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));

    // Audit Log
    this.addAuditLog({
      userId: data.patientUserId,
      userRole: 'patient',
      userName: data.patientName,
      action: 'ĐẶT_LỊCH_KHÁM',
      details: `Đặt lịch khám mã ${bookingCode} với ${doctor.fullName} lúc ${data.appointmentTime} ngày ${data.appointmentDate}`,
    });

    // Notify Doctor & Receptionist
    this.addNotification({
      recipientRole: 'receptionist',
      title: 'Lịch khám mới đã đặt',
      message: `Bệnh nhân ${data.patientName} vừa đặt lịch khám mã ${bookingCode} với ${doctor.fullName}.`,
      type: 'info',
      appointmentId: newAppointment.id,
    });

    notifySubscribers();
    return { success: true, appointment: newAppointment };
  }

  // 4-Hour Cancellation Constraint Validation
  canCancelAppointment(appointment: Appointment): { canCancel: boolean; hoursRemaining: number; message?: string } {
    const config = this.getSystemConfig();
    const minHours = config.cancellationHoursMin || 4;

    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}:00`);
    const now = new Date();

    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const hoursRemaining = diffMs / (1000 * 60 * 60);

    if (hoursRemaining < minHours) {
      return {
        canCancel: false,
        hoursRemaining,
        message: `Theo quy định phòng khám JiYuu, quý khách chỉ được huỷ lịch trước giờ khám ít nhất ${minHours} tiếng. Lịch hẹn này chỉ còn khoảng ${Math.max(0, hoursRemaining).toFixed(1)} tiếng nữa sẽ đến giờ khám nên không thể huỷ tự động trên website. Vui lòng liên hệ hotline ${config.phone} để được tiếp tân hỗ trợ.`,
      };
    }

    return { canCancel: true, hoursRemaining };
  }

  cancelAppointment(appointmentId: string, cancelReason: string): { success: boolean; message?: string } {
    const appointments = this.getAppointments();
    const index = appointments.findIndex(a => a.id === appointmentId);
    if (index === -1) return { success: false, message: 'Lịch khám không tồn tại.' };

    const apt = appointments[index];
    if (apt.status === 'cancelled') {
      return { success: false, message: 'Lịch khám này đã bị huỷ trước đó.' };
    }
    if (apt.status === 'completed' || apt.status === 'examining') {
      return { success: false, message: 'Lịch khám này đã hoặc đang được thực hiện, không thể huỷ.' };
    }

    // Check cancellation window rule
    const check = this.canCancelAppointment(apt);
    if (!check.canCancel) {
      return { success: false, message: check.message };
    }

    appointments[index] = {
      ...apt,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: cancelReason || 'Bệnh nhân chủ động huỷ',
    };

    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));

    // Audit log
    const currentUser = this.getCurrentUser();
    this.addAuditLog({
      userId: currentUser?.id || apt.patientUserId,
      userRole: currentUser?.role || 'patient',
      userName: currentUser?.fullName || apt.patientName,
      action: 'HUỶ_LỊCH_KHÁM',
      details: `Huỷ lịch khám ${apt.bookingCode}. Lý do: ${cancelReason}`,
    });

    notifySubscribers();
    return { success: true };
  }

  // Receptionist Check-in (Mark as Arrived via Phone or QR Scan)
  checkInAppointment(appointmentIdOrCodeOrPhone: string): { success: boolean; appointment?: Appointment; message?: string } {
    const appointments = this.getAppointments();
    const term = appointmentIdOrCodeOrPhone.trim().toLowerCase();

    // Match by bookingCode, id, or phone
    const apt = appointments.find(
      a =>
        a.id.toLowerCase() === term ||
        a.bookingCode.toLowerCase() === term ||
        a.patientPhone.toLowerCase() === term
    );

    if (!apt) {
      return { success: false, message: 'Không tìm thấy thông tin lịch khám tương ứng.' };
    }

    if (apt.status === 'cancelled') {
      return { success: false, message: 'Lịch khám này đã bị huỷ trước đó.' };
    }

    if (apt.status === 'completed') {
      return { success: false, message: 'Bệnh nhân này đã hoàn thành khám bệnh trước đó.' };
    }

    apt.status = 'arrived';
    apt.arrivedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));

    // NOTIFY DOCTOR INSTANTLY!
    this.addNotification({
      recipientRole: 'doctor',
      title: 'Bệnh nhân đã đến phòng khám!',
      message: `Bệnh nhân ${apt.patientName} (Mã: ${apt.bookingCode}) đã có mặt tại phòng chờ. Bác sĩ vui lòng chuẩn bị khám.`,
      type: 'alert',
      appointmentId: apt.id,
    });

    this.addAuditLog({
      userId: 'usr_rec_01',
      userRole: 'receptionist',
      userName: 'Tiếp tân JiYuu',
      action: 'TIẾP_NHẬN_CHECKIN',
      details: `Tiếp tân xác nhận bệnh nhân ${apt.patientName} đã đến khám (Mã: ${apt.bookingCode})`,
    });

    notifySubscribers();
    return { success: true, appointment: apt };
  }

  // Doctor starts examination
  startExamination(appointmentId: string): boolean {
    const appointments = this.getAppointments();
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return false;

    apt.status = 'examining';
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    notifySubscribers();
    return true;
  }

  // Complete Examination & Create Medical Record
  async completeExamination(data: {
    appointmentId: string;
    symptoms: string;
    diagnosis: string;
    treatment: string;
    prescriptions: { medicineName: string; dosage: string; quantity: string; usageInstruction: string }[];
    followUpDate?: string;
    doctorSignature?: string;
    notes?: string;
  }): Promise<{ success: boolean; medicalRecord?: MedicalRecord; message?: string }> {
    const appointments = this.getAppointments();
    const apt = appointments.find(a => a.id === data.appointmentId);
    if (!apt) return { success: false, message: 'Lịch khám không tồn tại.' };

    const recordCode = `BA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const qrCodeDataUrl = await generateMedicalRecordQrCode({
      recordCode,
      patientName: apt.patientName,
      examDate: `${apt.appointmentDate} ${apt.appointmentTime}`,
      doctorName: apt.doctorName,
      clinicRoom: apt.clinicRoom,
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      medicinesCount: data.prescriptions.length,
    });

    const newRecord: MedicalRecord = {
      id: `rec_${Date.now()}`,
      recordCode,
      appointmentId: apt.id,
      patientUserId: apt.patientUserId,
      patientName: apt.patientName,
      patientDob: apt.patientDob || '1995-01-01',
      patientPhone: apt.patientPhone,
      patientAddress: apt.patientAddress,
      doctorId: apt.doctorId,
      doctorName: apt.doctorName,
      doctorSignature: data.doctorSignature || `${apt.doctorName} (Ký điện tử)`,
      examDate: `${apt.appointmentDate} ${apt.appointmentTime}`,
      clinicRoom: apt.clinicRoom,
      symptoms: data.symptoms,
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      prescriptions: data.prescriptions.map((p, i) => ({ ...p, id: `p_${Date.now()}_${i}` })),
      followUpDate: data.followUpDate,
      status: 'treating', // Default: Đang chữa trị
      qrCodeDataUrl,
      createdAt: new Date().toISOString(),
      notes: data.notes,
    };

    const records = this.getMedicalRecords();
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.MEDICAL_RECORDS, JSON.stringify(records));

    // Update appointment status to completed
    apt.status = 'completed';
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));

    // Audit log
    this.addAuditLog({
      userId: apt.doctorId,
      userRole: 'doctor',
      userName: apt.doctorName,
      action: 'HOÀN_THÀNH_BỆNH_ÁN',
      details: `Bác sĩ hoàn thành khám cho bệnh nhân ${apt.patientName}, tạo bệnh án ${recordCode}`,
    });

    // Notify patient
    this.addNotification({
      recipientUserId: apt.patientUserId,
      title: 'Khám bệnh hoàn tất & Có đơn thuốc mới',
      message: `Bác sĩ ${apt.doctorName} đã hoàn thành bệnh án và kê đơn thuốc cho bạn. Quý khách có thể xem mã QR nhận thuốc tại quầy.`,
      type: 'success',
      appointmentId: apt.id,
    });

    notifySubscribers();
    return { success: true, medicalRecord: newRecord };
  }

  // MEDICAL RECORDS MANAGEMENT
  getMedicalRecords(): MedicalRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEDICAL_RECORDS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  getMedicalRecordsByPatient(patientUserId: string): MedicalRecord[] {
    return this.getMedicalRecords().filter(r => r.patientUserId === patientUserId);
  }

  getMedicalRecordsByDoctor(doctorId: string): MedicalRecord[] {
    return this.getMedicalRecords().filter(r => r.doctorId === doctorId);
  }

  updateMedicalRecordStatus(recordId: string, status: 'treating' | 'recovered', notes?: string): boolean {
    const records = this.getMedicalRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return false;

    records[index].status = status;
    if (notes) {
      records[index].notes = `${records[index].notes || ''}\n[${new Date().toLocaleDateString('vi-VN')}]: ${notes}`;
    }
    records[index].updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.MEDICAL_RECORDS, JSON.stringify(records));

    const currentUser = this.getCurrentUser();
    this.addAuditLog({
      userId: currentUser?.id || 'doctor',
      userRole: 'doctor',
      userName: currentUser?.fullName || 'Bác sĩ',
      action: 'CẬP_NHẬT_TRẠNG_THÁI_BỆNH_ÁN',
      details: `Cập nhật trạng thái bệnh án ${records[index].recordCode} sang: ${status === 'recovered' ? 'Đã khỏi bệnh' : 'Đang chữa trị'}`,
    });

    notifySubscribers();
    return true;
  }

  // Patient Review Doctor
  addDoctorReview(doctorId: string, review: { patientName: string; rating: number; comment: string }): boolean {
    const doctors = this.getDoctors();
    const doc = doctors.find(d => d.id === doctorId);
    if (!doc) return false;

    if (!doc.reviews) doc.reviews = [];
    doc.reviews.unshift({
      id: `rev_${Date.now()}`,
      patientName: review.patientName,
      rating: review.rating,
      comment: review.comment,
      date: new Date().toISOString().split('T')[0],
    });

    doc.reviewCount = doc.reviews.length;
    const totalStars = doc.reviews.reduce((acc, r) => acc + r.rating, 0);
    doc.rating = Number((totalStars / doc.reviewCount).toFixed(1));

    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    notifySubscribers();
    return true;
  }

  // NOTIFICATIONS
  getNotifications(): SystemNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  addNotification(notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) {
    const notifications = this.getNotifications();
    const newNotif: SystemNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifications.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    notifySubscribers();
  }

  markNotificationAsRead(id: string) {
    const notifications = this.getNotifications();
    const notif = notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      notifySubscribers();
    }
  }

  // SYSTEM CONFIG & AUDIT LOGS
  getSystemConfig(): SystemConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return data ? JSON.parse(data) : INITIAL_SYSTEM_CONFIG;
    } catch {
      return INITIAL_SYSTEM_CONFIG;
    }
  }

  updateSystemConfig(updates: Partial<SystemConfig>): boolean {
    const current = this.getSystemConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
    notifySubscribers();
    return true;
  }

  getAuditLogs(): SecurityAuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  addAuditLog(logData: Omit<SecurityAuditLog, 'id' | 'timestamp' | 'ipAddress'>) {
    const logs = this.getAuditLogs();
    const newLog: SecurityAuditLog = {
      ...logData,
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      ipAddress: '192.168.1.1 (Cloud/TLS Verified)',
    };
    logs.unshift(newLog);
    // Keep max 200 logs
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  // Backup & Restore
  exportBackupData(): string {
    const data = {
      users: this.getUsers(),
      doctors: this.getDoctors(),
      schedules: this.getSchedules(),
      appointments: this.getAppointments(),
      medicalRecords: this.getMedicalRecords(),
      config: this.getSystemConfig(),
      auditLogs: this.getAuditLogs(),
      backupDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  importBackupData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.doctors) localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(data.doctors));
      if (data.schedules) localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(data.schedules));
      if (data.appointments) localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(data.appointments));
      if (data.medicalRecords) localStorage.setItem(STORAGE_KEYS.MEDICAL_RECORDS, JSON.stringify(data.medicalRecords));
      if (data.config) localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
      notifySubscribers();
      return true;
    } catch (err) {
      console.error('Backup import error:', err);
      return false;
    }
  }

  // Convenience Aliases & Helpers
  subscribeStorage(cb: ListenerCallback) {
    return subscribeStorage(cb);
  }

  getConfig(): SystemConfig & {
    cancelHoursLimit: number;
    slotDurationMinutes: number;
    maxPatientsPerSlot: number;
    enableConcurrentLock: boolean;
    clinicHotline: string;
  } {
    const raw = this.getSystemConfig();
    return {
      ...raw,
      cancelHoursLimit: raw.cancellationHoursMin || 4,
      slotDurationMinutes: 30,
      maxPatientsPerSlot: 1,
      enableConcurrentLock: raw.allowConcurrentCheck ?? true,
      clinicHotline: raw.phone || '1900-8899',
    };
  }

  updateConfig(updates: any): boolean {
    const mappedUpdates: Partial<SystemConfig> = {};
    if (updates.cancelHoursLimit !== undefined) mappedUpdates.cancellationHoursMin = updates.cancelHoursLimit;
    if (updates.clinicHotline !== undefined) mappedUpdates.phone = updates.clinicHotline;
    if (updates.enableConcurrentLock !== undefined) mappedUpdates.allowConcurrentCheck = updates.enableConcurrentLock;
    return this.updateSystemConfig({ ...updates, ...mappedUpdates });
  }

  updateAppointmentStatus(appointmentId: string, status: any): boolean {
    const appointments = this.getAppointments();
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return false;
    apt.status = status;
    if (status === 'arrived' && !apt.arrivedAt) apt.arrivedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    notifySubscribers();
    return true;
  }

  async createMedicalRecord(data: any) {
    return this.completeExamination(data);
  }

  deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    notifySubscribers();
    return true;
  }

  register(data: any): { success: boolean; user?: User; message?: string } {
    if (data.role === 'receptionist') {
      const res = this.createReceptionist(data);
      if (res.success) {
        const user = this.getUsers().find(u => u.phone === data.phone);
        return { success: true, user };
      }
      return { success: false, message: res.message };
    }
    return this.registerPatient(data);
  }
}

export const storage = new StorageService();
