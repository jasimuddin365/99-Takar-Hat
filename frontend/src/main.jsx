import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { AuthModalProvider } from './context/AuthModalContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthModalProvider>
          <CartProvider>
            <App />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 2800,
                style: {
                  background: '#1C1A14',
                  color: '#E8B84B',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  borderRadius: '8px',
                  padding: '12px 18px',
                  boxShadow: '0 4px 16px rgba(28,26,20,.10)',
                },
              }}
            />
          </CartProvider>
        </AuthModalProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);