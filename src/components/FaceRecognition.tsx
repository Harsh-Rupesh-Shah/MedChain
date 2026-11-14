// components/FaceRecognition.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FaceRecognitionProps {
  onSuccess: (image: string) => void;
  onCancel: () => void;
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ onSuccess, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('Error stopping media tracks:', e);
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (error) {
      toast.error('Failed to access camera. Please check camera permissions.');
      console.error('Camera access error:', error);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth || 640;
    canvasRef.current.height = videoRef.current.videoHeight || 480;
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);

    // Stop camera immediately upon successful capture
    stopCamera();
    onSuccess(dataUrl);
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      <div className="relative w-full h-72 bg-slate-950 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
        />
        {!isCameraActive && (
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-300">
              <Camera className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Biometric Face Authentication</p>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              Click Start Camera to capture your face. The camera will turn off immediately once captured.
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Start Camera
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-t border-slate-700">
        <button
          type="button"
          onClick={handleCancel}
          className="px-3.5 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>

        {isCameraActive && (
          <button
            type="button"
            onClick={captureImage}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Check className="h-4 w-4" />
            Capture Photo
          </button>
        )}
      </div>
    </div>
  );
};

export default FaceRecognition;
