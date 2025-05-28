import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/authcontext.tsx'
import { StrictMode } from 'react'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
    <AuthProvider>
        <App />
    </AuthProvider>
  </StrictMode>

)
