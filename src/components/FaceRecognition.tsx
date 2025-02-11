import React, { useState, useRef } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FaceRecognitionProps {
  onCapture: (image: File) => Promise<void>;
  mode: 'register' | 'verify';
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ onCapture, mode }) => {
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
      toast.error('Please select an image first');
      return;
    }

    try {
      setLoading(true);
      await onCapture(selectedFile);
      
      // Clear the selection after successful processing
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process image';
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
              alt="Face Preview"
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
              {loading ? 'Processing...' : mode === 'register' ? 'Register Face' : 'Verify Face'}
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center cursor-pointer min-h-[400px]"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="mb-4 p-4 rounded-full bg-indigo-50">
              <Camera className="h-12 w-12 text-indigo-500" />
            </div>
            <p className="text-lg font-medium text-slate-700 mb-2">
              {mode === 'register' ? 'Register Your Face' : 'Verify Your Face'}
            </p>
            <p className="text-sm text-slate-500 text-center">
              Click to upload or drag and drop<br />
              PNG, JPG up to 5MB
            </p>
            <div className="flex items-center mt-4">
              <Upload className="h-5 w-5 text-indigo-500 mr-2" />
              <span className="text-indigo-500">Upload Image</span>
            </div>
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

      <div className="mt-4 text-sm text-slate-500 text-center">
        <p>Please ensure:</p>
        <ul className="list-disc list-inside">
          <li>Your face is clearly visible</li>
          <li>Good lighting conditions</li>
          <li>No filters or edits on the photo</li>
        </ul>
      </div>
    </div>
  );
};

export default FaceRecognition;