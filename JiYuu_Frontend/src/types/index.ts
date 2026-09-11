export type UserRole = 'patient' | 'doctor' | 'receptionist' | 'admin';

export type Specialty = 'Khoa Nội' | 'Khoa Ngoại' | 'Chuyên khoa Khác';

export interface User {
  id: string;
  phone: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  dob?: string;
  address?: string;
  email?: string;
  createdAt: string;
  password?: string; // Stored securely in storage simulation
  isActive?: boolean; // Khoá / mở khoá tài khoản
}

export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  avatar: string;
  specialty: Specialty;
  experienceYears: number;
  clinicRoom: string;
  bio: string;
  degrees: string[]; // Bằng cấp
  certificates: string[]; // Chứng chỉ hành nghề
  rating: number; // Điểm đánh giá (1-5 sao)
  reviewCount: number;
  reviews?: DoctorReview[];
}

export interface DoctorReview {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

export type ScheduleStatus = 'approved' | 'pending' | 'rejected';

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: Specialty;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  shiftType: 'Ca sáng (08:00 - 12:00)' | 'Ca chiều (13:30 - 17:30)' | 'Ca tối (18:00 - 21:00)' | 'Cả ngày';
  clinicRoom: string;
  status: ScheduleStatus;
  changeReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AppointmentStatus = 
  | 'pending' // Chờ tiếp tân duyệt/chờ đến ngày
  | 'confirmed' // Đã xác nhận
  | 'arrived' // Bệnh nhân đã đến khám (Tiếp tân quét QR/checkin)
  | 'examining' // Bác sĩ đang khám
  | 'completed' // Đã khám xong
  | 'cancelled'; // Đã huỷ

export interface Appointment {
  id: string;
  bookingCode: string; // e.g. JY-2026-8899
  patientUserId: string;
  // Patient details (supports booking for relatives)
  patientName: string;
  patientPhone: string;
  patientDob?: string;
  patientAddress: string;
  isRelativeBooking: boolean;
  relativeName?: string;
  relativePhone?: string;
  relationType?: string; // Bố/Mẹ/Con/Vợ/Chồng/Khác
  reason: string;
  specialty: Specialty;
  doctorId: string;
  doctorName: string;
  clinicRoom: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  status: AppointmentStatus;
  qrCodeDataUrl?: string; // QR code image URL
  createdAt: string;
  arrivedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  reviewed?: boolean;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string; // e.g. 500mg
  quantity: string; // e.g. 20 viên
  usageInstruction: string; // e.g. Uống 1 viên sau ăn sáng - chiều
}

export type MedicalRecordStatus = 'treating' | 'recovered'; // Đang chữa trị | Đã khỏi bệnh

export interface MedicalRecord {
  id: string;
  recordCode: string; // e.g. BA-2026-0042
  appointmentId: string;
  patientUserId: string;
  patientName: string;
  patientDob: string;
  patientPhone: string;
  patientAddress: string;
  doctorId: string;
  doctorName: string;
  doctorSignature?: string; // Base64 data URL signature
  examDate: string; // YYYY-MM-DD HH:mm
  clinicRoom: string;
  symptoms: string; // Triệu chứng
  diagnosis: string; // Chẩn đoán
  treatment: string; // Phương pháp điều trị
  prescriptions: PrescriptionItem[];
  followUpDate?: string; // Ngày hẹn tái khám
  status: MedicalRecordStatus;
  qrCodeDataUrl?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface SystemConfig {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  cancellationHoursMin: number; // Mặc định: 4 tiếng
  workingHoursStart: string; // 08:00
  workingHoursEnd: string; // 21:00
  allowConcurrentCheck: boolean;
  securityAuditEnabled: boolean;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userRole: UserRole;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
}

export type AuditLog = SecurityAuditLog;

export interface SystemNotification {
  id: string;
  recipientRole?: UserRole;
  recipientUserId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  read: boolean;
  appointmentId?: string;
}

export const DEFAULT_DOCTOR_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="28" fill="%23F0FDFA"/><circle cx="60" cy="46" r="22" fill="%230D9488"/><path d="M26 102C26 83.222 41.222 68 60 68C78.778 68 94 83.222 94 102" fill="%230D9488"/><circle cx="60" cy="46" r="18" fill="%2399F6E4"/><path d="M50 78L56 94L60 84L64 94L70 78" stroke="%23FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

