import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Controlla se Supabase è configurato correttamente
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder')

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase non configurato. Configura le variabili d\'ambiente in .env')
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isConfigured = isSupabaseConfigured

// Funzioni helper per il database
export const db = {
  // Prodotti
  async getProducts(filters = {}) {
    if (!isSupabaseConfigured) {
      console.warn('⚠️ Supabase non configurato')
      return { data: [], error: { message: 'Supabase non configurato' } }
    }
    
    console.log('🔍 Caricamento prodotti con filtri:', filters)
    
    let query = supabase
      .from('products')
      .select(`
        *,
        colors(name),
        lines(name),
        sizes(name, description),
        compositions(name),
        models(name)
      `)
      .order('created_at', { ascending: false })

    // Applica filtri se presenti
    if (filters.search) {
      query = query.or(`sku.ilike.%${filters.search}%,article.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    if (filters.line_id) {
      query = query.eq('line_id', filters.line_id)
    }
    if (filters.color_id) {
      query = query.eq('color_id', filters.color_id)
    }
    if (filters.size_id) {
      query = query.eq('size_id', filters.size_id)
    }
    if (filters.composition_id) {
      query = query.eq('composition_id', filters.composition_id)
    }
    if (filters.model_id) {
      query = query.eq('model_id', filters.model_id)
    }
    if (filters.low_stock) {
      query = query.lt('quantity_stock', 10)
    }

    const result = await query
    console.log('📊 Risultato query prodotti:', result)
    
    if (result.error) {
      console.error('❌ Errore nel caricamento prodotti:', result.error)
    } else {
      console.log(`✅ Caricati ${result.data?.length || 0} prodotti`)
    }
    
    return result
  },

  async getProduct(id) {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: 'Supabase non configurato' } }
    }
    
    return supabase
      .from('products')
      .select(`
        *,
        colors(name),
        lines(name),
        sizes(name, description),
        compositions(name),
        models(name)
      `)
      .eq('id', id)
      .single()
  },

  async createProduct(product) {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: 'Supabase non configurato' } }
    }
    
    // Rimuovi temporaneamente image_url se la colonna non esiste nel database
    const { image_url, ...productData } = product
    
    // Log per debug
    console.log('Creazione prodotto senza image_url:', productData)
    
    return supabase
      .from('products')
      .insert([productData])
      .select()
      .single()
  },

  async updateProduct(id, updates) {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: 'Supabase non configurato' } }
    }
    
    // Rimuovi temporaneamente image_url se la colonna non esiste nel database
    const { image_url, ...updateData } = updates
    
    // Log per debug
    console.log('Aggiornamento prodotto senza image_url:', updateData)
    
    return supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
  },

  async deleteProduct(id) {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: 'Supabase non configurato' } }
    }
    return supabase
      .from('products')
      .delete()
      .eq('id', id)
  },

  // Lookup tables
  async getColors() {
    if (!isSupabaseConfigured) {
      return { data: [], error: { message: 'Supabase non configurato' } }
    }
    return supabase
      .from('colors')
      .select('*')
      .order('name')
  },

  async getLines() {
    if (!isSupabaseConfigured) {
      return { data: [], error: { message: 'Supabase non configurato' } }
    }
    return supabase
      .from('lines')
      .select('*')
      .order('name')
  },

  async getSizes() {
    if (!isSupabaseConfigured) {
      return { data: [], error: { message: 'Supabase non configurato' } }
    }
    return supabase
      .from('sizes')
      .select('*')
      .order('name')
  },

  async getCompositions() {
    if (!isSupabaseConfigured) {
      return { data: [], error: { message: 'Supabase non configurato' } }
    }
    return supabase
      .from('compositions')
      .select('*')
      .order('name')
  },

  async getModels() {
    if (!isSupabaseConfigured) {
      return { data: [], error: { message: 'Supabase non configurato' } }
    }
    return supabase
      .from('models')
      .select('*')
      .order('name')
  },

  // Funzioni per gestione foto
  async getProductPhotos(productId) {
    if (!isSupabaseConfigured) {
      return { data: [], error: { message: 'Supabase non configurato' } }
    }
    
    return supabase
      .from('product_photos')
      .select('*')
      .eq('product_id', productId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
  },

  async deleteProductPhoto(photoId) {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: 'Supabase non configurato' } }
    }
    
    return supabase
      .from('product_photos')
      .delete()
      .eq('id', photoId)
  },

  async setPrimaryPhoto(photoId, productId) {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: 'Supabase non configurato' } }
    }
    
    // Prima rimuovi il flag primary da tutte le foto del prodotto
    await supabase
      .from('product_photos')
      .update({ is_primary: false })
      .eq('product_id', productId)
    
    // Poi imposta la foto selezionata come primary
    return supabase
      .from('product_photos')
      .update({ is_primary: true })
      .eq('id', photoId)
  },

  async getDashboardStats() {
    if (!isSupabaseConfigured) {
      return { 
        data: {
          totalProducts: 0,
          lowStockProducts: 0,
          totalValue: 0,
          recentProducts: []
        }, 
        error: null 
      }
    }
    
    try {
      // Statistiche base
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('quantity_stock, price')
      
      if (productsError) throw productsError
      
      const totalProducts = products.length
      const lowStockProducts = products.filter(p => p.quantity_stock < 10).length
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity_stock), 0)
      
      // Prodotti recenti
      const { data: recentProducts, error: recentError } = await supabase
        .from('products')
        .select('id, sku, article, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (recentError) throw recentError
      
      return {
        data: {
          totalProducts,
          lowStockProducts,
          totalValue,
          recentProducts
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Export delle funzioni principali
export const getProductPhotos = db.getProductPhotos
export const deleteProductPhoto = db.deleteProductPhoto
export const setPrimaryPhoto = db.setPrimaryPhoto