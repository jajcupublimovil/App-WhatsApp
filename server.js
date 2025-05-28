const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000; // ← PUERTO 5000 POR DEFECTO

// Middleware
app.use(cors());
app.use(express.json());

// URLs de WhatsApp
const whatsappUrls = [
    "https://api.whatsapp.com/send?phone=50254638411&text=Hola%2C%20necesito%20información",
    "https://api.whatsapp.com/send?phone=50360609789&text=Hola%2C%20necesito%20información"
];

// Inicializar base de datos SQLite
const dbPath = process.env.NODE_ENV === 'production' ? '/app/data/distributor.db' : './distributor.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        console.log('Ruta de la base de datos:', dbPath);
        
        // Crear tabla de forma síncrona
        createTables();
    }
});

// Función para crear tablas
function createTables() {
    db.serialize(() => {
        // Crear tabla si no existe
        db.run(`CREATE TABLE IF NOT EXISTS distributor_counter (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            counter INTEGER NOT NULL DEFAULT 0,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error al crear tabla:', err.message);
            } else {
                console.log('Tabla distributor_counter lista.');
                
                // Inicializar contador si no existe
                db.get("SELECT * FROM distributor_counter WHERE id = 1", (err, row) => {
                    if (err) {
                        console.error('Error al consultar contador:', err.message);
                    } else if (!row) {
                        db.run("INSERT INTO distributor_counter (counter) VALUES (0)", (err) => {
                            if (err) {
                                console.error('Error al inicializar contador:', err.message);
                            } else {
                                console.log('Contador inicializado en 0');
                            }
                        });
                    } else {
                        console.log('Contador actual:', row.counter);
                    }
                });
            }
        });
    });
}

// API para obtener la próxima URL de WhatsApp
app.get('/api/whatsapp-url', (req, res) => {
    // Obtener contador actual
    db.get("SELECT counter FROM distributor_counter WHERE id = 1", (err, row) => {
        if (err) {
            console.error('Error al obtener contador:', err.message);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        const currentCounter = row ? row.counter : 0;
        const selectedUrlIndex = currentCounter % whatsappUrls.length;
        const selectedUrl = whatsappUrls[selectedUrlIndex];

        // Incrementar contador
        const newCounter = currentCounter + 1;
        db.run("UPDATE distributor_counter SET counter = ?, last_updated = CURRENT_TIMESTAMP WHERE id = 1", 
               [newCounter], (err) => {
            if (err) {
                console.error('Error al actualizar contador:', err.message);
                return res.status(500).json({ error: 'Error al actualizar contador' });
            }

            // Debug detallado
            console.log('🔍 DEBUG INFO:');
            console.log(`   - Contador actual: ${currentCounter}`);
            console.log(`   - Nuevo contador: ${newCounter}`);
            console.log(`   - Total contactos: ${whatsappUrls.length}`);
            console.log(`   - Cálculo índice: ${currentCounter} % ${whatsappUrls.length} = ${selectedUrlIndex}`);
            console.log(`   - URL seleccionada: ${selectedUrl}`);
            console.log(`   - Número extraído: ${selectedUrl.match(/phone=(\d+)/)?.[1] || 'No encontrado'}`);
            console.log(`📞 Visita #${newCounter} → Contacto ${selectedUrlIndex + 1} (${selectedUrl.match(/phone=(\d+)/)?.[1]})`);
            console.log('---');
            
            res.json({
                url: selectedUrl,
                visitNumber: newCounter,
                contactIndex: selectedUrlIndex + 1,
                totalContacts: whatsappUrls.length,
                debug: {
                    currentCounter,
                    selectedUrlIndex,
                    calculation: `${currentCounter} % ${whatsappUrls.length} = ${selectedUrlIndex}`
                }
            });
        });
    });
});

// API para obtener estadísticas
app.get('/api/stats', (req, res) => {
    db.get("SELECT counter FROM distributor_counter WHERE id = 1", (err, row) => {
        if (err) {
            console.error('Error al obtener estadísticas:', err.message);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        const totalVisits = row ? row.counter : 0;
        const visitsPerContact = Math.floor(totalVisits / whatsappUrls.length);
        const remainder = totalVisits % whatsappUrls.length;

        const stats = {
            totalVisits,
            totalContacts: whatsappUrls.length,
            visitsPerContact,
            distribution: whatsappUrls.map((url, index) => ({
                contactIndex: index + 1,
                phone: url.match(/phone=(\d+)/)[1],
                visits: visitsPerContact + (index < remainder ? 1 : 0)
            }))
        };

        res.json(stats);
    });
});

// API para verificar estado actual (para debugging)
app.get('/api/debug', (req, res) => {
    db.get("SELECT * FROM distributor_counter WHERE id = 1", (err, row) => {
        if (err) {
            console.error('Error al obtener estado:', err.message);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        const currentCounter = row ? row.counter : 0;
        const nextIndex = currentCounter % whatsappUrls.length;
        const nextUrl = whatsappUrls[nextIndex];

        res.json({
            currentCounter,
            nextContactIndex: nextIndex + 1,
            nextUrl,
            nextPhone: nextUrl.match(/phone=(\d+)/)?.[1],
            allUrls: whatsappUrls.map((url, index) => ({
                index: index + 1,
                phone: url.match(/phone=(\d+)/)?.[1],
                url: url
            })),
            calculation: `${currentCounter} % ${whatsappUrls.length} = ${nextIndex}`
        });
    });
});

// API para resetear contador (útil para pruebas)
app.post('/api/reset-counter', (req, res) => {
    db.run("UPDATE distributor_counter SET counter = 0, last_updated = CURRENT_TIMESTAMP WHERE id = 1", (err) => {
        if (err) {
            console.error('Error al resetear contador:', err.message);
            return res.status(500).json({ error: 'Error al resetear contador' });
        }
        
        console.log('Contador reseteado a 0');
        res.json({ message: 'Contador reseteado exitosamente' });
    });
});

// Servir archivos estáticos del cliente React en producción
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    
    app.get('*', (req, res) => {
        // Evitar que las rutas de API sean capturadas por React
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
}

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\nCerrando servidor...');
    db.close((err) => {
        if (err) {
            console.error('Error al cerrar la base de datos:', err.message);
        } else {
            console.log('Conexión a la base de datos cerrada.');
        }
        process.exit(0);
    });
});

// ✅ PUERTO 5000 Y BIND A 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
    console.log(`Total de contactos configurados: ${whatsappUrls.length}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database path: ${dbPath}`);
});