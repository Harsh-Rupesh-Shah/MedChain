import React, { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

interface Profile {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  specialization?: string;
  licenseNumber?: string;
  experience?: number;
}

const defaultProfile: Profile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  gender: 'male',
  bloodGroup: '',
  allergies: [],
  chronicConditions: [],
  emergencyContact: {
    name: '',
    relationship: '',
    phone: ''
  }
};

const ProfileSection = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [editedProfile, setEditedProfile] = useState<Profile>(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'doctor' ? '/doctors/profile' : '/patients/profile';
      const response = await api.get(endpoint);
      
      // Ensure all required fields exist with default values
      const profileData = {
        ...defaultProfile,
        ...response.data,
        emergencyContact: {
          ...defaultProfile.emergencyContact,
          ...response.data.emergencyContact
        }
      };
      
      setProfile(profileData);
      setEditedProfile(profileData);
    } catch (error) {
      toast.error('Failed to load profile');
      setProfile(defaultProfile);
      setEditedProfile(defaultProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'doctor' ? '/doctors/profile' : '/patients/profile';
      const response = await api.put(endpoint, editedProfile);
      
      // Ensure all required fields exist with default values
      const updatedProfile = {
        ...defaultProfile,
        ...response.data,
        emergencyContact: {
          ...defaultProfile.emergencyContact,
          ...response.data.emergencyContact
        }
      };
      
      setProfile(updatedProfile);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Profile Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Profile Information</h2>
          {editing ? (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="btn-primary flex items-center"
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditedProfile(profile);
                }}
                className="btn-secondary flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary flex items-center"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{profile.name || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <p className="text-slate-900">{profile.email || 'Not set'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{profile.phone || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address
              </label>
              {editing ? (
                <textarea
                  value={editedProfile.address}
                  onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              ) : (
                <p className="text-slate-900">{profile.address || 'Not set'}</p>
              )}
            </div>

            {user?.role === 'doctor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Specialization
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editedProfile.specialization}
                      onChange={(e) => setEditedProfile({ ...editedProfile, specialization: e.target.value })}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-slate-900">{profile.specialization || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    License Number
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editedProfile.licenseNumber}
                      onChange={(e) => setEditedProfile({ ...editedProfile, licenseNumber: e.target.value })}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-slate-900">{profile.licenseNumber || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Years of Experience
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      value={editedProfile.experience}
                      onChange={(e) => setEditedProfile({ ...editedProfile, experience: parseInt(e.target.value) })}
                      className="input-field"
                      min="0"
                    />
                  ) : (
                    <p className="text-slate-900">{profile.experience ? `${profile.experience} years` : 'Not set'}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Medical Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Medical Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date of Birth
              </label>
              {editing ? (
                <input
                  type="date"
                  value={editedProfile.dateOfBirth}
                  onChange={(e) => setEditedProfile({ ...editedProfile, dateOfBirth: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">
                  {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Gender
              </label>
              {editing ? (
                <select
                  value={editedProfile.gender}
                  onChange={(e) => setEditedProfile({ ...editedProfile, gender: e.target.value as 'male' | 'female' | 'other' })}
                  className="input-field"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-slate-900">{profile.gender || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Blood Group
              </label>
              {editing ? (
                <select
                  value={editedProfile.bloodGroup}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bloodGroup: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              ) : (
                <p className="text-slate-900">{profile.bloodGroup || 'Not set'}</p>
              )}
            </div>

            {user?.role === 'patient' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Allergies
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editedProfile.allergies.join(', ')}
                      onChange={(e) => setEditedProfile({ 
                        ...editedProfile, 
                        allergies: e.target.value.split(',').map(item => item.trim()) 
                      })}
                      className="input-field"
                      placeholder="Separate allergies with commas"
                    />
                  ) : (
                    <p className="text-slate-900">{profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Chronic Conditions
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editedProfile.chronicConditions.join(', ')}
                      onChange={(e) => setEditedProfile({ 
                        ...editedProfile, 
                        chronicConditions: e.target.value.split(',').map(item => item.trim()) 
                      })}
                      className="input-field"
                      placeholder="Separate conditions with commas"
                    />
                  ) : (
                    <p className="text-slate-900">{profile.chronicConditions.length > 0 ? profile.chronicConditions.join(', ') : 'None'}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editedProfile.emergencyContact.name}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    emergencyContact: {
                      ...editedProfile.emergencyContact,
                      name: e.target.value
                    }
                  })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{profile.emergencyContact.name || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Relationship
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editedProfile.emergencyContact.relationship}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    emergencyContact: {
                      ...editedProfile.emergencyContact,
                      relationship: e.target.value
                    }
                  })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{profile.emergencyContact.relationship || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={editedProfile.emergencyContact.phone}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    emergencyContact: {
                      ...editedProfile.emergencyContact,
                      phone: e.target.value
                    }
                  })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{profile.emergencyContact.phone || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;