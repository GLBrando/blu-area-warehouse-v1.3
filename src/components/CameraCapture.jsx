import { useState, useRef, useCallback, useEffect } from 'react'
import {
  CameraIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import ImageCropper from './ImageCropper'

const CameraCapture = ({ onCapture, onClose, isOpen }) => {
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [facingMode, setFacingMode] = useState('environment') // 'user' per frontale, 'environment' per posteriore
  const [currentStep, setCurrentStep] = useState('camera') // 'camera', 'editing', 'preview'
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Avvia la fotocamera
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Ferma stream precedente se esiste
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Errore accesso fotocamera:', error)
      toast.error('Impossibile accedere alla fotocamera')
    } finally {
      setIsLoading(false)
    }
  }, [facingMode, stream])

  // Ferma la fotocamera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  // Scatta la foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    // Imposta le dimensioni del canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Disegna il frame corrente del video sul canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Converti in blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob)
        setCapturedImage({ blob, url: imageUrl })
        setCurrentStep('editing')
        stopCamera()
      }
    }, 'image/jpeg', 0.9)
  }, [stopCamera])

  // Conferma la foto dopo editing
  const handleCropConfirm = useCallback((editedBlob) => {
    const imageUrl = URL.createObjectURL(editedBlob)
    setCapturedImage({ blob: editedBlob, url: imageUrl })
    setCurrentStep('preview')
  }, [])

  // Conferma la foto finale
  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage.blob)
      setCapturedImage(null)
      setCurrentStep('camera')
      onClose()
    }
  }, [capturedImage, onCapture, onClose])

  // Scarta la foto e riavvia la camera
  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url)
      setCapturedImage(null)
    }
    setCurrentStep('camera')
    startCamera()
  }, [capturedImage, startCamera])

  // Torna all'editing
  const backToEditing = useCallback(() => {
    setCurrentStep('editing')
  }, [])

  // Annulla editing
  const cancelEditing = useCallback(() => {
    setCurrentStep('camera')
    startCamera()
  }, [startCamera])

  // Cambia fotocamera (frontale/posteriore)
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [])

  // Chiudi e pulisci
  const handleClose = useCallback(() => {
    stopCamera()
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url)
      setCapturedImage(null)
    }
    setCurrentStep('camera')
    onClose()
  }, [stopCamera, capturedImage, onClose])

  // Avvia la camera quando il componente si apre
  useEffect(() => {
    if (isOpen && currentStep === 'camera' && !capturedImage) {
      startCamera()
    }
  }, [isOpen, currentStep, capturedImage, startCamera])

  // Cleanup quando il componente si smonta
  useEffect(() => {
    return () => {
      stopCamera()
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage.url)
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="relative w-full h-full max-w-4xl max-h-screen bg-black">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
          
          {!capturedImage && (
            <button
              onClick={switchCamera}
              className="text-white hover:text-gray-300 transition-colors"
              title="Cambia fotocamera"
            >
              <ArrowPathIcon className="h-8 w-8" />
            </button>
          )}
        </div>

        {/* Contenuto principale */}
        <div className="w-full h-full flex items-center justify-center">
          {currentStep === 'preview' && capturedImage ? (
            // Anteprima foto finale
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={capturedImage.url}
                alt="Foto finale"
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Controlli anteprima finale */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  onClick={backToEditing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-colors flex items-center space-x-2"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  <span>Modifica</span>
                </button>
                <button
                  onClick={retakePhoto}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full transition-colors flex items-center space-x-2"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  <span>Rifai</span>
                </button>
                <button
                  onClick={confirmPhoto}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full transition-colors flex items-center space-x-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  <span>Conferma</span>
                </button>
              </div>
            </div>
          ) : currentStep === 'camera' ? (
            // Video della fotocamera
            <div className="relative w-full h-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Avvio fotocamera...</p>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Pulsante scatta foto */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={capturePhoto}
                      className="bg-white hover:bg-gray-100 text-gray-900 w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg"
                      title="Scatta foto"
                    >
                      <CameraIcon className="h-8 w-8" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null
        }

        {/* Canvas nascosto per cattura */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      {/* ImageCropper per editing */}
      {currentStep === 'editing' && capturedImage && (
        <ImageCropper
          imageBlob={capturedImage.blob}
          onConfirm={handleCropConfirm}
          onCancel={cancelEditing}
        />
      )}
    </div>
  )
}

export default CameraCapture