-- 1. Bảng Users (Bổ sung ADMIN, UNIQUE phone)
CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN');

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    avatar_url TEXT,
    dob DATE,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Doctors (Bổ sung đánh giá)
CREATE TABLE doctors (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL,
    experience_years INTEGER DEFAULT 0,
    room VARCHAR(50),
    qualifications TEXT, -- Bằng cấp, chứng chỉ
    rating_avg NUMERIC(3,2) DEFAULT 0.0,
    review_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Schedules (Bổ sung Trạng thái Duyệt của Tiếp tân)
CREATE TYPE schedule_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE schedules (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT REFERENCES doctors(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    status schedule_status DEFAULT 'PENDING',
    approved_by BIGINT REFERENCES users(id), -- Receptionist ID
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Appointments (Bổ sung Đặt hộ, Mã QR, Status CHECKED_IN)
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    appointment_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    patient_id BIGINT REFERENCES users(id),
    doctor_id BIGINT REFERENCES doctors(id),
    schedule_id BIGINT REFERENCES schedules(id),
    status appointment_status DEFAULT 'PENDING',
    reason TEXT,
    -- Thông tin khám bệnh (nếu đặt hộ người thân)
    is_for_relative BOOLEAN DEFAULT FALSE,
    patient_name VARCHAR(100),
    patient_phone VARCHAR(20),
    patient_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Medical Records (Bệnh án - MỚI BỔ SUNG)
CREATE TYPE record_status AS ENUM ('TREATING', 'CURED');

CREATE TABLE medical_records (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT UNIQUE REFERENCES appointments(id),
    patient_id BIGINT REFERENCES users(id),
    doctor_id BIGINT REFERENCES doctors(id),
    symptoms TEXT,          -- Triệu chứng
    diagnosis TEXT,         -- Chẩn đoán
    treatment_plan TEXT,    -- Cách điều trị
    revisit_date DATE,      -- Lịch tái khám
    status record_status DEFAULT 'TREATING',
    doctor_signature TEXT,
    qr_code_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Reviews (Đánh giá & Phản hồi - MỚI BỔ SUNG)
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT UNIQUE REFERENCES appointments(id),
    patient_id BIGINT REFERENCES users(id),
    doctor_id BIGINT REFERENCES doctors(id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);