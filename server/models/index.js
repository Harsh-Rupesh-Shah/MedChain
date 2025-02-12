import mongoose from 'mongoose';
import User from './User.js';
import Doctor from './Doctor.js';
import Patient from './Patient.js';
import Appointment from './Appointment.js';
import Message from './Message.js';
import MedicalRecord from './MedicalRecord.js';
import Product from './Product.js';

// Register all models
mongoose.model('User', User.schema);
mongoose.model('Doctor', Doctor.schema);
mongoose.model('Patient', Patient.schema);
mongoose.model('Appointment', Appointment.schema);
mongoose.model('Message', Message.schema);
mongoose.model('MedicalRecord', MedicalRecord.schema);
mongoose.model('Product', Product.schema);

export {
  User,
  Doctor,
  Patient,
  Appointment,
  Message,
  MedicalRecord,
  Product
};