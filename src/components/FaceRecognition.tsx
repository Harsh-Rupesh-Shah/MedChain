// components/FaceRecognition.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as faceapi from 'face-api.js';
import { createCanvas, loadImage } from 'canvas';

interface FaceRecognitionProps {
  onSuccess: (image: string) => void;
  onCancel: () => void;
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ onSuccess, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (isCameraActive && videoRef.current) {
      const loadModels = async () => {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
      };

      loadModels();
    }
  }, [isCameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (error) {
      toast.error('Failed to access camera');
      console.error('Camera access error:', error);
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    const dataUrl = canvasRef.current.toDataURL('image/jpeg');
    onSuccess(dataUrl);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        className="w-full h-64 object-cover rounded-lg"
      />
      {!isCameraActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <Camera className="h-10 w-10 text-white" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-0"
        width={640}
        height={480}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-between px-4 py-2 bg-white/80 backdrop-blur-sm">
        <button
          onClick={stopCamera}
          className="btn-secondary p-2"
          disabled={!isCameraActive}
        >
          <X className="h-5 w-5" />
          Cancel
        </button>
        <button
          onClick={isCameraActive ? captureImage : startCamera}
          className="btn-primary p-2"
        >
          {isCameraActive ? 'Capture' : 'Start Camera'}
        </button>
      </div>
    </div>
  );
};

export default FaceRecognition;