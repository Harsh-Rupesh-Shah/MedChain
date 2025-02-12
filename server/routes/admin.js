import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { User, Doctor } from '../models/index.js';

const router = express.Router();

// Get all pending doctor verifications
router.get('/pending-doctors', auth, checkRole(['admin']), async (req, res) => {
  try {
    const pendingDoctors = await User.aggregate([
      {
        $match: {
          role: 'doctor',
          verificationStatus: 'pending'
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'profile',
          foreignField: '_id',
          as: 'doctorProfile'
        }
      },
      {
        $unwind: '$doctorProfile'
      },
      {
        $project: {
          _id: 1,
          email: 1,
          name: '$doctorProfile.name',
          specialization: '$doctorProfile.specialization',
          licenseNumber: '$doctorProfile.licenseNumber',
          experience: '$doctorProfile.experience',
          idCardImage: '$doctorProfile.idCardImage',
          createdAt: 1
        }
      }
    ]);

    res.json(pendingDoctors);
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify or reject a doctor
router.put('/verify-doctor/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    user.verificationStatus = status;
    user.isVerified = status === 'approved';
    await user.save();

    res.json({ message: `Doctor ${status} successfully` });
  } catch (error) {
    console.error('Error updating doctor verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;