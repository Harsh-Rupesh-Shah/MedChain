import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DoctorIdVerificationProps {
  onCapture: (image: File) => Promise<void>;
  mode: 'register' | 'verify';
}

const DoctorIdVerification: React.FC<DoctorIdVerificationProps> = ({ onCapture, mode }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select an ID card image');
      return;
    }

    try {
      setLoading(true);
      await onCapture(selectedFile);
      toast.success(`ID card ${mode === 'register' ? 'registered' : 'verified'} successfully`);
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process ID card';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      )}

      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="ID Card Preview"
              className="max-w-full h-auto rounded-lg"
            />
            <button
              onClick={clearSelection}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary w-full mt-4"
              disabled={loading}
            >
              {loading ? 'Processing...' : `${mode === 'register' ? 'Register' : 'Verify'} ID Card`}
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-600 text-center mb-2">
              {mode === 'register' ? 'Upload your doctor ID card' : 'Upload ID card for verification'}
            </p>
            <p className="text-sm text-slate-500 text-center">
              Click to upload or drag and drop<br />
              PNG, JPG up to 5MB
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default DoctorIdVerification