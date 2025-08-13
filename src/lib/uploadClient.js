// Client sicuro per upload foto tramite API endpoint
// Non espone la service key nel frontend

// Configurazione API endpoint
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // URL relativo per Vercel
  : 'http://localhost:3001' // Server Express locale per sviluppo

/**
 * Upload di una foto prodotto tramite API endpoint sicuro
 * @param {File} file - File immagine da caricare
 * @param {string|null} productId - ID del prodotto (null per foto temporanee)
 * @param {string} sku - SKU del prodotto
 * @param {boolean} isFirst - Se è la prima foto del prodotto
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function uploadProductPhotoSecure(file, productId = null, sku = 'unknown', isFirst = false) {
  try {
    // Validazione input
    if (!file) {
      return { data: null, error: { message: 'Nessun file fornito' } }
    }

    if (!file.type.startsWith('image/')) {
      return { data: null, error: { message: 'Solo immagini sono permesse' } }
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      return { data: null, error: { message: 'File troppo grande (max 10MB)' } }
    }

    // Prepara FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('productId', productId || '')
    formData.append('sku', sku)
    formData.append('isFirst', isFirst.toString())

    // Chiamata all'API endpoint
    const response = await fetch(`${API_BASE_URL}/api/upload-photo`, {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      return { 
        data: null, 
        error: { 
          message: result.error || 'Errore upload', 
          details: result.details 
        } 
      }
    }

    return { data: result.data, error: null }

  } catch (error) {
    console.error('Errore upload client:', error)
    return { 
      data: null, 
      error: { 
        message: 'Errore di rete', 
        details: error.message 
      } 
    }
  }
}

/**
 * Upload multiplo di foto prodotto
 * @param {FileList|File[]} files - Lista di file da caricare
 * @param {string|null} productId - ID del prodotto
 * @param {string} sku - SKU del prodotto
 * @returns {Promise<{successes: object[], errors: object[]}>}
 */
export async function uploadMultiplePhotos(files, productId = null, sku = 'unknown') {
  const successes = []
  const errors = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const isFirst = i === 0

    try {
      const result = await uploadProductPhotoSecure(file, productId, sku, isFirst)
      
      if (result.error) {
        errors.push({ file: file.name, error: result.error })
      } else {
        successes.push(result.data)
      }
    } catch (error) {
      errors.push({ file: file.name, error: { message: error.message } })
    }
  }

  return { successes, errors }
}

/**
 * Test della connessione API
 */
export async function testUploadAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/test`, {
      method: 'GET'
    })
    
    if (response.ok) {
      const result = await response.json()
      return { success: true, data: result }
    } else {
      return { success: false, error: 'API non raggiungibile' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Imposta una foto come primaria
 */
export async function setPrimaryPhotoSecure(photoId, productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photo-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'setPrimary',
        photoId,
        productId
      })
    })

    const result = await response.json()

    if (!response.ok) {
      return { 
        data: null, 
        error: { 
          message: result.error || 'Errore nell\'impostazione foto primaria' 
        } 
      }
    }

    return { data: result.data, error: null }

  } catch (error) {
    console.error('Errore set primary photo:', error)
    return { 
      data: null, 
      error: { 
        message: 'Errore di rete', 
        details: error.message 
      } 
    }
  }
}

/**
 * Elimina una foto prodotto
 */
export async function deleteProductPhotoSecure(photoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photo-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'delete',
        photoId
      })
    })

    const result = await response.json()

    if (!response.ok) {
      return { 
        data: null, 
        error: { 
          message: result.error || 'Errore nell\'eliminazione foto' 
        } 
      }
    }

    return { data: result.data, error: null }

  } catch (error) {
    console.error('Errore delete photo:', error)
    return { 
      data: null, 
      error: { 
        message: 'Errore di rete', 
        details: error.message 
      } 
    }
  }
}

// Configurazione export
export const uploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  apiEndpoint: '/api/upload-photo',
  photoActionsEndpoint: '/api/photo-actions',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxFiles: 10
}