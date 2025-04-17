import express from 'express';
import { auth } from '../middleware/auth.js';
import { MedicalRecord, Doctor } from '../models/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = 'uploads/medical-records';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get medical records for a patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    // Check authorization
    if (req.user.role === 'patient' && req.user.userId !== req.params.patientId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // If doctor, verify they have access to this patient
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.userId });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
    }

    const records = await MedicalRecord.find({ patient: req.params.patientId })
      .populate('doctor', 'name')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new medical record
router.post('/', auth, upload.array('attachments'), async (req, res) => {
  try {
    const { type, title, date, description } = req.body;

    const attachments = req.files?.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    })) || [];

    // Create base record data
    const recordData = {
      patient: req.body.patientId || req.user.userId, // Allow doctors to specify patient
      type,
      title,
      date,
      description,
      attachments
    };

    // If the user is a doctor, add their ID as the doctor field
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.userId });
      if (doctor) {
        recordData.doctor = doctor._id;
      }
    }

    const record = new MedicalRecord(recordData);
    await record.save();

    // Populate doctor info before sending response
    const populatedRecord = await MedicalRecord.findById(record._id)
      .populate('doctor', 'name')
      .populate('patient', 'name');

    res.status(201).json(populatedRecord);
  } catch (error) {
    console.error('Add medical record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download medical record attachment
router.get('/:recordId/download/:filename', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Check authorization
    if (req.user.role === 'patient' && record.patient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const attachment = record.attachments.find(a => a.filename === req.params.filename);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    res.download(attachment.path, attachment.originalName);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete medical record
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Check authorization
    if (req.user.role === 'patient' && record.patient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete attachments
    for (const attachment of record.attachments) {
      try {
        fs.unlinkSync(attachment.path);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    await record.deleteOne();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;