import React, { useState } from 'react';
import { User, DoctorSchedule } from '../../types';
import { storage } from '../../services/storage';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  AlertCircle,
  Check,
  X,
  Filter,
} from 'lucide-react';

interface ReceptionistScheduleApprovalProps {
  currentUser: User | null;
}

export const ReceptionistScheduleApproval: React.FC<ReceptionistScheduleApprovalProps> = ({ currentUser }) => {
  const allSchedules = storage.getSchedules();

  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = (scheduleId: string) => {
    const ok = storage.updateSchedule(scheduleId, { status: 'approved' });
    if (ok) {
      showToast('success', 'Đã PHÊ DUYỆT ca làm việc của Bác sĩ thành công!');
    } else {
      showToast('error', 'Lỗi khi phê duyệt lịch.');
    }
  };

  const handleReject = (scheduleId: string) => {
    const ok = storage.updateSchedule(scheduleId, { status: 'rejected' });
    if (ok) {
      showToast('success', 'Đã TỪ CHỐI yêu cầu ca làm việc này.');
    } else {
      showToast('error', 'Lỗi khi từ chối lịch.');
    }
  };

  const filtered = allSchedules.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const pendingCount = allSchedules.filter(s => s.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Phê Duyệt Lịch Làm Việc Của Bác Sĩ
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                {pendingCount} yêu cầu mới
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tiếp tân kiểm tra ca trực, phòng khám và duyệt các đề xuất thay đổi giờ của bác sĩ
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filter === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Chờ duyệt ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filter === 'approved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Đã duyệt
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filter === 'rejected' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Đã từ chối
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Tất cả
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

      {/* Schedules List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
            Không có ca làm việc nào trong danh mục này.
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 hover:border-teal-200 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-slate-900 text-sm">{item.doctorName}</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    {item.specialty}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    {item.clinicRoom}
                  </span>
                </div>

                <div>
                  {item.status === 'pending' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Chờ Tiếp tân duyệt
                    </span>
                  )}
                  {item.status === 'approved' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Đã được duyệt
                    </span>
                  )}
                  {item.status === 'rejected' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      Đã từ chối
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Ngày làm việc:</span>
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    {item.date}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Thời gian ca trực:</span>
                  <span className="font-bold text-teal-800 text-sm font-mono flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-600" />
                    {item.startTime} - {item.endTime}
                  </span>
                  <span className="text-[11px] text-slate-500">{item.shiftType}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Lý do điều chỉnh/Đăng ký:</span>
                  <span className="text-slate-700 italic">
                    {item.changeReason || 'Đăng ký ca làm việc định kỳ'}
                  </span>
                </div>
              </div>

              {item.notes && (
                <div className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                  <strong>Ghi chú:</strong> {item.notes}
                </div>
              )}

              {/* Action Buttons for Receptionist */}
              {item.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleReject(item.id)}
                    className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Phê duyệt ca làm việc
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
