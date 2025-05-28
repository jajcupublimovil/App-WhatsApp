import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    // Obtener URL de WhatsApp del servidor
    const fetchWhatsappUrl = async () => {
      try {
        const response = await fetch('/api/whatsapp-url');
        const data = await response.json();
        
        if (response.ok) {
          setWhatsappUrl(data.url);
          setLoading(false);
          
          // Redireccionar automáticamente después de 2 segundos
          setTimeout(() => {
            window.location.href = data.url;
            setRedirected(true);
          }, 2000);
        } else {
          throw new Error(data.error || 'Error al obtener URL');
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Error al conectar con el servidor. Intenta nuevamente.');
        setLoading(false);
      }
    };

    fetchWhatsappUrl();
  }, []);

  const handleContactClick = () => {
    if (whatsappUrl) {
      window.location.href = whatsappUrl;
    }
  };

  if (error) {
    return (
      <div className="App">
        <div className="container">
          <h1>Error de conexión</h1>
          <p>{error}</p>
          <button 
            className="contact-button"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <h1>Contactando a un asesor...</h1>
        
        {loading ? (
          <div className="loader"></div>
        ) : (
          <div className="success-icon">✓</div>
        )}
        
        <p>Estamos conectándote con un asesor disponible.</p>
        
        {!loading && (
          <button 
            id="contactButton" 
            className="contact-button"
            onClick={handleContactClick}
            disabled={!whatsappUrl}
          >
            Contactar por WhatsApp
          </button>
        )}
        
        {redirected && (
          <p className="redirect-notice">
            Redirigiendo... Si no funciona, haz clic en el botón de arriba.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;