import React, { useState, useMemo, useEffect } from 'react';
import { User, Appointment } from '../../types';
import { storage } from '../../services/storage';
import { QrScannerModal } from '../common/QrScannerModal';
import { CheckInConfirmModal } from '../common/CheckInConfirmModal';
import {
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  Calendar,
  AlertCircle,
  Users,
  Filter,
  RefreshCw,
  Phone,
} from 'lucide-react';

interface ReceptionistAppointmentsProps {
  currentUser: User | null;
}

export const ReceptionistAppointments: React.FC<ReceptionistAppointmentsProps> = ({ currentUser }) => {
  const [appointments, setAppointments] = useState<Appointment[]>(() => storage.getAppointments());

  useEffect(() => {
    const unsub = storage.subscribeStorage(() => {
      setAppointments(storage.getAppointments());
    });
    return unsub;
  }, []);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedQrAppointment, setSelectedQrAppointment] = useState<Appointment | null>(null);

  // Check-In Confirmation Modal
  const [checkInCandidate, setCheckInCandidate] = useState<Appointment | null>(null);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Open confirmation modal for check-in
  const handleOpenCheckInModal = (apt: Appointment) => {
    setCheckInCandidate(apt);
  };

  // Confirm patient arrival & notify doctor
  const handleConfirmCheckIn = (apt: Appointment, note?: string) => {
    const success = storage.updateAppointmentStatus(apt.id, 'arrived');
    if (success) {
      // Send urgent alert notification to the assigned doctor
      storage.addNotification({
        recipientRole: 'doctor',
        recipientUserId: apt.doctorId,
        title: `Bệnh nhân đã đến khám: ${apt.patientName}`,
        message: `Bệnh nhân ${apt.patientName} (Mã phiếu: ${apt.bookingCode}) đã có mặt tại phòng chờ ${apt.clinicRoom}. ${note ? `Ghi chú lễ tân: "${note}".` : 'Bác sĩ vui lòng chuẩn bị tiếp nhận khám.'}`,
        type: 'alert',
        appointmentId: apt.id,
      });

      showToast(
        'success',
        `Xác nhận thành công! Bệnh nhân ${apt.patientName} ĐÃ ĐẾN KHÁM và hệ thống đã gửi thông báo đến Bác sĩ ${apt.doctorName}.`
      );
    } else {
      showToast('error', 'Không thể cập nhật trạng thái lịch khám.');
    }
    setCheckInCandidate(null);
  };

  // Handle QR scanned result
  const handleQrScanned = (scannedData: string) => {
    setIsScannerOpen(false);

    // Try finding appointment by bookingCode, ID, or JSON parse
    let codeToSearch = scannedData.trim();
    try {
      const parsed = JSON.parse(scannedData);
      if (parsed.bookingCode) codeToSearch = parsed.bookingCode;
      else if (parsed.id) codeToSearch = parsed.id;
    } catch {
      // scannedData is pure text / code
    }

    const matched = appointments.find(
      apt => apt.bookingCode.toLowerCase() === codeToSearch.toLowerCase() || apt.id === codeToSearch
    );

    if (matched) {
      if (matched.status === 'confirmed') {
        setCheckInCandidate(matched);
      } else if (matched.status === 'arrived') {
        showToast('success', `Bệnh nhân ${matched.patientName} đã hoàn tất check-in trước đó và đang trong hàng chờ.`);
      } else {
        showToast('error', `Phiếu đặt lịch ${matched.bookingCode} hiện ở trạng thái: ${matched.status}`);
      }
    } else {
      showToast('error', `Không tìm thấy phiếu đặt lịch nào khớp với mã: ${codeToSearch}`);
    }
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        apt.patientName.toLowerCase().includes(q) ||
        apt.patientPhone.includes(q) ||
        apt.bookingCode.toLowerCase().includes(q) ||
        apt.doctorName.toLowerCase().includes(q) ||
        apt.clinicRoom.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || apt.status === statusFilter;
      const matchDate = !dateFilter || apt.appointmentDate === dateFilter;

      return matchSearch && matchStatus && matchDate;
    });
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quầy Tiếp Tân: Tiếp Nhận & Check-in Bệnh Nhân
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quét mã QR trên phiếu khám hoặc tra cứu số điện thoại để chuyển bệnh nhân vào phòng khám
          </p>
        </div>

        {/* QR Scan Button for Receptionist */}
        <button
          onClick={() => setIsScannerOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <QrCode className="w-4 h-4" />
          <span>Quét Mã QR Check-in</span>
        </button>
      </div>

      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Tên bệnh nhân, SĐT, Mã đặt lịch, Tên bác sĩ..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="confirmed">Đã hẹn (Chưa đến)</option>
              <option value="arrived">Đã đến khám (Chờ BS)</option>
              <option value="examining">Đang khám</option>
              <option value="completed">Đã khám xong</option>
              <option value="cancelled">Đã huỷ lịch</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium"
            />
          </div>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Mã Đặt Lịch</th>
                <th className="py-3 px-4">Bệnh nhân & SĐT</th>
                <th className="py-3 px-4">Giờ hẹn & Ngày</th>
                <th className="py-3 px-4">Bác sĩ & Phòng</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác Tiếp tân</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Không tìm thấy lịch khám nào khớp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                      {apt.bookingCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{apt.patientName}</span>
                      <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {apt.patientPhone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold font-mono text-teal-800 block">{apt.appointmentTime}</span>
                      <span className="text-slate-500 text-[11px]">{apt.appointmentDate}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">{apt.doctorName}</span>
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-teal-600" />
                        {apt.clinicRoom}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {apt.status === 'confirmed' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Chờ bệnh nhân đến
                        </span>
                      )}
                      {apt.status === 'arrived' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 animate-pulse">
                          Đã đến (Chờ BS khám)
                        </span>
                      )}
                      {apt.status === 'examining' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                          Đang trong phòng khám
                        </span>
                      )}
                      {apt.status === 'completed' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          Đã hoàn thành
                        </span>
                      )}
                      {apt.status === 'cancelled' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700">
                          Đã huỷ
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {/* Check-in button */}
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => handleOpenCheckInModal(apt)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 inline-flex cursor-pointer"
                          title="Xác nhận bệnh nhân đã đến phòng khám và thông báo cho bác sĩ"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Check-in Đến Khám</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Scanner Interface Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQrScanned}
      />

      {/* QR Display Modal */}
      {selectedQrAppointment && (
        <QrCodeModal
          isOpen={!!selectedQrAppointment}
          onClose={() => setSelectedQrAppointment(null)}
          title="Phiếu Lịch Khám & Mã QR Check-in"
          subtitle={`Mã phiếu: ${selectedQrAppointment.bookingCode}`}
          qrCodeUrl={selectedQrAppointment.qrCodeDataUrl || ''}
          metadata={[
            { label: 'Họ tên bệnh nhân', value: selectedQrAppointment.patientName },
            { label: 'SĐT', value: selectedQrAppointment.patientPhone },
            { label: 'Bác sĩ điều trị', value: selectedQrAppointment.doctorName },
            { label: 'Phòng khám', value: selectedQrAppointment.clinicRoom },
            { label: 'Giờ hẹn', value: `${selectedQrAppointment.appointmentTime} - ${selectedQrAppointment.appointmentDate}` },
          ]}
          type="appointment"
        />
      )}

      {/* Confirmation Modal for Patient Arrived & Notify Doctor */}
      <CheckInConfirmModal
        appointment={checkInCandidate}
        isOpen={!!checkInCandidate}
        onClose={() => setCheckInCandidate(null)}
        onConfirm={handleConfirmCheckIn}
      />
    </div>
  );
};
