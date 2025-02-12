import mongoose from 'mongoose';
import userSchema from './User.js';
import doctorSchema from './Doctor.js';
import patientSchema from './Patient.js';
import appointmentSchema from './Appointment.js';
import messageSchema from './Message.js';
import medicalRecordSchema from './MedicalRecord.js';
import productSchema from './Product.js';

// Register all models
const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Patient = mongoose.model('Patient', patientSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Message = mongoose.model('Message', messageSchema);
const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
const Product = mongoose.model('Product', productSchema);

export {
  User,
  Doctor,
  Patient,
  Appointment,
  Message,
  MedicalRecord,
  Product
};