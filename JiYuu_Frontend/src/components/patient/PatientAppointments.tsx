import React, { useState } from 'react';
import { User, Appointment } from '../../types';
import { storage } from '../../services/storage';
import { QrCodeModal } from '../common/QrCodeModal';
import {
  Calendar,
  Clock,
  QrCode,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Phone,
  Star,
  MessageSquare,
  Search,
  Filter,
} from 'lucide-react';

interface PatientAppointmentsProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const PatientAppointments: React.FC<PatientAppointmentsProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  const [selectedQrAppointment, setSelectedQrAppointment] = useState<Appointment | null>(null);
  const [cancelModalAppointment, setCancelModalAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');

  // Review Doctor Modal state
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
        <Clock className="w-12 h-12 text-teal-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Vui lòng đăng nhập để xem Lịch khám</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Quản lý phiếu đặt lịch, tra cứu mã QR check-in và huỷ lịch khám trực tuyến.
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

  const allAppointments = storage.getAppointments();
  // Filter for this patient
  const patientAppointments = allAppointments.filter(
    apt => apt.patientUserId === currentUser.id || apt.patientPhone === currentUser.phone
  );

  const filtered = patientAppointments.filter(apt => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'upcoming') return apt.status === 'confirmed' || apt.status === 'arrived' || apt.status === 'pending';
    if (statusFilter === 'completed') return apt.status === 'completed';
    if (statusFilter === 'cancelled') return apt.status === 'cancelled';
    return true;
  });

  const handleOpenCancelModal = (apt: Appointment) => {
    setCancelError('');
    setCancelSuccess('');
    setCancelReason('');
    const check = storage.canCancelAppointment(apt);
    if (!check.canCancel) {
      setCancelError(check.message || 'Không thể huỷ lịch khám.');
    }
    setCancelModalAppointment(apt);
  };

  const handleConfirmCancel = () => {
    if (!cancelModalAppointment) return;
    const res = storage.cancelAppointment(cancelModalAppointment.id, cancelReason);
    if (!res.success) {
      setCancelError(res.message || 'Lỗi khi huỷ lịch.');
    } else {
      setCancelSuccess('Đã huỷ lịch khám thành công.');
      setTimeout(() => {
        setCancelModalAppointment(null);
      }, 1000);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAppointment) return;

    storage.addDoctorReview(reviewAppointment.doctorId, {
      patientName: currentUser.fullName,
      rating: reviewStars,
      comment: reviewComment || 'Bác sĩ thăm khám rất tận tình và chu đáo.',
    });

    // Mark reviewed in appointment
    reviewAppointment.reviewed = true;
    setReviewAppointment(null);
    setReviewComment('');
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Đã xác nhận hẹn</span>;
      case 'arrived':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">Đã đến khám (Chờ BS)</span>;
      case 'examining':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">Đang khám</span>;
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Đã hoàn thành</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Đã huỷ</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Chờ duyệt</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Lịch Khám Của Bạn
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem lại phiếu đặt lịch, xuất trình mã QR và theo dõi trạng thái tiếp nhận
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả ({patientAppointments.length})
          </button>
          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'upcoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sắp tới
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đã khám
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'cancelled' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đã huỷ
          </button>
        </div>
      </div>

      {/* Appointment Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">Chưa có lịch khám nào trong danh mục này</h4>
            <p className="text-xs text-slate-400 mt-1">
              Bạn có thể dễ dàng đặt lịch khám với các bác sĩ chuyên khoa tại JiYuu Clinic.
            </p>
          </div>
        ) : (
          filtered.map(apt => {
            const check = storage.canCancelAppointment(apt);
            const isCancellable = apt.status !== 'cancelled' && apt.status !== 'completed' && check.canCancel;

            return (
              <div
                key={apt.id}
                className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 hover:border-teal-200 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                      Mã: {apt.bookingCode}
                    </span>
                    {getStatusBadge(apt.status)}
                    {apt.isRelativeBooking && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        Đặt hộ người thân
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400">
                    Tạo lúc: {new Date(apt.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Người khám:</span>
                    <span className="font-bold text-slate-900 text-sm block">{apt.patientName}</span>
                    <span className="text-slate-500 font-mono">{apt.patientPhone}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Bác sĩ phụ trách:</span>
                    <span className="font-bold text-teal-700 text-sm block">{apt.doctorName}</span>
                    <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      {apt.clinicRoom}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Lịch hẹn khám:</span>
                    <span className="font-bold text-teal-800 text-sm block font-mono">
                      {apt.appointmentTime}
                    </span>
                    <span className="text-slate-600 font-medium">Ngày {apt.appointmentDate}</span>
                  </div>

                  {/* QR Preview & Action */}
                  <div className="flex items-center justify-start md:justify-end gap-2">
                    {apt.qrCodeDataUrl && apt.status !== 'cancelled' && (
                      <button
                        onClick={() => setSelectedQrAppointment(apt)}
                        className="p-2 bg-slate-50 hover:bg-teal-50 text-teal-700 rounded-xl border border-slate-200 hover:border-teal-300 transition flex items-center gap-1.5 font-bold cursor-pointer"
                        title="Xem mã QR check-in"
                      >
                        <QrCode className="w-4 h-4 text-teal-600" />
                        <span>Mã QR</span>
                      </button>
                    )}

                    {/* Cancel Button (Validates 4 hours condition) */}
                    {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                      <button
                        onClick={() => handleOpenCancelModal(apt)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                          isCancellable
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                        }`}
                        title={
                          isCancellable
                            ? 'Huỷ lịch hẹn khám (Trước 4 tiếng)'
                            : 'Không thể huỷ vì còn dưới 4 tiếng đến giờ khám'
                        }
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Huỷ lịch</span>
                      </button>
                    )}

                    {/* Review Button if completed */}
                    {apt.status === 'completed' && !apt.reviewed && (
                      <button
                        onClick={() => setReviewAppointment(apt)}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Đánh giá BS</span>
                      </button>
                    )}
                  </div>
                </div>

                {apt.reason && (
                  <div className="text-xs bg-slate-50 p-3 rounded-xl text-slate-600 border border-slate-200/50">
                    <span className="font-semibold text-slate-800">Lý do khám:</span> {apt.reason}
                  </div>
                )}

                {apt.cancelReason && (
                  <div className="text-xs bg-rose-50 p-3 rounded-xl text-rose-700 border border-rose-200">
                    <span className="font-bold">Lý do huỷ:</span> {apt.cancelReason} (Huỷ lúc: {new Date(apt.cancelledAt || '').toLocaleString('vi-VN')})
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* QR Code Modal for Selected Appointment */}
      {selectedQrAppointment && (
        <QrCodeModal
          isOpen={!!selectedQrAppointment}
          onClose={() => setSelectedQrAppointment(null)}
          title="Phiếu Lịch Khám & Mã QR Check-in"
          subtitle={`Mã phiếu: ${selectedQrAppointment.bookingCode}`}
          qrCodeUrl={selectedQrAppointment.qrCodeDataUrl || ''}
          metadata={[
            { label: 'Họ tên người khám', value: selectedQrAppointment.patientName },
            { label: 'Số điện thoại', value: selectedQrAppointment.patientPhone },
            { label: 'Bác sĩ điều trị', value: selectedQrAppointment.doctorName },
            { label: 'Phòng khám bệnh', value: selectedQrAppointment.clinicRoom },
            { label: 'Thời gian khám', value: `${selectedQrAppointment.appointmentTime} ngày ${selectedQrAppointment.appointmentDate}` },
          ]}
          type="appointment"
        />
      )}

      {/* Cancel Appointment Modal */}
      {cancelModalAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Huỷ Lịch Khám Bệnh
            </h3>

            {cancelError ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  Không thể huỷ lịch tự động:
                </div>
                <p className="leading-relaxed">{cancelError}</p>
                <div className="pt-2 text-right">
                  <button
                    onClick={() => setCancelModalAppointment(null)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Đã hiểu
                  </button>
                </div>
              </div>
            ) : cancelSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{cancelSuccess}</span>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bạn có chắc chắn muốn huỷ lịch khám mã{' '}
                  <strong className="text-slate-900">{cancelModalAppointment.bookingCode}</strong> với{' '}
                  <strong className="text-slate-900">{cancelModalAppointment.doctorName}</strong> lúc{' '}
                  <strong className="text-slate-900">
                    {cancelModalAppointment.appointmentTime} ngày {cancelModalAppointment.appointmentDate}
                  </strong>
                  ?
                </p>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-600" />
                  Thời gian huỷ hợp lệ: cách giờ khám hơn 4 tiếng theo đúng quy định phòng khám.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lý do huỷ lịch khám:
                  </label>
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="VD: Có việc gia đình bận đột xuất, xin dời sang ngày khác..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setCancelModalAppointment(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Xác nhận huỷ lịch
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Doctor Review Modal */}
      {reviewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              Đánh Giá & Phản Hồi Bác Sĩ
            </h3>

            <p className="text-xs text-slate-500">
              Chia sẻ cảm nhận của bạn sau khi khám bệnh với{' '}
              <strong>{reviewAppointment.doctorName}</strong>:
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewStars(star)}
                    className="p-1 cursor-pointer transition transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= reviewStars
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhận xét chi tiết:
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Bác sĩ khám nhiệt tình, giải thích cặn kẽ..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReviewAppointment(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Để sau
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Gửi đánh giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
