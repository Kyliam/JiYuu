CREATE DATABASE JiYuu;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    phone VARCHAR(20),

    role VARCHAR(20) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_users_role
        CHECK (role IN ('PATIENT', 'DOCTOR', 'RECEPTIONIST'))
);

CREATE TABLE doctors (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE,

    specialty VARCHAR(100) NOT NULL,

    experience_years INTEGER NOT NULL DEFAULT 0,

    room VARCHAR(50),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_experience
        CHECK (experience_years >= 0)
);

CREATE TABLE schedules (
    id BIGSERIAL PRIMARY KEY,

    doctor_id BIGINT NOT NULL,

    work_date DATE NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_schedule_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_schedule_time
        CHECK (end_time > start_time)
);

CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT NOT NULL,

    doctor_id BIGINT NOT NULL,

    schedule_id BIGINT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    reason TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointment_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointment_schedule
        FOREIGN KEY (schedule_id)
        REFERENCES schedules(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_appointment_status
        CHECK (
            status IN (
                'PENDING',
                'CONFIRMED',
                'CANCELLED',
                'COMPLETED'
            )
        )
);

CREATE UNIQUE INDEX uq_active_appointment_schedule
ON appointments(schedule_id)
WHERE status IN ('PENDING', 'CONFIRMED');

