// server.js - Servidor principal de RPM Auto and Service
// Versión completa con todos los controladores y rutas integrados

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ============================================
// IMPORTAR RUTAS
// ============================================
const vehiculoRoutes = require('./routes/vehiculoRoutes');
const citaRoutes = require('./routes/citaRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');

// ============================================
// CONFIGURACIÓN
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rpm_auto_service';

// ============================================
// MIDDLEWARES GLOBALES
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para logging de peticiones (opcional)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ============================================
// CONFIGURACIÓN DE MULTER PARA ARCHIVOS
// ============================================
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG y PDF'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// ============================================
// MODELOS (definiciones rápidas para referencia)
// NOTA: Los modelos ya están en la carpeta /models
// ============================================
const Usuario = require('./models/Usuario');
const Vehiculo = require('./models/Vehiculo');
const Cita = require('./models/Cita');
const Venta = require('./models/Venta');

// ============================================
// USAR RUTAS
// ============================================
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/auth', usuarioRoutes);

// ============================================
// RUTAS PÚBLICAS ADICIONALES
// ============================================

// Ruta para subir archivos (contratos, imágenes)
app.post('/api/upload', upload.single('archivo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                mensaje: 'No se recibió ningún archivo'
            });
        }
        
        res.json({
            success: true,
            mensaje: 'Archivo subido exitosamente',
            archivo: {
                nombre: req.file.filename,
                original: req.file.originalname,
                ruta: `/uploads/${req.file.filename}`,
                tamaño: req.file.size
            }
        });
    } catch (error) {
        console.error('Error al subir archivo:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al subir archivo',
            error: error.message
        });
    }
});

// Ruta para archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// RUTA PRINCIPAL
// ============================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================
app.use((err, req, res, next) => {
    console.error('Error global:', err.stack);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({
                success: false,
                mensaje: 'El archivo es demasiado grande. Máximo 5MB'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        mensaje: err.message || 'Error interno del servidor'
    });
});

// ============================================
// CONEXIÓN A MONGODB Y ARRANQUE
// ============================================
async function conectarDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB exitosamente');
        
        // Crear admin por defecto si no existe
        await Usuario.crearAdminPorDefecto();
        
        // Crear vehículos de ejemplo si no hay ninguno
        const vehiculosCount = await Vehiculo.countDocuments();
        if (vehiculosCount === 0) {
            console.log('📦 Creando vehículos de ejemplo...');
            
            const vehiculosEjemplo = [
                { marca: 'TOYOTA', modelo: 'COROLLA', año: 2024, precio: 280000, kilometraje: 0, color: 'BLANCO', estado: 'disponible', condicion: 'nuevo', transmision: 'AUTOMÁTICA' },
                { marca: 'HONDA', modelo: 'CIVIC', año: 2024, precio: 320000, kilometraje: 0, color: 'GRIS', estado: 'disponible', condicion: 'nuevo', transmision: 'AUTOMÁTICA' },
                { marca: 'NISSAN', modelo: 'VERSA', año: 2023, precio: 240000, kilometraje: 15000, color: 'ROJO', estado: 'disponible', condicion: 'seminuevo', transmision: 'MANUAL' },
                { marca: 'MAZDA', modelo: 'MAZDA 3', año: 2024, precio: 350000, kilometraje: 0, color: 'AZUL', estado: 'disponible', condicion: 'nuevo', transmision: 'AUTOMÁTICA' },
                { marca: 'CHEVROLET', modelo: 'ONIX', año: 2023, precio: 220000, kilometraje: 20000, color: 'NEGRO', estado: 'disponible', condicion: 'usado', transmision: 'MANUAL' }
            ];
            
            await Vehiculo.insertMany(vehiculosEjemplo);
            console.log('✅ 5 vehículos de ejemplo creados');
        }
        
        // Arrancar servidor
        app.listen(PORT, () => {
            console.log(`
            ════════════════════════════════════════════════════
            🚀 SERVICIO INICIADO CORRECTAMENTE
            ════════════════════════════════════════════════════
            📡 Servidor: http://localhost:${PORT}
            📁 Archivos estáticos: /public
            📂 Uploads: /uploads
            
            🔗 ENDPOINTS DISPONIBLES:
            ────────────────────────────────────────────────────
            🚗 Vehículos:    http://localhost:${PORT}/api/vehiculos
            📅 Citas:        http://localhost:${PORT}/api/citas
            💰 Ventas:       http://localhost:${PORT}/api/ventas
            👤 Usuarios:     http://localhost:${PORT}/api/auth
            
            🔑 ADMIN POR DEFECTO:
            ────────────────────────────────────────────────────
            📧 Email:    admin@rpmauto.com
            🔒 Password: admin123
            ════════════════════════════════════════════════════
            `);
        });
        
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error);
        console.log('\n⚠️  Asegúrate de tener MongoDB instalado y corriendo:');
        console.log('   - En Windows: "mongod" en una terminal');
        console.log('   - En Mac: "brew services start mongodb-community"');
        console.log('   - O usa MongoDB Atlas (cambia la URI en MONGODB_URI)\n');
        process.exit(1);
    }
}

// Iniciar
conectarDB();