import mongoose from 'mongoose';
import userSchema from './User.js';
import doctorSchema from './Doctor.js';
import patientSchema from './Patient.js';
import appointmentSchema from './Appointment.js';
import messageSchema from './Message.js';
import medicalRecordSchema from './MedicalRecord.js';
import productSchema from './Product.js';

// Register all models and export them
export const User = mongoose.model('User', userSchema);
export const Doctor = mongoose.model('Doctor', doctorSchema);
export const Patient = mongoose.model('Patient', patientSchema);
export const Appointment = mongoose.model('Appointment', appointmentSchema);
export const Message = mongoose.model('Message', messageSchema);
export const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
export const Product = mongoose.model('Product', productSchema);
