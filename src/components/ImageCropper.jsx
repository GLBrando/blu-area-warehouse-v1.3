import { useState, useRef, useEffect, useCallback } from 'react'
import {
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  ScissorsIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

/**
 * 🖼️ ImageCropper - Componente per ritaglio e ridimensionamento immagini
 * 
 * Funzionalità:
 * - Ritaglio tramite selezione area
 * - Ridimensionamento con slider
 * - Controllo qualità compressione
 * - Anteprima in tempo reale
 * - Ottimizzazione peso file
 */
const ImageCropper = ({ imageBlob, onConfirm, onCancel }) => {
  // Stati
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [quality, setQuality] = useState(0.8)
  const [outputSize, setOutputSize] = useState({ width: 800, height: 600 })
  const [previewBlob, setPreviewBlob] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Refs
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const previewCanvasRef = useRef(null)

  // Carica l'immagine iniziale
  useEffect(() => {
    if (imageBlob) {
      const img = new Image()
      const url = URL.createObjectURL(imageBlob)
      
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height })
        
        // Imposta area di ritaglio iniziale (80% dell'immagine)
        const margin = 0.1
        setCropArea({
          x: img.width * margin,
          y: img.height * margin,
          width: img.width * (1 - 2 * margin),
          height: img.height * (1 - 2 * margin)
        })
        
        // Disegna l'immagine sul canvas
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        imageRef.current = img
        URL.revokeObjectURL(url)
      }
      
      img.src = url
    }
  }, [imageBlob])

  // Aggiorna anteprima quando cambiano i parametri
  useEffect(() => {
    updatePreview()
  }, [cropArea, scale, quality, outputSize])

  // Gestione mouse down per iniziare il drag
  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    setIsDragging(true)
    setDragStart({ x, y })
    setCropArea(prev => ({ ...prev, x, y, width: 0, height: 0 }))
  }, [])

  // Gestione mouse move per il drag
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    const width = Math.abs(x - dragStart.x)
    const height = Math.abs(y - dragStart.y)
    const startX = Math.min(x, dragStart.x)
    const startY = Math.min(y, dragStart.y)
    
    setCropArea({ x: startX, y: startY, width, height })
  }, [isDragging, dragStart])

  // Gestione mouse up per terminare il drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Aggiorna anteprima ritagliata
  const updatePreview = useCallback(() => {
    if (!imageRef.current || !cropArea.width || !cropArea.height) return
    
    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Calcola dimensioni finali mantenendo aspect ratio
    const aspectRatio = cropArea.width / cropArea.height
    let finalWidth = outputSize.width
    let finalHeight = outputSize.height
    
    if (finalWidth / finalHeight > aspectRatio) {
      finalWidth = finalHeight * aspectRatio
    } else {
      finalHeight = finalWidth / aspectRatio
    }
    
    canvas.width = finalWidth
    canvas.height = finalHeight
    
    // Disegna l'area ritagliata
    ctx.drawImage(
      imageRef.current,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, finalWidth, finalHeight
    )
    
    // Genera blob per anteprima
    canvas.toBlob((blob) => {
      if (previewBlob) {
        URL.revokeObjectURL(previewBlob)
      }
      setPreviewBlob(blob)
    }, 'image/jpeg', quality)
  }, [cropArea, outputSize, quality, previewBlob])

  // Conferma ritaglio
  const handleConfirm = useCallback(async () => {
    if (!imageRef.current || !cropArea.width || !cropArea.height) {
      toast.error('Seleziona un\'area da ritagliare')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Calcola dimensioni finali
      const aspectRatio = cropArea.width / cropArea.height
      let finalWidth = outputSize.width * scale
      let finalHeight = outputSize.height * scale
      
      if (finalWidth / finalHeight > aspectRatio) {
        finalWidth = finalHeight * aspectRatio
      } else {
        finalHeight = finalWidth / aspectRatio
      }
      
      canvas.width = finalWidth
      canvas.height = finalHeight
      
      // Disegna l'immagine ritagliata
      ctx.drawImage(
        imageRef.current,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, finalWidth, finalHeight
      )
      
      // Converti in blob
      canvas.toBlob((blob) => {
        if (blob) {
          console.log(`🖼️ Immagine ottimizzata: ${(blob.size / 1024).toFixed(1)}KB`)
          onConfirm(blob)
        }
        setIsProcessing(false)
      }, 'image/jpeg', quality)
      
    } catch (error) {
      console.error('Errore nel ritaglio:', error)
      toast.error('Errore nel ritaglio dell\'immagine')
      setIsProcessing(false)
    }
  }, [imageRef, cropArea, outputSize, scale, quality, onConfirm])

  // Cleanup
  useEffect(() => {
    return () => {
      if (previewBlob) {
        URL.revokeObjectURL(previewBlob)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <ScissorsIcon className="h-5 w-5 mr-2" />
            Ritaglia e Ottimizza Immagine
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(95vh-120px)]">
          {/* Area principale - Canvas */}
          <div className="flex-1 p-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  border: '2px solid #e5e7eb',
                  background: `
                    linear-gradient(45deg, #f3f4f6 25%, transparent 25%),
                    linear-gradient(-45deg, #f3f4f6 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #f3f4f6 75%),
                    linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
              />
              
              {/* Overlay area di ritaglio */}
              {cropArea.width > 0 && cropArea.height > 0 && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
                  style={{
                    left: `${(cropArea.x / imageSize.width) * 100}%`,
                    top: `${(cropArea.y / imageSize.height) * 100}%`,
                    width: `${(cropArea.width / imageSize.width) * 100}%`,
                    height: `${(cropArea.height / imageSize.height) * 100}%`,
                    pointerEvents: 'none'
                  }}
                />
              )}
            </div>
          </div>

          {/* Pannello controlli */}
          <div className="w-full lg:w-80 p-4 border-l bg-gray-50">
            {/* Anteprima */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <PhotoIcon className="h-4 w-4 mr-1" />
                Anteprima
              </h3>
              <div className="bg-white border rounded-lg p-2 h-32 flex items-center justify-center">
                {previewBlob ? (
                  <img
                    src={URL.createObjectURL(previewBlob)}
                    alt="Anteprima"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-sm">Seleziona un'area</div>
                )}
              </div>
              {previewBlob && (
                <div className="text-xs text-gray-500 mt-1">
                  Dimensioni: {Math.round(outputSize.width * scale)} x {Math.round(outputSize.height * scale)}px<br/>
                  Peso: ~{(previewBlob.size / 1024).toFixed(1)}KB
                </div>
              )}
            </div>

            {/* Controlli dimensioni */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensioni Output
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">Larghezza</label>
                  <input
                    type="number"
                    value={outputSize.width}
                    onChange={(e) => setOutputSize(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="100"
                    max="2000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Altezza</label>
                  <input
                    type="number"
                    value={outputSize.height}
                    onChange={(e) => setOutputSize(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="100"
                    max="2000"
                  />
                </div>
              </div>
            </div>

            {/* Scala */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scala: {(scale * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Qualità */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualità: {(quality * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Pulsanti */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleConfirm}
                disabled={isProcessing || !cropArea.width}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Elaborazione...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Conferma
                  </>
                )}
              </button>
              
              <button
                onClick={onCancel}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
              >
                Annulla
              </button>
            </div>

            {/* Istruzioni */}
            <div className="mt-4 text-xs text-gray-500">
              <p className="mb-1">💡 <strong>Come usare:</strong></p>
              <p>• Clicca e trascina per selezionare l'area da ritagliare</p>
              <p>• Regola dimensioni, scala e qualità</p>
              <p>• L'immagine verrà ottimizzata automaticamente</p>
            </div>
          </div>
        </div>

        {/* Canvas nascosto per anteprima */}
        <canvas ref={previewCanvasRef} className="hidden" />
      </div>
    </div>
  )
}

export default ImageCropper