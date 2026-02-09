import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('🎯 main.tsx executando...')
console.log('📍 Root element:', document.getElementById('root'))

createRoot(document.getElementById('root')!).render(
  <App />
)
