import React, { useState, useEffect } from 'react';
import { User, Appointment, PrescriptionItem, Specialty } from '../../types';
import { storage } from '../../services/storage';
import { DoctorExamAlertModal } from '../common/DoctorExamAlertModal';
import { SignaturePad } from '../common/SignaturePad';
import {
  Stethoscope,
  Users,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  Pill,
  Save,
  QrCode,
  Calendar,
  Building2,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface DoctorExaminationProps {
  currentUser: User | null;
}

export const DoctorExamination: React.FC<DoctorExaminationProps> = ({ currentUser }) => {
  const doctor = currentUser ? storage.getDoctorByUserId(currentUser.id) : null;
  const [allAppointments, setAllAppointments] = useState<Appointment[]>(() => storage.getAppointments());

  useEffect(() => {
    const unsub = storage.subscribeStorage(() => {
      setAllAppointments(storage.getAppointments());
    });
    return unsub;
  }, []);

  // Filter appointments assigned to this doctor
  const doctorAppointments = doctor
    ? allAppointments.filter(apt => apt.doctorId === doctor.id)
    : [];

  // Active appointment being examined
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  // Alert modal when starting exam
  const [alertCandidate, setAlertCandidate] = useState<Appointment | null>(null);

  // Form states for clinical examination
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [recordStatus, setRecordStatus] = useState<'treatment' | 'recovered'>('treatment');
  const [followUpDate, setFollowUpDate] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    { medicineName: 'Paracetamol 500mg', dosage: '1 viên / lần', quantity: '10 viên', usageInstruction: 'Uống sau ăn khi sốt trên 38.5 độ' },
  ]);

  // Electronic Signature
  const [signatureData, setSignatureData] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!doctor) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-2xl mx-auto">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h4 className="font-bold text-slate-800 text-sm">Chưa tìm thấy thông tin Bác sĩ</h4>
        <p className="text-xs text-slate-500 mt-1">
          Vui lòng kiểm tra quyền truy cập hoặc đăng nhập tài khoản Bác sĩ.
        </p>
      </div>
    );
  }

  // Queue of patients waiting or arrived today
  const waitingQueue = doctorAppointments.filter(
    apt => apt.status === 'arrived' || apt.status === 'confirmed' || apt.status === 'examining'
  );
  const completedToday = doctorAppointments.filter(apt => apt.status === 'completed');

  // Triggered when Doctor clicks "Bắt đầu khám"
  const handleTriggerStartExam = (apt: Appointment) => {
    setAlertCandidate(apt);
  };

  // Confirmed on modal with chime audio
  const handleConfirmStartExam = (apt: Appointment) => {
    storage.updateAppointmentStatus(apt.id, 'examining');
    setActiveAppointment(apt);
    setAlertCandidate(null);
    setSymptoms(apt.reason || '');
    setDiagnosis('');
    setTreatment('Nghỉ ngơi hợp lý, uống nhiều nước ấm, dùng thuốc theo đơn.');
    setErrorMessage('');
    setSuccessMessage(`Đang bắt đầu buổi khám cho bệnh nhân ${apt.patientName}`);
  };

  // Add prescription item
  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medicineName: '', dosage: '', quantity: '', usageInstruction: '' },
    ]);
  };

  const handleRemovePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index: number, field: keyof PrescriptionItem, val: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: val };
    setPrescriptions(updated);
  };

  // Submit and complete examination
  const handleFinalizeExamination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointment) return;

    if (!diagnosis.trim()) {
      setErrorMessage('Vui lòng nhập chẩn đoán xác định cho bệnh nhân.');
      return;
    }

    if (!signatureData) {
      setErrorMessage('Bác sĩ vui lòng ký tên vào khung chữ ký điện tử bên dưới để chứng thực bệnh án.');
      return;
    }

    try {
      // 1. Create medical record with electronic signature & generate pharmacy QR code
      const res = await storage.createMedicalRecord({
        appointmentId: activeAppointment.id,
        patientUserId: activeAppointment.patientUserId,
        patientName: activeAppointment.patientName,
        patientPhone: activeAppointment.patientPhone,
        patientAddress: activeAppointment.patientAddress,
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        clinicRoom: doctor.clinicRoom,
        examDate: new Date().toISOString().split('T')[0],
        symptoms,
        diagnosis,
        treatment,
        prescriptions: prescriptions.filter(p => p.medicineName.trim() !== ''),
        followUpDate: followUpDate || undefined,
        status: recordStatus,
        doctorSignature: signatureData,
      });

      if (!res.success || !res.medicalRecord) {
        throw new Error(res.message || 'Không thể tạo bệnh án.');
      }

      const rec = res.medicalRecord;

      // 2. Mark appointment as completed
      storage.updateAppointmentStatus(activeAppointment.id, 'completed');

      setSuccessMessage(`Đã lưu và hoàn tất ca khám cho bệnh nhân ${rec.patientName}! Hồ sơ bệnh án ${rec.recordCode} đã được khởi tạo thành công.`);
      setActiveAppointment(null);
      setSymptoms('');
      setDiagnosis('');
      setTreatment('');
      setSignatureData('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi hoàn thành bệnh án.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Doctor Header Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Phòng Khám Lâm Sàng & Khám Bệnh
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">
              {doctor.clinicRoom}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bác sĩ phụ trách: <strong>{doctor.fullName}</strong> • Chuyên khoa {doctor.specialty}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-4 py-2 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-center">
            <span className="block text-lg font-black">{waitingQueue.length}</span>
            <span className="font-semibold text-[10px] uppercase">Chờ khám</span>
          </div>
          <div className="px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-center">
            <span className="block text-lg font-black">{completedToday.length}</span>
            <span className="font-semibold text-[10px] uppercase">Đã khám</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Active Examination Workspace */}
      {activeAppointment ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-teal-500 space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-teal-600 font-bold uppercase tracking-wider block">
                  Đang trong ca khám bệnh
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {activeAppointment.patientName} ({activeAppointment.patientPhone})
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 bg-slate-100 font-mono font-bold rounded-xl text-slate-700">
                Mã lịch: {activeAppointment.bookingCode}
              </span>
              <button
                type="button"
                onClick={() => setActiveAppointment(null)}
                className="px-3 py-1 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Tạm dừng
              </button>
            </div>
          </div>

          <form onSubmit={handleFinalizeExamination} className="space-y-6">
            {/* Patient Context Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Địa chỉ bệnh nhân:</span>
                <span className="font-semibold text-slate-800">{activeAppointment.patientAddress}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Giờ hẹn đăng ký:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {activeAppointment.appointmentTime} - {activeAppointment.appointmentDate}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Lý do ban đầu:</span>
                <span className="font-semibold text-teal-800 italic">"{activeAppointment.reason}"</span>
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Triệu chứng lâm sàng ghi nhận qua thăm khám:
                </label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  placeholder="Ghi nhận tiếng thở, huyết áp, nhiệt độ, nhịp tim, cơn đau..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Chẩn đoán xác định bệnh lý <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    placeholder="VD: Viêm phế quản cấp, Viêm dạ dày tá tràng..."
                    className="w-full p-2.5 text-xs font-bold text-teal-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Trạng thái tiến triển bệnh:
                  </label>
                  <select
                    value={recordStatus}
                    onChange={e => setRecordStatus(e.target.value as any)}
                    className="w-full p-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="treatment">Đang điều trị (Cần theo dõi và dùng thuốc)</option>
                    <option value="recovered">Đã bình phục / Khỏi bệnh hoàn toàn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  3. Phương pháp điều trị & Lời dặn dò bác sĩ:
                </label>
                <textarea
                  rows={2}
                  value={treatment}
                  onChange={e => setTreatment(e.target.value)}
                  placeholder="Chế độ dinh dưỡng, vận động, kiêng khem và hướng dẫn điều trị..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>
            </div>

            {/* Prescriptions Section */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-teal-600" />
                  Kê đơn thuốc điện tử
                </span>
                <button
                  type="button"
                  onClick={handleAddPrescription}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm thuốc
                </button>
              </div>

              <div className="space-y-2">
                {prescriptions.map((p, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 bg-white rounded-xl border border-slate-200 items-center text-xs"
                  >
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Tên thuốc & biệt dược..."
                        value={p.medicineName}
                        onChange={e => handlePrescriptionChange(idx, 'medicineName', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Hàm lượng (vd: 500mg)"
                        value={p.dosage}
                        onChange={e => handlePrescriptionChange(idx, 'dosage', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Số lượng (vd: 20 viên)"
                        value={p.quantity}
                        onChange={e => handlePrescriptionChange(idx, 'quantity', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Cách dùng: ngày 2 lần sau ăn..."
                        value={p.usageInstruction}
                        onChange={e => handlePrescriptionChange(idx, 'usageInstruction', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 italic"
                      />
                    </div>
                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemovePrescription(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Xoá thuốc này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up & Electronic Signature */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Ngày hẹn tái khám (Nếu cần):
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nếu không cần tái khám, có thể để trống trường này.
                </p>
              </div>

              {/* ELECTRONIC SIGNATURE PAD */}
              <div>
                <SignaturePad
                  onSignatureChange={data => setSignatureData(data)}
                  onSave={data => setSignatureData(data)}
                  doctorName={doctor.fullName}
                  initialSignature={signatureData}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveAppointment(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu và Hoàn tất khám bệnh</span>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Patient Waiting Queue */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Danh Sách Bệnh Nhân Chờ Khám Trong Ngày
          </h3>
          <span className="text-xs text-slate-500">
            Tổng số: <strong>{waitingQueue.length}</strong> bệnh nhân
          </span>
        </div>

        {waitingQueue.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Hiện tại không có bệnh nhân nào trong hàng đợi khám.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {waitingQueue.map((apt, index) => {
              const isExamining = apt.status === 'examining';
              const isArrived = apt.status === 'arrived';

              return (
                <div
                  key={apt.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 font-bold font-mono text-sm flex items-center justify-center shrink-0 border border-teal-100">
                      {index + 1}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{apt.patientName}</h4>
                        <span className="text-xs font-mono text-slate-500">({apt.patientPhone})</span>
                        {isExamining && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold animate-pulse">
                            Đang khám
                          </span>
                        )}
                        {isArrived && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            Đã check-in tại quầy
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Giờ hẹn: <strong className="font-mono">{apt.appointmentTime}</strong> ngày{' '}
                        {apt.appointmentDate} • Lý do: <em>"{apt.reason}"</em>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerStartExam(apt)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isExamining
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isExamining ? 'Tiếp tục khám' : 'Bắt đầu khám'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert Modal with chime sound when triggering exam */}
      <DoctorExamAlertModal
        appointment={alertCandidate}
        isOpen={!!alertCandidate}
        onClose={() => setAlertCandidate(null)}
        onStartExam={handleConfirmStartExam}
        onConfirm={handleConfirmStartExam}
      />
    </div>
  );
};
