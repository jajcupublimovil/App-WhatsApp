import React, { useState, useEffect } from 'react';
import './Stats.css';

function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    // Actualizar estadísticas cada 5 segundos
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
        setError('');
      } else {
        throw new Error(data.error || 'Error al obtener estadísticas');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const resetCounter = async () => {
    if (window.confirm('¿Estás seguro de que quieres resetear el contador?')) {
      try {
        const response = await fetch('/api/reset-counter', {
          method: 'POST',
        });
        const data = await response.json();
        
        if (response.ok) {
          alert('Contador reseteado exitosamente');
          fetchStats();
        } else {
          throw new Error(data.error || 'Error al resetear contador');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al resetear contador: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="stats-container">
        <div className="loader"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchStats}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <h1>📊 Estadísticas de Distribución</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total de Visitas</h3>
          <div className="stat-number">{stats.totalVisits}</div>
        </div>
        
        <div className="stat-card">
          <h3>Contactos Activos</h3>
          <div className="stat-number">{stats.totalContacts}</div>
        </div>
        
        <div className="stat-card">
          <h3>Promedio por Contacto</h3>
          <div className="stat-number">{stats.visitsPerContact}</div>
        </div>
      </div>

      <div className="distribution-section">
        <h2>Distribución por Contacto</h2>
        <div className="contacts-list">
          {stats.distribution.map((contact, index) => (
            <div key={index} className="contact-card">
              <div className="contact-header">
                <h3>Contacto {contact.contactIndex}</h3>
                <span className="phone-number">+{contact.phone}</span>
              </div>
              
              <div className="contact-stats">
                <div className="visits-count">
                  <span className="visits-number">{contact.visits}</span>
                  <span className="visits-label">visitas</span>
                </div>
                
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: stats.totalVisits > 0 
                        ? `${(contact.visits / stats.totalVisits) * 100}%` 
                        : '0%'
                    }}
                  ></div>
                </div>
                
                <div className="percentage">
                  {stats.totalVisits > 0 
                    ? `${((contact.visits / stats.totalVisits) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="actions-section">
        <button 
          onClick={fetchStats}
          className="refresh-button"
        >
          🔄 Actualizar
        </button>
        
        <button 
          onClick={resetCounter}
          className="reset-button"
        >
          🗑️ Resetear Contador
        </button>
      </div>

      <div className="auto-refresh">
        <small>📡 Se actualiza automáticamente cada 5 segundos</small>
      </div>
    </div>
  );
}

export default Stats;