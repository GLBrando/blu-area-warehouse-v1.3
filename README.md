# 📦 Webapp Magazzino Blu Area v1.3

Webapp per la gestione completa del magazzino Blu Area con generazione automatica SKU, gestione prodotti e funzionalità avanzate di editing immagini.

## 🎯 Obiettivi del Progetto

- Gestione completa inventario (235 prodotti esistenti)
- Generazione automatica SKU formato: XXXX-ARTICOLO
- Dashboard con statistiche magazzino
- Gestione varianti (colori, taglie, linee, composizioni)
- Export/Import Excel
- Sistema di alert per scorte basse

## 🛠️ Stack Tecnologico

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + API)
- **Hosting**: Vercel
- **Autenticazione**: Supabase Auth

## 📊 Dati Esistenti

- **Prodotti**: 235 articoli con SKU esistenti (max: 241)
- **Colori**: 27 varianti
- **Linee**: 13 categorie
- **Taglie**: 9 opzioni
- **Composizioni**: 3 tipi

## 🗄️ Schema Database

### Tabelle di Lookup
- `colors` (id, name, legacy_id)
- `lines` (id, name, legacy_id)
- `sizes` (id, name, description, legacy_id)
- `compositions` (id, name, legacy_id)

### Tabella Principale
- `products` (id, sku, article, description, modello, line_id, quantity_stock, quantity_sold, size_id, color_id, composition_id, initial_price, wholesale_price, selling_price, notes, created_at, updated_at)

### Contatore SKU
- `sku_counter` (id, current_value)

## 🚀 Funzionalità Principali

- ✅ Dashboard con statistiche
- ✅ CRUD completo prodotti
- ✅ Generazione SKU automatica
- ✅ Filtri avanzati ricerca
- ✅ Export/Import Excel
- ✅ Gestione varianti
- ✅ **NUOVO v1.3**: Cattura foto prodotti con ritaglio e ridimensionamento
- ✅ **NUOVO v1.3**: Ottimizzazione automatica peso immagini
- ✅ **NUOVO v1.3**: Editor immagini integrato con controlli qualità
- ✅ Alert scorte basse
- ✅ Storico movimenti
- ✅ Backup automatico

## 📱 Interfaccia

- Design responsive mobile-first
- Sidebar navigazione
- Tabelle con paginazione
- Modali per CRUD
- Toast notifications
- Loading states

## 🔧 Setup Locale

```bash
# Clone repository
git clone [repository-url]
cd blu-area-warehouse

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Configura le variabili Supabase

# Start development
npm run dev
```

## 🌐 Deploy Vercel

```bash
# Build production
npm run build

# Deploy
vercel --prod
```

## 📋 Variabili Ambiente

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🗂️ Struttura Progetto

```
src/
├── components/          # Componenti React
│   ├── CameraCapture.jsx    # Cattura foto
│   ├── CameraModal.jsx      # Modal fotocamera
│   ├── ImageCropper.jsx     # Editor immagini (v1.3)
│   ├── Navbar.jsx           # Navigazione
│   ├── PhotoManagerSecure.jsx # Gestione foto
│   └── Sidebar.jsx          # Menu laterale
├── pages/               # Pagine principali
│   ├── Dashboard.jsx        # Dashboard statistiche
│   ├── Products.jsx         # Lista prodotti
│   ├── ProductForm.jsx      # Form prodotto
│   └── Settings.jsx         # Impostazioni
├── lib/                 # Utilities
│   ├── supabase.js          # Client Supabase
│   └── uploadClient.js      # Upload file
api/                     # API Vercel
├── upload-photo.js          # Upload foto
└── photo-actions.js         # Azioni foto
database/                # Schema DB
└── schema.sql               # Struttura tabelle
```

## 🔄 Changelog v1.3

### ✨ Nuove Funzionalità
- **ImageCropper Component**: Editor immagini integrato con canvas nativo
- **Ritaglio Interattivo**: Selezione area di interesse con drag & drop
- **Ridimensionamento**: Controllo dimensioni finali dell'immagine
- **Compressione Qualità**: Slider per bilanciare qualità/peso file
- **Anteprima Real-time**: Visualizzazione immediata delle modifiche

### 🔧 Miglioramenti
- **CameraCapture**: Integrato flusso editing tra cattura e conferma
- **CameraModal**: Aggiunto step di editing prima del salvataggio
- **Ottimizzazione File**: Riduzione automatica peso immagini
- **UX Migliorata**: Interfaccia intuitiva per editing foto

### 📊 Benefici
- Riduzione significativa peso file immagini
- Maggiore controllo qualità foto prodotti
- Workflow ottimizzato per cattura e editing
- Compatibilità completa con sistema esistente

---

## 📞 Supporto

Per supporto tecnico o domande sul progetto, contattare il team di sviluppo.

**Versione**: 1.3.0  
**Ultimo aggiornamento**: Gennaio 2025