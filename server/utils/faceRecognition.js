import * as faceapi from 'face-api.js';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize canvas environment for face-api.js
const { Canvas, Image, ImageData } = await import('canvas');
faceapi.env.monkeyPatch({
  Canvas: Canvas,
  Image: Image,
  ImageData: ImageData
});

// Model paths
const MODEL_URL = path.join(__dirname, '../models');

// Load models
const loadModels = async () => {
  console.log(`Loading models from: ${MODEL_URL}`);
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
    console.log('Models loaded successfully');
  } catch (err) {
    console.error('Error loading models:', err);
    throw err;
  }
};

// Custom image loader
const loadImageForFaceAPI = async (imagePath) => {
  try {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
  } catch (err) {
    console.error('Error loading image:', err);
    throw err;
  }
};

// Verify face
const verifyFace = async (uploadedPath, storedPath) => {
  try {
    await loadModels();

    console.log('Loading images...');
    console.log('Uploaded path:', uploadedPath);
    console.log('Stored path:', storedPath);

    // Verify files exist
    if (!fs.existsSync(uploadedPath) || !fs.existsSync(storedPath)) {
      console.error('One or both image files do not exist');
      return false;
    }

    const [img1, img2] = await Promise.all([
      loadImageForFaceAPI(uploadedPath),
      loadImageForFaceAPI(storedPath)
    ]);

    console.log('Detecting faces...');
    const [detections1, detections2] = await Promise.all([
      faceapi.detectAllFaces(img1).withFaceLandmarks().withFaceDescriptors(),
      faceapi.detectAllFaces(img2).withFaceLandmarks().withFaceDescriptors()
    ]);

    console.log(`Found ${detections1.length} face(s) in image 1`);
    console.log(`Found ${detections2.length} face(s) in image 2`);

    if (detections1.length === 0 || detections2.length === 0) {
      console.log('No faces detected in one or both images');
      return false;
    }

    const distance = faceapi.euclideanDistance(
      detections1[0].descriptor,
      detections2[0].descriptor
    );
    
    console.log(`Face distance: ${distance}`);
    return distance < 0.6;
  } catch (err) {
    console.error('Face verification error:', err);
    return false;
  }
};

export { verifyFace };