import QRCode from 'qrcode';

export interface AppointmentQrPayload {
  bookingCode: string;
  patientName: string;
  appointmentTime: string;
  appointmentDate: string;
  doctorName: string;
  clinicRoom: string;
  phone: string;
}

export interface MedicalRecordQrPayload {
  recordCode: string;
  patientName: string;
  examDate: string;
  doctorName: string;
  clinicRoom: string;
  diagnosis: string;
  treatment: string;
  medicinesCount: number;
}

export async function generateAppointmentQrCode(data: AppointmentQrPayload): Promise<string> {
  const content = JSON.stringify({
    type: 'JIYUU_APPOINTMENT',
    code: data.bookingCode,
    patient: data.patientName,
    time: `${data.appointmentTime} - ${data.appointmentDate}`,
    doctor: data.doctorName,
    room: data.clinicRoom,
    phone: data.phone,
    verifiedUrl: `https://jiyuu-clinic.vn/checkin/${data.bookingCode}`,
  });

  try {
    const dataUrl = await QRCode.toDataURL(content, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating appointment QR code:', err);
    return '';
  }
}

export async function generateMedicalRecordQrCode(data: MedicalRecordQrPayload): Promise<string> {
  const content = JSON.stringify({
    type: 'JIYUU_MEDICAL_RECORD',
    recordCode: data.recordCode,
    patient: data.patientName,
    examDate: data.examDate,
    doctor: data.doctorName,
    room: data.clinicRoom,
    diagnosis: data.diagnosis,
    treatment: data.treatment,
    medsCount: data.medicinesCount,
    pharmacyToken: `RX-${data.recordCode}-${Date.now()}`,
  });

  try {
    const dataUrl = await QRCode.toDataURL(content, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#047857', // Emerald dark for prescription/medical
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating medical record QR code:', err);
    return '';
  }
}
