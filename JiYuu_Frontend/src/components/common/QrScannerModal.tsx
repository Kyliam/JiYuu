import React, { useState, useRef } from 'react';
import { Appointment } from '../../types';
import { storage } from '../../services/storage';
import { X, QrCode, Search, CheckCircle2, AlertCircle, Camera, Laptop } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (appointment: Appointment) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'phone' | 'camera'>('pos');
  const [phoneInput, setPhoneInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (!isOpen) return null;

  const appointments = storage.getAppointments().filter(a => a.status !== 'cancelled' && a.status !== 'completed');

  const handleProcessCheckIn = (codeOrPhone: string) => {
    setErrorMsg('');
    const res = storage.checkInAppointment(codeOrPhone);
    if (res.success && res.appointment) {
      onScanSuccess(res.appointment);
      onClose();
    } else {
      setErrorMsg(res.message || 'Không tìm thấy hoặc không thể tiếp nhận lịch khám này.');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      setErrorMsg('Không thể mở camera hoặc quyền camera bị chặn.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600/30 text-teal-400 rounded-xl border border-teal-500/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Máy Quét QR / Check-in Bệnh Nhân</h3>
              <p className="text-xs text-slate-400">Tiếp nhận bệnh nhân tại bàn lễ tân phòng khám JiYuu</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('pos');
            }}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pos'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            Mô phỏng máy POS
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('phone');
            }}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'phone'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            Nhập SĐT / Mã phiếu
          </button>
          <button
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera Scanner
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'pos' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Chọn nhanh một phiếu khám đang chờ tiếp nhận để giả lập thao tác quét mã vạch/QR bằng máy POS tại quầy:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Không có lịch khám nào đang chờ tiếp nhận.
                  </div>
                ) : (
                  appointments.map(apt => (
                    <div
                      key={apt.id}
                      onClick={() => handleProcessCheckIn(apt.bookingCode)}
                      className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{apt.patientName}</span>
                          <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                            {apt.bookingCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {apt.appointmentTime} ({apt.appointmentDate}) • BS: {apt.doctorName}
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        apt.status === 'arrived'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {apt.status === 'arrived' ? 'Đã đến khám' : 'Bấm để Check-in'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'phone' && (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (phoneInput.trim()) {
                  handleProcessCheckIn(phoneInput.trim());
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nhập số điện thoại bệnh nhân hoặc Mã phiếu đặt lịch
                </label>
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    placeholder="VD: 0912345678 hoặc JY-2026-0881"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Tiếp tân có thể hỏi số điện thoại đăng ký khám của bệnh nhân khi tới quầy.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Xác nhận Check-in Bệnh nhân
              </button>
            </form>
          )}

          {activeTab === 'camera' && (
            <div className="space-y-3 text-center">
              <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-teal-400 border-dashed m-6 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="text-white text-xs bg-slate-900/80 px-3 py-1 rounded-full font-medium">
                    Căn khung mã QR vào đây
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {appointments[0] && (
                  <button
                    onClick={() => {
                      stopCamera();
                      handleProcessCheckIn(appointments[0].bookingCode);
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Mô phỏng nhận diện mã: {appointments[0].bookingCode}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
