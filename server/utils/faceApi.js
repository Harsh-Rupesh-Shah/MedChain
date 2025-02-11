import * as faceapi from 'face-api.js';
import { createCanvas, loadImage } from 'canvas';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure face-api.js to use node-canvas
const canvas = createCanvas(1000, 1000);
const faceDetectionNet = faceapi.nets.ssdMobilenetv1;
const faceDetectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });

// Load models
const loadModels = async () => {
  // Update path to point to the server/models directory
  const modelsPath = join(__dirname, '../models');
  
  try {
    // Load each model individually with proper error handling
    await Promise.all([
      faceDetectionNet.loadFromDisk(modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath)
    ]);
    
    console.log('Face-api models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    console.error('Models path:', modelsPath);
    throw new Error('Failed to load face recognition models. Please ensure all model files are present in the server/models directory.');
  }
};

// Initialize models on startup
loadModels().catch(error => {
  console.error('Face API initialization error:', error);
});

export { canvas, faceDetectionNet, faceDetectionOptions, loadModels };