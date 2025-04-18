
import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Standard passport photo size in mm (45x45mm)
const PASSPORT_WIDTH_MM = 45;
const PASSPORT_HEIGHT_MM = 45;

// Pixels per mm (assuming 96 DPI)
const PIXELS_PER_MM = 3.78;

interface SelfieCaptureProps {
  onCapture: (blob: Blob) => void;
}

const SelfieCapture = ({ onCapture }: SelfieCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const startCamera = async () => {
    try {
      setCameraError(null);
      
      // Request user media with different constraints to maximize compatibility
      const userMedia = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false
      });
      
      setStream(userMedia);
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = userMedia;
        // Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => {
            console.error("Video playback error:", e);
            setCameraError("Could not start video playback. Please try again.");
          });
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError("Could not access your camera. Please ensure you've granted camera permissions.");
    }
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };
  
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      // Set canvas dimensions to match passport photo specifications
      const width = Math.round(PASSPORT_WIDTH_MM * PIXELS_PER_MM);
      const height = Math.round(PASSPORT_HEIGHT_MM * PIXELS_PER_MM);
      
      canvas.width = width;
      canvas.height = height;
      
      // Calculate square crop dimensions from video
      const videoWidth = video.videoWidth || video.clientWidth;
      const videoHeight = video.videoHeight || video.clientHeight;
      
      if (!videoWidth || !videoHeight) {
        console.error("Video dimensions not available");
        setCameraError("Could not determine video dimensions. Please try again.");
        return;
      }
      
      const size = Math.min(videoWidth, videoHeight);
      const offsetX = (videoWidth - size) / 2;
      const offsetY = (videoHeight - size) / 2;
      
      // Draw face centered in the canvas
      try {
        context.drawImage(
          video,
          offsetX,               // Source X
          offsetY,               // Source Y
          size,                  // Source Width
          size,                  // Source Height
          0,                     // Destination X
          0,                     // Destination Y
          width,                 // Destination Width
          height                 // Destination Height
        );
        
        // Convert to data URL
        const imageDataURL = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageDataURL);
        
        // Convert to blob and send to parent
        canvas.toBlob(
          (blob) => {
            if (blob) {
              onCapture(blob);
            } else {
              setCameraError("Failed to process the image. Please try again.");
            }
          },
          'image/jpeg',
          0.9
        );
        
        // Stop camera after capture
        stopCamera();
      } catch (e) {
        console.error("Error capturing photo:", e);
        setCameraError("Error while capturing photo. Please try again.");
      }
    }
  };
  
  const retakePhoto = () => {
    setCapturedImage(null);
    setCameraError(null);
    startCamera();
  };
  
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  return (
    <Card className="w-full max-w-md mx-auto border rounded-lg overflow-hidden">
      <CardContent className="p-0">
        {!isCameraActive && !capturedImage && (
          <div className="p-6 flex flex-col items-center">
            <Button 
              onClick={startCamera} 
              className="w-full"
              variant="default"
            >
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Take a passport photo (45mm x 45mm)
            </p>
            {cameraError && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {cameraError}
              </div>
            )}
          </div>
        )}
        
        {isCameraActive && !capturedImage && (
          <div className="relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-white rounded-full w-48 h-48 opacity-50"></div>
            </div>
            <div className="p-3 bg-background">
              <Button 
                onClick={capturePhoto} 
                className="w-full"
                variant="default"
              >
                Capture Photo
              </Button>
            </div>
          </div>
        )}
        
        {capturedImage && (
          <div className="p-3">
            <div className="mb-3 flex justify-center">
              <img 
                src={capturedImage} 
                alt="Captured selfie" 
                className="border rounded max-w-full max-h-64" 
              />
            </div>
            <Button 
              onClick={retakePhoto} 
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake Photo
            </Button>
          </div>
        )}
        
        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
};

export default SelfieCapture;
