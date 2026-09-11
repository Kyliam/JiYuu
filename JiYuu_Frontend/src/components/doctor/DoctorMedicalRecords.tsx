import React, { useState, useMemo } from 'react';
import { User, MedicalRecord } from '../../types';
import { storage } from '../../services/storage';
import { QrCodeModal } from '../common/QrCodeModal';
import {
  FileText,
  Search,
  Calendar,
  Phone,
  User as UserIcon,
  Pill,
  Star,
  MessageSquare,
  Building2,
  CheckCircle2,
  QrCode,
  Eye,
} from 'lucide-react';

interface DoctorMedicalRecordsProps {
  currentUser: User | null;
}

export const DoctorMedicalRecords: React.FC<DoctorMedicalRecordsProps> = ({ currentUser }) => {
  const doctor = currentUser ? storage.getDoctorByUserId(currentUser.id) : null;
  const records = doctor ? storage.getMedicalRecordsByDoctor(doctor.id) : [];

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<MedicalRecord | null>(null);
  const [selectedQrRecord, setSelectedQrRecord] = useState<MedicalRecord | null>(null);

  // Tab: Records or Reviews
  const [activeTab, setActiveTab] = useState<'records' | 'reviews'>('records');

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = searchKeyword.toLowerCase();
      return (
        r.patientName.toLowerCase().includes(q) ||
        r.patientPhone.includes(q) ||
        r.recordCode.toLowerCase().includes(q) ||
        r.examDate.includes(q) ||
        r.diagnosis.toLowerCase().includes(q)
      );
    });
  }, [records, searchKeyword]);

  if (!doctor) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-2xl mx-auto">
        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h4 className="font-bold text-slate-800 text-sm">Chưa tìm thấy thông tin Bác sĩ</h4>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Hồ Sơ Bệnh Án & Đánh Giá
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bác sĩ: <strong>{doctor.fullName}</strong> • Đánh giá: <strong>{doctor.rating} ★</strong> ({doctor.reviewCount} lượt)
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'records' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Hồ sơ bệnh án ({records.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reviews' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Đánh giá từ bệnh nhân ({doctor.reviews?.length || 0})</span>
          </button>
        </div>
      </div>

      {activeTab === 'records' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="Tìm mã bệnh án, tên, SĐT, ngày khám..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <span className="text-xs text-slate-400">
              Hiển thị: <strong>{filteredRecords.length}</strong> hồ sơ
            </span>
          </div>

          {/* Records Table */}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Không tìm thấy hồ sơ bệnh án nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Mã Bệnh Án</th>
                    <th className="py-3 px-4">Bệnh nhân</th>
                    <th className="py-3 px-4">Ngày khám</th>
                    <th className="py-3 px-4">Chẩn đoán</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                        {rec.recordCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{rec.patientName}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{rec.patientPhone}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{rec.examDate}</td>
                      <td className="py-3.5 px-4 max-w-[220px] truncate font-medium text-slate-800">
                        {rec.diagnosis}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            rec.status === 'recovered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {rec.status === 'recovered' ? 'Khỏi bệnh' : 'Đang điều trị'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => setSelectedRecordDetail(rec)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                          title="Xem chi tiết"
                        >
                          Chi tiết
                        </button>
                        {rec.qrCodeDataUrl && (
                          <button
                            onClick={() => setSelectedQrRecord(rec)}
                            className="p-1 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 cursor-pointer"
                            title="Mã QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Patient Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Phản Hồi & Đánh Giá Từ Bệnh Nhân</h3>
              <p className="text-xs text-slate-500">
                Ý kiến đóng góp giúp nâng cao chất lượng khám chữa bệnh tại phòng khám
              </p>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 text-amber-900">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-black">{doctor.rating}</span>
              <span className="text-xs text-amber-700 font-medium">/ 5.0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!doctor.reviews || doctor.reviews.length === 0) ? (
              <p className="text-slate-400 text-xs py-8 text-center col-span-2">
                Chưa có đánh giá nào từ bệnh nhân.
              </p>
            ) : (
              doctor.reviews.map((rev, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{rev.patientName}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s < rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-slate-200 text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-700 italic">"{rev.comment}"</p>
                  <span className="text-[10px] text-slate-400 block pt-1">{rev.date}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-teal-700">
                  {selectedRecordDetail.recordCode}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Hồ Sơ Khám Bệnh: {selectedRecordDetail.patientName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">SĐT:</span>
                <span className="font-bold font-mono text-slate-800">{selectedRecordDetail.patientPhone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">Ngày khám:</span>
                <span className="font-bold text-slate-800">{selectedRecordDetail.examDate}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1">Triệu chứng lâm sàng:</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-800">{selectedRecordDetail.symptoms}</p>
              </div>

              <div>
                <span className="font-bold text-teal-800 block mb-1">Chẩn đoán xác định:</span>
                <p className="p-3 bg-teal-50 rounded-xl text-teal-900 font-bold">{selectedRecordDetail.diagnosis}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Phương pháp điều trị:</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-800">{selectedRecordDetail.treatment}</p>
              </div>

              {selectedRecordDetail.prescriptions && selectedRecordDetail.prescriptions.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Pill className="w-4 h-4 text-teal-600" />
                    Đơn thuốc chỉ định:
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2.5">Thuốc</th>
                          <th className="p-2.5">Số lượng</th>
                          <th className="p-2.5">Cách dùng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedRecordDetail.prescriptions.map((p, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-bold text-teal-900">{p.medicineName} ({p.dosage})</td>
                            <td className="p-2.5">{p.quantity}</td>
                            <td className="p-2.5 italic text-slate-600">{p.usageInstruction}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Electronic Signature display */}
              {selectedRecordDetail.doctorSignature && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 text-xs block">Chữ ký điện tử xác thực:</span>
                    <span className="text-[11px] text-slate-500">Bác sĩ: {selectedRecordDetail.doctorName}</span>
                  </div>
                  {selectedRecordDetail.doctorSignature.startsWith('data:image') ? (
                    <img
                      src={selectedRecordDetail.doctorSignature}
                      alt="Signature"
                      className="h-12 border border-slate-300 rounded bg-white px-2 py-0.5"
                    />
                  ) : (
                    <span className="text-teal-700 font-bold italic font-serif text-sm">
                      {selectedRecordDetail.doctorSignature}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Res QR Modal */}
      {selectedQrRecord && (
        <QrCodeModal
          isOpen={!!selectedQrRecord}
          onClose={() => setSelectedQrRecord(null)}
          title="Mã QR Bệnh Án & Đơn Thuốc"
          subtitle={`Mã: ${selectedQrRecord.recordCode}`}
          qrCodeUrl={selectedQrRecord.qrCodeDataUrl || ''}
          metadata={[
            { label: 'Bệnh nhân', value: selectedQrRecord.patientName },
            { label: 'Bác sĩ', value: selectedQrRecord.doctorName },
            { label: 'Chẩn đoán', value: selectedQrRecord.diagnosis },
            { label: 'Phòng khám', value: selectedQrRecord.clinicRoom },
            { label: 'Ngày khám', value: selectedQrRecord.examDate },
          ]}
          type="medical_record"
        />
      )}
    </div>
  );
};
