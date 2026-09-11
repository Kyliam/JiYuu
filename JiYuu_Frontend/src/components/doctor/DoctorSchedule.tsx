import React, { useState } from 'react';
import { User, DoctorProfile, DoctorSchedule as ScheduleType } from '../../types';
import { storage } from '../../services/storage';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Send,
  X,
  CalendarDays,
} from 'lucide-react';

interface DoctorScheduleProps {
  currentUser: User | null;
}

export const DoctorSchedule: React.FC<DoctorScheduleProps> = ({ currentUser }) => {
  const doctor = currentUser ? storage.getDoctorByUserId(currentUser.id) : null;
  const allSchedules = storage.getSchedules();
  const doctorSchedules = doctor ? allSchedules.filter(s => s.doctorId === doctor.id) : [];

  // View state (Week or Month view like Google Calendar)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalSchedule, setEditModalSchedule] = useState<ScheduleType | null>(null);
  const [selectedDayToCreate, setSelectedDayToCreate] = useState<string | null>(null);

  // Form states for creating / changing
  const [shiftType, setShiftType] = useState<ScheduleType['shiftType']>('Ca sáng (08:00 - 12:00)');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [changeReason, setChangeReason] = useState('');
  const [notes, setNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!doctor) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-2xl mx-auto">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h4 className="font-bold text-slate-800 text-sm">Chưa tìm thấy hồ sơ Bác sĩ tương ứng</h4>
        <p className="text-xs text-slate-500 mt-1">
          Vui lòng kiểm tra lại tài khoản hoặc liên hệ lễ tân để kích hoạt vai trò bác sĩ.
        </p>
      </div>
    );
  }

  // Week Days calculation (7 days starting from Monday of current week)
  const getDaysInCurrentWeek = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDays = getDaysInCurrentWeek(currentDate);

  const prevPeriod = () => {
    const next = new Date(currentDate);
    if (viewMode === 'week') next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const nextPeriod = () => {
    const next = new Date(currentDate);
    if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleCreateNewSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    storage.createSchedule({
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      specialty: doctor.specialty,
      date: targetDate,
      startTime,
      endTime,
      shiftType,
      clinicRoom: doctor.clinicRoom,
      status: 'pending', // Sends request for receptionist approval
      changeReason: 'Đăng ký ca làm việc mới',
      notes,
    });

    setFeedbackMsg({
      type: 'success',
      text: 'Yêu cầu đăng ký ca làm việc đã gửi tới Tiếp tân để chờ phê duyệt!',
    });
    setCreateModalOpen(false);
  };

  const handleUpdateScheduleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalSchedule) return;

    storage.updateSchedule(editModalSchedule.id, {
      startTime,
      endTime,
      shiftType,
      status: 'pending', // Changing schedule requires Receptionist approval
      changeReason: changeReason || 'Bác sĩ xin điều chỉnh thời gian ca làm việc trong ngày',
      notes,
    });

    setFeedbackMsg({
      type: 'success',
      text: 'Đã gửi yêu cầu thay đổi lịch làm việc đến Tiếp tân để phê duyệt!',
    });
    setEditModalSchedule(null);
  };

  const openDayClick = (dayStr: string, existing?: ScheduleType) => {
    if (existing) {
      setEditModalSchedule(existing);
      setStartTime(existing.startTime);
      setEndTime(existing.endTime);
      setShiftType(existing.shiftType);
      setChangeReason(existing.changeReason || '');
    } else {
      setTargetDate(dayStr);
      setCreateModalOpen(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Lịch Làm Việc Bác Sĩ (Google Calendar UI)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">
              {doctor.fullName}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Phòng: <strong>{doctor.clinicRoom}</strong> • Nhấp vào ngày làm việc để xin đổi giờ (Gửi duyệt Tiếp tân)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Tháng
            </button>
          </div>

          {/* Button "Tạo lịch làm việc" */}
          <button
            onClick={() => {
              setTargetDate(new Date().toISOString().split('T')[0]);
              setCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo lịch làm việc</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Calendar Navigation & Period Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={prevPeriod}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              onClick={nextPeriod}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            <span className="text-base font-bold text-slate-900 ml-2">
              Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-slate-600">Đã phê duyệt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-slate-600">Chờ Tiếp tân duyệt</span>
            </div>
          </div>
        </div>

        {/* Google Calendar-Style Week View Grid */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((d, index) => {
              const dayStr = d.toISOString().split('T')[0];
              const isToday = dayStr === new Date().toISOString().split('T')[0];
              const schedulesForDay = doctorSchedules.filter(s => s.date === dayStr);

              const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

              return (
                <div
                  key={index}
                  className={`min-h-[220px] rounded-2xl border p-2.5 flex flex-col justify-between transition ${
                    isToday ? 'border-teal-500 bg-teal-50/20' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div>
                    {/* Day Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2">
                      <span className="text-[11px] font-bold text-slate-500">{dayNames[d.getDay()]}</span>
                      <span
                        className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-teal-600 text-white' : 'text-slate-800'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                    </div>

                    {/* Schedules Cards */}
                    <div className="space-y-1.5">
                      {schedulesForDay.map(sch => (
                        <div
                          key={sch.id}
                          onClick={() => openDayClick(dayStr, sch)}
                          className={`p-2 rounded-xl text-left border text-[11px] cursor-pointer transition transform hover:scale-[1.02] ${
                            sch.status === 'approved'
                              ? 'bg-teal-500 text-white border-teal-600 shadow-xs'
                              : sch.status === 'pending'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                          title="Bấm để thay đổi thời gian làm việc (Gửi duyệt)"
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>{sch.startTime} - {sch.endTime}</span>
                            <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-black/10">
                              {sch.status === 'approved' ? 'Duyệt' : 'Chờ'}
                            </span>
                          </div>
                          <div className="text-[10px] opacity-90 truncate">{sch.shiftType}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add shift button for this day */}
                  <button
                    onClick={() => openDayClick(dayStr)}
                    className="w-full mt-2 py-1.5 border border-dashed border-slate-300 hover:border-teal-400 hover:bg-white text-slate-400 hover:text-teal-600 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm ca
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Month View Grid */}
        {viewMode === 'month' && (
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 py-1">
              <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 30 }).map((_, i) => {
                const dayNum = i + 1;
                const paddedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                const mStr = currentDate.getMonth() + 1 < 10 ? `0${currentDate.getMonth() + 1}` : `${currentDate.getMonth() + 1}`;
                const dStr = `${currentDate.getFullYear()}-${mStr}-${paddedDay}`;
                const daySchedules = doctorSchedules.filter(s => s.date === dStr);

                return (
                  <div
                    key={i}
                    onClick={() => openDayClick(dStr, daySchedules[0])}
                    className="h-20 p-1.5 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 rounded-xl flex flex-col justify-between cursor-pointer transition text-xs"
                  >
                    <span className="font-bold text-slate-700">{dayNum}</span>
                    <div className="space-y-0.5">
                      {daySchedules.map(sch => (
                        <div
                          key={sch.id}
                          className={`text-[9px] truncate px-1 py-0.5 rounded font-medium ${
                            sch.status === 'approved' ? 'bg-teal-600 text-white' : 'bg-amber-300 text-slate-900'
                          }`}
                        >
                          {sch.startTime} - {sch.endTime}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CREATE SCHEDULE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-teal-600" />
                Đăng Ký Ca Làm Việc Mới
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ngày làm việc</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ca làm việc</label>
                <select
                  value={shiftType}
                  onChange={e => {
                    const val = e.target.value as any;
                    setShiftType(val);
                    if (val.includes('08:00')) {
                      setStartTime('08:00');
                      setEndTime('12:00');
                    } else if (val.includes('13:30')) {
                      setStartTime('13:30');
                      setEndTime('17:30');
                    } else if (val.includes('18:00')) {
                      setStartTime('18:00');
                      setEndTime('21:00');
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium bg-white"
                >
                  <option value="Ca sáng (08:00 - 12:00)">Ca sáng (08:00 - 12:00)</option>
                  <option value="Ca chiều (13:30 - 17:30)">Ca chiều (13:30 - 17:30)</option>
                  <option value="Ca tối (18:00 - 21:00)">Ca tối (18:00 - 21:00)</option>
                  <option value="Cả ngày">Cả ngày (08:00 - 17:30)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú cho Tiếp tân</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ghi chú phòng khám, yêu cầu bổ sung nếu có..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                Ca làm việc đăng ký sẽ được gửi tới bộ phận Tiếp tân để kiểm tra và phê duyệt.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi yêu cầu đăng ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / REQUEST SCHEDULE CHANGE MODAL */}
      {editModalSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                Thay Đổi Thời Gian Làm Việc Trong Ngày
              </h3>
              <button onClick={() => setEditModalSchedule(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Ngày: <strong>{editModalSchedule.date}</strong> ({editModalSchedule.shiftType})
            </p>

            <form onSubmit={handleUpdateScheduleRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giờ bắt đầu mới</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giờ kết thúc mới</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lý do xin thay đổi giờ (Gửi duyệt Tiếp tân) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={changeReason}
                  onChange={e => setChangeReason(e.target.value)}
                  placeholder="VD: Bận hội chẩn ca bệnh đột xuất tại Bệnh viện tuyến trên, xin dời sang ca chiều..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 space-y-1">
                <span className="font-bold block">Yêu cầu theo quy định phòng khám:</span>
                <p>
                  Việc thay đổi thời gian làm việc trong ngày sẽ được chuyển sang trạng thái <strong>Chờ duyệt</strong> và gửi thông báo trực tiếp tới Tiếp tân để xử lý.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalSchedule(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi yêu cầu duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
