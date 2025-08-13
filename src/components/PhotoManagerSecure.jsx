import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CameraIcon,
  PhotoIcon,
  TrashIcon,
  StarIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
// ✅ SICURO: Usa il client helper invece di supabase diretto
import { uploadProductPhotoSecure, setPrimaryPhotoSecure, deleteProductPhotoSecure } from '../lib/uploadClient';
import { getProductPhotos } from '../lib/supabase';
import CameraModal from './CameraModal';

/**
 * 🔒 PhotoManagerSecure - Versione sicura per Vercel
 * 
 * DIFFERENZE PRINCIPALI:
 * ❌ Prima: uploadProductPhoto() - Service key esposta nel frontend
 * ✅ Ora: uploadProductPhotoSecure() - API endpoint sicuro
 * 
 * VANTAGGI:
 * - Service key protetta sul server
 * - Compatibile con Vercel
 * - Nessuna esposizione di credenziali
 * - Logs centralizzati
 */
const PhotoManagerSecure = ({ productId, productSku, onPhotosChange, onSaveProduct, onTempPhotoSave }) => {
  // 🔄 Stati
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [apiStatus, setApiStatus] = useState('unknown'); // 'working', 'error', 'unknown'
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Refs
  const fileInputRef = useRef(null);

  // Imposta API status come working di default (il test verrà fatto al primo upload)
  useEffect(() => {
    setApiStatus('working');
  }, []);

  // Carica foto esistenti
  const loadPhotos = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      const { data: productPhotos, error } = await getProductPhotos(productId);
      
      if (error) {
        console.error('Errore caricamento foto:', error);
        toast.error('Errore nel caricamento delle foto');
        return;
      }
      
      setPhotos(productPhotos || []);
      
      if (onPhotosChange) {
        onPhotosChange(productPhotos || []);
      }
    } catch (error) {
      console.error('Errore caricamento foto:', error);
      toast.error('Errore nel caricamento delle foto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [productId]);

  // 🔒 UPLOAD SICURO - Usa API endpoint invece di client diretto
  const uploadPhotos = async (files) => {
    if (!files || files.length === 0) return;
    
    // Se non c'è productId, salva temporaneamente le foto
    if (!productId) {
      console.log('Nessun productId disponibile, salvataggio temporaneo delle foto');
      
      if (onTempPhotoSave) {
        setUploading(true);
        const uploadPromises = Array.from(files).map(async (file) => {
          try {
            // ✅ SICURO: Usa API endpoint
            const result = await uploadProductPhotoSecure(file, null, productSku);
            if (result.error) {
              throw new Error(result.error);
            }
            // Chiama la callback per salvare temporaneamente la foto
            onTempPhotoSave(result.data);
            return result.data;
          } catch (error) {
            console.error('Errore upload foto temporanea:', error);
            toast.error(`Errore upload ${file.name}: ${error.message}`);
            return null;
          }
        });

        try {
          const results = await Promise.all(uploadPromises);
          const successfulUploads = results.filter(result => result !== null);
          
          if (successfulUploads.length > 0) {
            toast.success(`${successfulUploads.length} foto salvate temporaneamente`);
          }
        } catch (error) {
          console.error('Errore durante l\'upload temporaneo delle foto:', error);
          toast.error('Errore durante l\'upload temporaneo delle foto');
        } finally {
          setUploading(false);
        }
      } else {
        toast.error('Salva prima il prodotto per caricare le foto');
      }
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        // Verifica tipo file
        if (!file.type.startsWith('image/')) {
          toast.error(`File ${file.name} non è un'immagine valida`);
          errorCount++;
          continue;
        }

        // Verifica dimensione (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} troppo grande (max 10MB)`);
          errorCount++;
          continue;
        }

        // ✅ SICURO: Usa API endpoint invece di client diretto
        const result = await uploadProductPhotoSecure(file, productId, productSku);
        if (result.error) {
          // Se è un errore di connessione API, aggiorna lo status
          if (result.error.message && result.error.message.includes('Errore di rete')) {
            setApiStatus('error');
          }
          throw new Error(result.error.message || result.error);
        }
        successCount++;
      } catch (error) {
        console.error(`Errore upload ${file.name}:`, error);
        toast.error(`Errore upload ${file.name}: ${error.message}`);
        errorCount++;
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} foto caricate con successo`);
      await loadPhotos();
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} foto non caricate`);
    }
  };

  // Elimina foto (versione sicura)
  const handleDeletePhoto = async (photo) => {
    if (!confirm('Sei sicuro di voler eliminare questa foto?')) return;

    try {
      const result = await deleteProductPhotoSecure(photo.id);
      if (result.error) {
        throw new Error(result.error.message || result.error);
      }
      toast.success('Foto eliminata');
      await loadPhotos();
    } catch (error) {
      console.error('Errore eliminazione foto:', error);
      toast.error('Errore nell\'eliminazione della foto');
    }
  };

  // Imposta foto primaria (versione sicura)
  const handleSetPrimary = async (photo) => {
    try {
      const result = await setPrimaryPhotoSecure(photo.id, productId);
      if (result.error) {
        throw new Error(result.error.message || result.error);
      }
      toast.success('Foto primaria impostata');
      await loadPhotos();
    } catch (error) {
      console.error('Errore impostazione foto primaria:', error);
      toast.error('Errore nell\'impostazione della foto primaria');
    }
  };

  // Ottieni URL foto (rimane uguale)
  const getPhotoUrl = (photo) => {
    if (photo.photo_data) {
      return `data:${photo.mime_type};base64,${photo.photo_data}`;
    } else if (photo.file_path) {
      return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-photos/${photo.file_path}`;
    }
    return null;
  };

  // Gestione file input
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      uploadPhotos(files);
    }
    // Reset input
    event.target.value = '';
  };



  return (
    <div className="space-y-4">
      {/* 🔒 Indicatore Stato API */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Foto Prodotto</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            apiStatus === 'working' ? 'bg-green-500' : 
            apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
          <span className="text-xs text-gray-500">
            {apiStatus === 'working' ? 'API Sicura' : 
             apiStatus === 'error' ? 'API Non Disponibile' : 'Verificando...'}
          </span>
        </div>
      </div>

      {/* Messaggio informativo per nuovo prodotto */}
      {!productId && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <PhotoIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
               <p className="text-sm text-blue-700">
                 Per scattare foto con la fotocamera, salva prima il prodotto utilizzando il pulsante "Salva e Continua".
               </p>
             </div>
          </div>
        </div>
      )}

      {/* Controlli Upload */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || apiStatus === 'error'}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <PhotoIcon className="h-4 w-4 mr-2" />
          Carica Foto
        </button>

        <button
          type="button"
          onClick={() => setIsCameraModalOpen(true)}
          disabled={uploading || apiStatus === 'error' || !productId}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          title={!productId ? 'Salva prima il prodotto per utilizzare la fotocamera' : 'Scatta una foto'}
        >
          <CameraIcon className="h-4 w-4 mr-2" />
          Fotocamera
        </button>

        {uploading && (
          <div className="inline-flex items-center px-3 py-2 text-sm text-gray-600">
            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            Caricamento...
          </div>
        )}
      </div>

      {/* Input File Nascosto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 📸 Modale Fotocamera */}
       <CameraModal
         isOpen={isCameraModalOpen}
         onClose={() => setIsCameraModalOpen(false)}
         productId={productId}
         productSku={productSku}
         onPhotoSaved={(newPhoto) => {
           // Ricarica le foto dopo il salvataggio
           loadPhotos();
           toast.success('Foto salvata con successo!');
         }}
       />

      {/* Griglia Foto */}
      {loading ? (
        <div className="text-center py-4">
          <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">Caricamento foto...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={getPhotoUrl(photo)}
                  alt={`Foto ${photo.file_name}`}
                  className="w-full h-full object-cover"
                  onClick={() => setSelectedPhoto(photo)}
                />
              </div>
              
              {/* Overlay Controlli */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(photo)}
                    className={`p-2 rounded-full ${
                      photo.is_primary 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-white text-gray-700 hover:bg-yellow-50'
                    }`}
                    title={photo.is_primary ? 'Foto primaria' : 'Imposta come primaria'}
                  >
                    {photo.is_primary ? (
                      <StarIconSolid className="h-4 w-4" />
                    ) : (
                      <StarIcon className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    title="Elimina foto"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Badge Primaria */}
              {photo.is_primary && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                  Primaria
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Foto */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedPhoto(null)}>
          <div className="max-w-4xl max-h-full p-4">
            <img
              src={getPhotoUrl(selectedPhoto)}
              alt={`Foto ${selectedPhoto.file_name}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoManagerSecure;