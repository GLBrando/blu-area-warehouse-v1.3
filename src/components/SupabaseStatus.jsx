import React from 'react'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { isConfigured } from '../lib/supabase'

const SupabaseStatus = () => {
  if (isConfigured) {
    return null
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Database non configurato
          </h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>
              Per utilizzare l'applicazione, è necessario configurare Supabase:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Crea un progetto su <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline inline-flex items-center">Supabase <ExternalLink className="h-3 w-3 ml-1" /></a></li>
              <li>Esegui lo schema SQL dalla cartella <code className="bg-yellow-100 px-1 rounded">database/</code></li>
              <li>Aggiorna le variabili nel file <code className="bg-yellow-100 px-1 rounded">.env</code>:</li>
            </ol>
            <div className="bg-yellow-100 p-3 rounded mt-3 font-mono text-xs">
              <div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=your-anon-key</div>
            </div>
            <p className="text-xs mt-2">
              Consulta il file <code className="bg-yellow-100 px-1 rounded">database/README.md</code> per istruzioni dettagliate.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupabaseStatus