import React, { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

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
}

const ProfileSection = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients/profile');
      setProfile(response.data);
      setEditedProfile(response.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedProfile) return;

    try {
      setLoading(true);
      const response = await api.put('/patients/profile', editedProfile);
      setProfile(response.data);
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
                  value={editedProfile?.name}
                  onChange={(e) => setEditedProfile({ ...editedProfile!, name: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{profile?.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <p className="text-slate-900">{profile?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={editedProfile?.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile!, phone: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{profile?.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address
              </label>
              {editing ? (
                <textarea
                  value={editedProfile?.address}
                  onChange={(e) => setEditedProfile({ ...editedProfile!, address: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              ) : (
                <p className="text-slate-900">{profile?.address}</p>
              )}
            </div>
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
                  value={editedProfile?.dateOfBirth}
                  onChange={(e) => setEditedProfile({ ...editedProfile!, dateOfBirth: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">
                  {new Date(profile?.dateOfBirth || '').toLocaleDateString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Gender
              </label>
              {editing ? (
                <select
                  value={editedProfile?.gender}
                  onChange={(e) => setEditedProfile({ ...editedProfile!, gender: e.target.value as 'male' | 'female' | 'other' })}
                  className="input-field"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-slate-900">{profile?.gender}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Blood Group
              </label>
              {editing ? (
                <select
                  value={editedProfile?.bloodGroup}
                  onChange={(e) => setEditedProfile({ ...editedProfile!, bloodGroup: e.target.value })}
                  className="input-field"
                >
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
                <p className="text-slate-900">{profile?.bloodGroup}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Allergies
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editedProfile?.allergies.join(', ')}
                  onChange={(e) => setEditedProfile({ 
                    ...editedProfile!, 
                    allergies: e.target.value.split(',').map(item => item.trim()) 
                  })}
                  className="input-field"
                  placeholder="Separate allergies with commas"
                />
              ) : (
                <p className="text-slate-900">{profile?.allergies.join(', ') || 'None'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Chronic Conditions
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editedProfile?.chronicConditions.join(', ')}
                  onChange={(e) => setEditedProfile({ 
                    ...editedProfile!, 
                    chronicConditions: e.target.value.split(',').map(item => item.trim()) 
                  })}
                  className="input-field"
                  placeholder="Separate conditions with commas"
                />
              ) : (
                <p className="text-slate-900">{profile?.chronicConditions.join(', ') || 'None'}</p>
              )}
            </div>
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
                  value={editedProfile?.emergencyContact.name}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile!,
                    emergencyContact: {
                      ...editedProfile!.emergencyContact,
                      name: e.target.value
                    }
                  })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{profile?.emergencyContact.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Relationship
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editedProfile?.emergencyContact.relationship}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile!,
                    emergencyContact: {
                      ...editedProfile!.emergencyContact,
                      relationship: e.target.value
                    }
                  })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{profile?.emergencyContact.relationship}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={editedProfile?.emergencyContact.phone}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile!,
                    emergencyContact: {
                      ...editedProfile!.emergencyContact,
                      phone: e.target.value
                    }
                  })}
                  className="input-field"
                />
              ) : (
                <p className="text-slate-900">{profile?.emergencyContact.phone}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;