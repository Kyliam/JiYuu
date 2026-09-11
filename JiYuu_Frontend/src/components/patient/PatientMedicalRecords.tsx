import React, { useState, useEffect } from 'react';
import { User, MedicalRecord } from '../../types';
import { storage } from '../../services/storage';
import { QrCodeModal } from '../common/QrCodeModal';
import { generateMedicalRecordQrCode } from '../../utils/qr';
import {
  FileText,
  QrCode,
  Calendar,
  Pill,
  Building2,
  Stethoscope,
  Clock,
  Download,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Maximize2,
} from 'lucide-react';

interface PatientMedicalRecordsProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const PatientMedicalRecords: React.FC<PatientMedicalRecordsProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  const [selectedRecordForQr, setSelectedRecordForQr] = useState<MedicalRecord | null>(null);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  const records = currentUser ? storage.getMedicalRecordsByPatient(currentUser.id) : [];

  // Preload and ensure every medical record has a valid QR Code data URL
  useEffect(() => {
    if (!records.length) return;
    records.forEach(async rec => {
      if (rec.qrCodeDataUrl) {
        setQrMap(prev => (prev[rec.id] ? prev : { ...prev, [rec.id]: rec.qrCodeDataUrl! }));
      } else {
        try {
          const qr = await generateMedicalRecordQrCode({
            recordCode: rec.recordCode,
            patientName: rec.patientName,
            examDate: rec.examDate,
            doctorName: rec.doctorName,
            clinicRoom: rec.clinicRoom,
            diagnosis: rec.diagnosis,
            treatment: rec.treatment,
            medicinesCount: rec.prescriptions?.length || 0,
          });
          setQrMap(prev => ({ ...prev, [rec.id]: qr }));
        } catch (e) {
          console.error('Failed to generate QR for record', rec.recordCode, e);
        }
      }
    });
  }, [records]);

  const handleOpenRecordQr = async (rec: MedicalRecord) => {
    let qrUrl = rec.qrCodeDataUrl || qrMap[rec.id];
    if (!qrUrl) {
      try {
        qrUrl = await generateMedicalRecordQrCode({
          recordCode: rec.recordCode,
          patientName: rec.patientName,
          examDate: rec.examDate,
          doctorName: rec.doctorName,
          clinicRoom: rec.clinicRoom,
          diagnosis: rec.diagnosis,
          treatment: rec.treatment,
          medicinesCount: rec.prescriptions?.length || 0,
        });
        setQrMap(prev => ({ ...prev, [rec.id]: qrUrl }));
      } catch (err) {
        console.error(err);
      }
    }
    setSelectedRecordForQr({ ...rec, qrCodeDataUrl: qrUrl || '' });
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
        <FileText className="w-12 h-12 text-teal-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Đăng nhập để tra cứu Bệnh án điện tử</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Xem chẩn đoán, đơn thuốc và mã QR lấy thuốc nhanh tại quầy dược.
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Hồ Sơ Bệnh Án Điện Tử & Đơn Thuốc
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Dữ liệu bệnh án được bảo mật và mã hoá theo tiêu chuẩn y tế quốc tế
        </p>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 text-sm">Chưa có hồ sơ bệnh án nào</h4>
          <p className="text-xs text-slate-400 mt-1">
            Sau khi bác sĩ hoàn thành buổi khám bệnh, bệnh án và đơn thuốc sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {records.map(rec => (
            <div
              key={rec.id}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 hover:border-emerald-200 transition space-y-6"
            >
              {/* Record Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Mã Bệnh Án: {rec.recordCode}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    rec.status === 'recovered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.status === 'recovered' ? 'Đã khỏi bệnh' : 'Đang chữa trị'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    Khám ngày: {rec.examDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenRecordQr(rec)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    title="Nhấn để mở cửa sổ xem mã QR"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Mã QR Bệnh Án</span>
                  </button>
                </div>
              </div>

              {/* Patient & Doctor Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                  <span className="text-slate-400 block font-medium">Bệnh nhân:</span>
                  <h4 className="font-bold text-slate-900 text-sm">{rec.patientName}</h4>
                  <p className="text-slate-500 font-mono">SĐT: {rec.patientPhone}</p>
                  <p className="text-slate-500 truncate">Địa chỉ: {rec.patientAddress}</p>
                </div>

                <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-1">
                  <span className="text-teal-700 font-medium block">Bác sĩ điều trị:</span>
                  <h4 className="font-bold text-teal-900 text-sm">{rec.doctorName}</h4>
                  <p className="text-teal-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {rec.clinicRoom}
                  </p>
                  {rec.doctorSignature && (
                    <div className="text-[11px] text-teal-800 font-semibold italic pt-1 border-t border-teal-100">
                      Chữ ký BS: {rec.doctorSignature.startsWith('data:') ? '[Chữ ký điện tử đã chứng thực]' : rec.doctorSignature}
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnosis & Symptoms */}
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                  <span className="font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    Triệu chứng lâm sàng ghi nhận:
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">{rec.symptoms}</p>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Chẩn đoán xác định:
                  </span>
                  <p className="text-emerald-950 font-bold text-sm leading-relaxed">{rec.diagnosis}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                  <span className="font-bold text-slate-700 uppercase tracking-wide">Phương pháp điều trị & Lời dặn:</span>
                  <p className="text-slate-800 leading-relaxed">{rec.treatment}</p>
                </div>
              </div>

              {/* Prescriptions */}
              {rec.prescriptions && rec.prescriptions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-teal-600" />
                    Đơn thuốc điện tử ({rec.prescriptions.length} loại)
                  </h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Tên thuốc & Hàm lượng</th>
                          <th className="p-3">Số lượng</th>
                          <th className="p-3">Hướng dẫn sử dụng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {rec.prescriptions.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-teal-900">
                              {item.medicineName} <span className="font-normal text-slate-500">({item.dosage})</span>
                            </td>
                            <td className="p-3 font-semibold">{item.quantity}</td>
                            <td className="p-3 text-slate-600 italic">{item.usageInstruction}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Follow-up date & QR Pharmacy Pickup */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                {rec.followUpDate ? (
                  <div className="text-xs font-semibold text-teal-800 bg-teal-50 px-3.5 py-2.5 rounded-2xl border border-teal-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    Hẹn tái khám: <strong>{rec.followUpDate}</strong>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Không có chỉ định tái khám</span>
                )}

                {/* Clickable QR Code Box */}
                <div
                  onClick={() => handleOpenRecordQr(rec)}
                  className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-2xl cursor-pointer transition shadow-xs hover:shadow-md flex items-center gap-3 group"
                  title="Nhấn để mở cửa sổ phóng to mã QR lấy thuốc"
                >
                  <div className="relative w-12 h-12 bg-white rounded-xl p-1 border border-emerald-300 shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    {(rec.qrCodeDataUrl || qrMap[rec.id]) ? (
                      <img
                        src={rec.qrCodeDataUrl || qrMap[rec.id]}
                        alt="QR Code Bệnh Án"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="w-6 h-6 text-emerald-600" />
                    )}
                    <div className="absolute inset-0 bg-emerald-900/10 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Maximize2 className="w-4 h-4 text-emerald-800" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      Mã QR Nhận Thuốc Tại Quầy Dược
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Nhấn vào mã QR để mở cửa sổ phóng to
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenRecordQr(rec);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 group-hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem QR</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal for Pharmacy Pickup */}
      {selectedRecordForQr && (
        <QrCodeModal
          isOpen={!!selectedRecordForQr}
          onClose={() => setSelectedRecordForQr(null)}
          title="Bệnh Án Điện Tử & Mã QR Thuốc"
          subtitle={`Mã hồ sơ: ${selectedRecordForQr.recordCode}`}
          qrCodeUrl={selectedRecordForQr.qrCodeDataUrl || qrMap[selectedRecordForQr.id] || ''}
          metadata={[
            { label: 'Bệnh nhân', value: selectedRecordForQr.patientName },
            { label: 'Bác sĩ điều trị', value: selectedRecordForQr.doctorName },
            { label: 'Chẩn đoán', value: selectedRecordForQr.diagnosis },
            { label: 'Phòng khám', value: selectedRecordForQr.clinicRoom },
            { label: 'Ngày khám', value: selectedRecordForQr.examDate },
            { label: 'Đơn thuốc', value: `${selectedRecordForQr.prescriptions?.length || 0} loại thuốc theo đơn` },
            { label: 'Hướng dẫn nhận thuốc', value: 'Đưa mã QR này tại Quầy Dược JiYuu Clinic để quét và nhận thuốc nhanh' },
          ]}
          type="medical_record"
        />
      )}
    </div>
  );
};
