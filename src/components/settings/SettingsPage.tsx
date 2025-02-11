import React, { useState } from 'react';
import { Bell, Lock, Eye, EyeOff, Shield, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    appointments: true,
    reminders: true,
    marketing: false
  });
  const [theme, setTheme] = useState('light');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.put('/patients/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key: keyof typeof notifications) => {
    try {
      setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
      await api.put('/patients/notifications', {
        ...notifications,
        [key]: !notifications[key]
      });
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to update notification settings');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="space-y-6">
      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Shield className="h-6 w-6 text-indigo-500 mr-2" />
          <h2 className="text-xl font-bold">Security Settings</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ 
                  ...passwordData, 
                  currentPassword: e.target.value 
                })}
                className="input-field pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ 
                ...passwordData, 
                newPassword: e.target.value 
              })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ 
                ...passwordData, 
                confirmPassword: e.target.value 
              })}
              className="input-field"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Bell className="h-6 w-6 text-indigo-500 mr-2" />
          <h2 className="text-xl font-bold">Notification Settings</h2>
        </div>

        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{key.replace('_', ' ')}</p>
                <p className="text-sm text-slate-500">
                  Receive notifications for {key.replace('_', ' ')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleNotificationChange(key as keyof typeof notifications)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          {theme === 'light' ? (
            <Sun className="h-6 w-6 text-indigo-500 mr-2" />
          ) : (
            <Moon className="h-6 w-6 text-indigo-500 mr-2" />
          )}
          <h2 className="text-xl font-bold">Theme Settings</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme Mode</p>
            <p className="text-sm text-slate-500">
              Switch between light and dark mode
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="btn-secondary flex items-center"
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Switch to Dark Mode
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Switch to Light Mode
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;