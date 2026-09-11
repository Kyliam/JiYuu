import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, DoctorProfile, Specialty, DEFAULT_DOCTOR_AVATAR } from '../../types';
import { storage } from '../../services/storage';
import { readFileAsOptimizedDataUrl } from '../../utils/imageUtils';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Building2,
  Phone,
  Mail,
  Award,
  Star,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Upload,
  Camera,
  RotateCcw,
} from 'lucide-react';

interface ReceptionistDoctorManagementProps {
  currentUser: User | null;
}

export const ReceptionistDoctorManagement: React.FC<ReceptionistDoctorManagementProps> = ({ currentUser }) => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>(() => storage.getDoctors());

  useEffect(() => {
    const unsub = storage.subscribeStorage(() => {
      setDoctors(storage.getDoctors());
    });
    return unsub;
  }, []);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorProfile | null>(null);

  // Modal State for Delete Confirmation
  const [doctorToDelete, setDoctorToDelete] = useState<DoctorProfile | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [specialty, setSpecialty] = useState<Specialty>('Khoa Nội');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [clinicRoom, setClinicRoom] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200');

  // Feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsOptimizedDataUrl(file);
      setAvatar(dataUrl);
      showToast('success', 'Đã tải ảnh từ thiết bị của bạn thành công!');
    } catch (err: any) {
      showToast('error', err.message || 'Không thể đọc tệp ảnh từ máy tính.');
    }
    e.target.value = '';
  };

  const handleCardUploadPhoto = async (doc: DoctorProfile, file: File) => {
    try {
      const dataUrl = await readFileAsOptimizedDataUrl(file);
      const ok = storage.updateDoctor(doc.id, { avatar: dataUrl });
      if (ok) {
        showToast('success', `Đã cập nhật ảnh đại diện bác sĩ ${doc.fullName} từ máy tính!`);
      } else {
        showToast('error', 'Không thể lưu ảnh đại diện. Vui lòng thử lại.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Không thể đọc tệp ảnh từ máy tính.');
    }
  };

  const handleOpenAdd = () => {
    setEditingDoctor(null);
    setFullName('');
    setSpecialty('Khoa Nội');
    setPhone('');
    setEmail('');
    setClinicRoom('Phòng 101 - Khu A');
    setExperienceYears(5);
    setBio('Bác sĩ chuyên khoa giàu kinh nghiệm, tận tâm với bệnh nhân.');
    setAvatar('https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: DoctorProfile) => {
    setEditingDoctor(doc);
    setFullName(doc.fullName);
    setSpecialty(doc.specialty);
    setPhone(doc.phone);
    setEmail(doc.email);
    setClinicRoom(doc.clinicRoom);
    setExperienceYears(doc.experienceYears);
    setBio(doc.bio || '');
    setAvatar(doc.avatar || DEFAULT_DOCTOR_AVATAR);
    setIsModalOpen(true);
  };

  const handleDeleteDoctor = (doc: DoctorProfile) => {
    setDoctorToDelete(doc);
  };

  const handleConfirmDelete = () => {
    if (!doctorToDelete) return;
    const docName = doctorToDelete.fullName;
    const ok = storage.deleteDoctor(doctorToDelete.id);
    if (ok) {
      showToast('success', `Đã xoá hồ sơ bác sĩ ${docName} khỏi hệ thống.`);
    } else {
      showToast('error', `Không thể xoá bác sĩ ${docName}. Vui lòng thử lại.`);
    }
    setDoctorToDelete(null);
  };

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !clinicRoom.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (editingDoctor) {
      // Update existing doctor
      storage.updateDoctor(editingDoctor.id, {
        fullName,
        specialty,
        phone,
        email,
        clinicRoom,
        experienceYears,
        bio,
        avatar,
      });
      showToast('success', `Đã cập nhật thông tin bác sĩ ${fullName} thành công!`);
    } else {
      // Create new doctor
      storage.createDoctor({
        userId: `usr_doc_${Date.now()}`,
        fullName,
        specialty,
        phone,
        email: email || `${phone}@jiyuu.clinic`,
        clinicRoom,
        experienceYears,
        bio,
        avatar,
        rating: 5.0,
        reviewCount: 0,
        reviews: [],
      });
      showToast('success', `Đã thêm mới bác sĩ ${fullName} vào hệ thống.`);
    }

    setIsModalOpen(false);
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        doc.fullName.toLowerCase().includes(q) ||
        doc.phone.includes(q) ||
        doc.clinicRoom.toLowerCase().includes(q) ||
        doc.experienceYears.toString().includes(q);

      const matchSpecialty = specialtyFilter === 'all' || doc.specialty === specialtyFilter;
      return matchSearch && matchSpecialty;
    });
  }, [doctors, searchTerm, specialtyFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Danh Sách Bác Sĩ Phòng Khám
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tiếp tân quản lý hồ sơ chuyên môn, số điện thoại, phòng khám và phân bổ chuyên khoa
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Bác Sĩ Mới</span>
        </button>
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

      {/* Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, SĐT, phòng khám, số năm KN..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={specialtyFilter}
              onChange={e => setSpecialtyFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium"
            >
              <option value="all">Tất cả chuyên khoa</option>
              <option value="Khoa Nội">Khoa Nội</option>
              <option value="Khoa Ngoại">Khoa Ngoại</option>
              <option value="Chuyên khoa Khác">Chuyên khoa Khác</option>
            </select>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              ({filteredDoctors.length} bác sĩ)
            </span>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDoctors.map(doc => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl border border-slate-200 hover:border-teal-200 bg-white transition space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative group/avatar shrink-0">
                    <img
                      src={doc.avatar || DEFAULT_DOCTOR_AVATAR}
                      alt={doc.fullName}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_DOCTOR_AVATAR;
                      }}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs bg-teal-50 shrink-0 transition"
                    />
                    <label
                      htmlFor={`doctor-avatar-upload-${doc.id}`}
                      className="absolute inset-0 bg-slate-900/65 backdrop-blur-[1px] rounded-2xl opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition cursor-pointer"
                      title="Tải ảnh từ máy tính"
                    >
                      <Camera className="w-4 h-4 text-white" />
                      <span className="text-[9px] font-bold mt-0.5">Đổi ảnh</span>
                    </label>
                    <input
                      id={`doctor-avatar-upload-${doc.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleCardUploadPhoto(doc, f);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{doc.fullName}</h4>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {doc.specialty}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{doc.rating}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({doc.reviewCount} đánh giá)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                    title="Sửa thông tin"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDoctor(doc)}
                    className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                    title="Xoá bác sĩ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  {doc.clinicRoom}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Award className="w-3.5 h-3.5 text-teal-600" />
                  {doc.experienceYears} năm kinh nghiệm
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {doc.phone}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] truncate">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {doc.email}
                </span>
              </div>

              {doc.bio && (
                <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                  "{doc.bio}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                {editingDoctor ? 'Chỉnh Sửa Hồ Sơ Bác Sĩ' : 'Thêm Mới Bác Sĩ Vào Hệ Thống'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Họ và tên bác sĩ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="VD: BS. CKII Lê Văn Hưng"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Chuyên khoa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value as Specialty)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium bg-white"
                  >
                    <option value="Khoa Nội">Khoa Nội</option>
                    <option value="Khoa Ngoại">Khoa Ngoại</option>
                    <option value="Chuyên khoa Khác">Chuyên khoa Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phòng khám <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clinicRoom}
                    onChange={e => setClinicRoom(e.target.value)}
                    placeholder="VD: Phòng 204 - Khu B"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Số năm kinh nghiệm
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={experienceYears}
                    onChange={e => setExperienceYears(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="bacsi@jiyuu.clinic"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Ảnh đại diện Bác sĩ
                </label>
                
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                  <div className="flex items-center gap-4">
                    <img
                      src={avatar || DEFAULT_DOCTOR_AVATAR}
                      alt="Preview"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_DOCTOR_AVATAR;
                      }}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs bg-teal-50 shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor="modal-doctor-avatar-upload"
                          className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tải ảnh từ máy tính</span>
                        </label>
                        <input
                          id="modal-doctor-avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleModalFileUpload}
                        />

                        {avatar !== DEFAULT_DOCTOR_AVATAR && (
                          <button
                            type="button"
                            onClick={() => setAvatar(DEFAULT_DOCTOR_AVATAR)}
                            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                            title="Khôi phục ảnh mặc định"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Ảnh mặc định</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Hỗ trợ định dạng PNG, JPG, JPEG, WEBP từ thiết bị của bạn.
                      </p>
                    </div>
                  </div>

                  {/* Hoặc nhập đường dẫn URL */}
                  <div className="pt-2.5 border-t border-slate-200/60">
                    {/*
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Hoặc nhập liên kết ảnh (URL):
                    </label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={e => setAvatar(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs bg-white"
                    />
                      */}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tóm tắt tiểu sử & thành tựu y khoa
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Giới thiệu học hàm học vị, nơi từng công tác..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingDoctor ? 'Cập nhật' : 'Thêm bác sĩ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {doctorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 border border-slate-100 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900">
                  Xác nhận xoá hồ sơ Bác sĩ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bạn có chắc chắn muốn xoá bác sĩ này khỏi danh sách quản lý?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDoctorToDelete(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctor Info Preview */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3.5">
              <img
                src={doctorToDelete.avatar || DEFAULT_DOCTOR_AVATAR}
                alt={doctorToDelete.fullName}
                onError={e => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_DOCTOR_AVATAR;
                }}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs bg-teal-50 shrink-0"
              />
              <div className="min-w-0 flex-1 text-xs space-y-1">
                <h4 className="font-bold text-slate-900 text-sm truncate">
                  {doctorToDelete.fullName}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold text-[11px] border border-teal-200">
                    {doctorToDelete.specialty}
                  </span>
                  <span className="text-slate-500 truncate">{doctorToDelete.clinicRoom}</span>
                </div>
                <p className="text-slate-500 font-mono text-[11px] truncate">
                  SĐT: {doctorToDelete.phone}
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>Cảnh báo:</strong> Hồ sơ bác sĩ sẽ bị xoá khỏi danh mục và hệ thống tiếp nhận khám bệnh. Các lịch khám liên quan sẽ cần được bàn giao. Hành động này không thể hoàn tác.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDoctorToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận Xóa Bác Sĩ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
