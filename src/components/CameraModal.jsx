import React, { useState, useRef, useEffect } from 'react';
import {
  CameraIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { uploadProductPhotoSecure } from '../lib/uploadClient';
import ImageCropper from './ImageCropper';

/**
 * 📸 CameraModal - Componente modale dedicato solo alla fotocamera
 * 
 * Funzionalità:
 * - Si apre come modale quando richiesto
 * - Inquadra e scatta foto
 * - Salva automaticamente con formato SKU+progressivo
 * - Si chiude dopo il salvataggio
 */
const CameraModal = ({ isOpen, onClose, productId, productSku, onPhotoSaved }) => {
  // Stati
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [currentStep, setCurrentStep] = useState('camera'); // 'camera', 'editing'
  const [capturedBlob, setCapturedBlob] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  // Avvia fotocamera quando il modale si apre
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    // Cleanup quando il componente viene smontato
    return () => {
      stopCamera();
    };
  }, [isOpen]);
  
  // Avvia fotocamera
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verifica supporto browser
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Fotocamera non supportata dal browser');
      }
      
      console.log('📸 Avvio fotocamera modale...');
      
      const constraints = {
        video: {
          facingMode: 'environment', // Camera posteriore
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Event listeners
        videoRef.current.addEventListener('loadedmetadata', () => {
          console.log('📸 Video metadata caricati');
        });
        
        videoRef.current.addEventListener('canplay', () => {
          console.log('📸 Video pronto');
          setIsActive(true);
        });
        
        videoRef.current.addEventListener('playing', () => {
          console.log('📸 Video in riproduzione');
          setIsActive(true);
        });
        
        // Avvia riproduzione
        await videoRef.current.play();
        
        // Timeout di sicurezza
        setTimeout(() => {
          if (videoRef.current && streamRef.current) {
            setIsActive(true);
          }
        }, 1500);
      }
      
    } catch (error) {
      console.error('📸 Errore avvio fotocamera:', error);
      
      let errorMessage = 'Errore nell\'avvio della fotocamera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permesso fotocamera negato';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Nessuna fotocamera trovata';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Fotocamera già in uso';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ferma fotocamera
  const stopCamera = () => {
    console.log('📸 Fermando fotocamera modale...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setError(null);
  };
  
  // Cattura foto
  const capturePhoto = async () => {
    if (!isActive || !videoRef.current || capturing) return;
    
    try {
      setCapturing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Imposta dimensioni canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Disegna frame corrente
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Converti in blob e passa all'editing
      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCurrentStep('editing');
          stopCamera();
        }
        setCapturing(false);
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('📸 Errore cattura:', error);
      toast.error('Errore nella cattura della foto');
      setCapturing(false);
    }
  };

  // Conferma foto dopo editing
  const handleCropConfirm = async (editedBlob) => {
    try {
      // Crea file con nome formato SKU+progressivo
      const timestamp = Date.now();
      const fileName = `${productSku}_${timestamp}.jpg`;
      const file = new File([editedBlob], fileName, { type: 'image/jpeg' });
      
      console.log('📸 Salvando foto ottimizzata:', fileName, `(${(editedBlob.size / 1024).toFixed(1)}KB)`);
      toast.loading('Salvando foto...', { id: 'saving-photo' });
      
      // Upload foto
      const result = await uploadProductPhotoSecure(file, productId, productSku);
      
      if (result.data && !result.error) {
        toast.success('Foto salvata!', { id: 'saving-photo' });
        
        // Notifica il componente padre
        if (onPhotoSaved) {
          onPhotoSaved(result.data);
        }
        
        // Reset e chiudi modale
        setCapturedBlob(null);
        setCurrentStep('camera');
        setTimeout(() => {
          onClose();
        }, 1000);
        
      } else {
        throw new Error(result.error?.message || 'Errore nel salvataggio');
      }
      
    } catch (uploadError) {
      console.error('📸 Errore upload:', uploadError);
      toast.error('Errore nel salvataggio della foto', { id: 'saving-photo' });
    }
  };

  // Annulla editing
  const cancelEditing = () => {
    setCapturedBlob(null);
    setCurrentStep('camera');
    startCamera();
  };
  
  // Chiudi modale
  const handleClose = () => {
    stopCamera();
    setCapturedBlob(null);
    setCurrentStep('camera');
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <CameraIcon className="h-5 w-5 mr-2" />
            Scatta Foto - {productSku}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Contenuto */}
        <div className="p-4">
          {/* Step Camera */}
          {currentStep === 'camera' && (
            <>
              {/* Area Video */}
              <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
                {/* Loading */}
                {isLoading && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                    <div className="text-center">
                      <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Avvio fotocamera...</p>
                    </div>
                  </div>
                )}
                
                {/* Errore */}
                {error && (
                  <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
                    <div className="text-center p-4">
                      <div className="text-red-500 mb-2 text-2xl">⚠️</div>
                      <p className="text-sm text-red-600 mb-3">{error}</p>
                      <button
                        onClick={startCamera}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Riprova
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Placeholder quando non attivo */}
                {!isActive && !isLoading && !error && (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Preparazione fotocamera...</p>
                    </div>
                  </div>
                )}
                
                {/* Canvas nascosto per cattura */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              {/* Controlli Camera */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annulla
                </button>
                
                <button
                  onClick={capturePhoto}
                  disabled={!isActive || capturing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {capturing ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Catturando...
                    </>
                  ) : (
                    <>
                      <CameraIcon className="h-4 w-4 mr-2" />
                      Scatta Foto
                    </>
                  )}
                </button>
              </div>
              
              {/* Info */}
              <div className="mt-4 text-center text-sm text-gray-500">
                La foto verrà salvata automaticamente con nome: {productSku}_[timestamp].jpg
              </div>
            </>
          )}
          
          {/* Step Editing */}
          {currentStep === 'editing' && capturedBlob && (
            <ImageCropper
              imageBlob={capturedBlob}
              onConfirm={handleCropConfirm}
              onCancel={cancelEditing}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;