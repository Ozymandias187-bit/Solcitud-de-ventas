// ============================================
// config/db.js - Configuración de la Base de Datos
// ============================================
// Este archivo maneja toda la configuración y conexión a MongoDB
// Es como el "puente" entre tu aplicación y la base de datos
// ============================================

const mongoose = require('mongoose');

// ============================================
// CONFIGURACIÓN DE LA BASE DE DATOS
// ============================================

// URL de conexión a MongoDB
// Puedes cambiar esto según dónde tengas tu base de datos
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rpm_auto_service';

// Opciones de conexión (configuraciones para que funcione mejor)
const opcionesConexion = {
    useNewUrlParser: true,        // Usa el nuevo parser de URL
    useUnifiedTopology: true,     // Usa el nuevo motor de topología
    serverSelectionTimeoutMS: 5000, // Tiempo máximo para seleccionar servidor (5 segundos)
    socketTimeoutMS: 45000,        // Tiempo máximo de inactividad (45 segundos)
    family: 4                      // Usa IPv4 (evita problemas con IPv6)
};

// ============================================
// VARIABLES DE ESTADO DE LA CONEXIÓN
// ============================================
let conexionIntentos = 0;
const MAX_INTENTOS = 5;
const TIEMPO_ENTRE_INTENTOS = 5000; // 5 segundos

// ============================================
// FUNCIÓN PRINCIPAL PARA CONECTAR A MongoDB
// ============================================
const conectarDB = async () => {
    try {
        // Intentar conectar a MongoDB
        await mongoose.connect(MONGODB_URI, opcionesConexion);
        
        // Si llegamos aquí, la conexión fue exitosa
        console.log('\n✅ ========================================');
        console.log('✅ CONEXIÓN EXITOSA A MONGODB');
        console.log('✅ ========================================');
        console.log(`📊 Base de datos: ${mongoose.connection.name}`);
        console.log(`📍 Host: ${mongoose.connection.host}`);
        console.log(`🔢 Puerto: ${mongoose.connection.port}`);
        console.log('✅ ========================================\n');
        
        // Reiniciar contador de intentos
        conexionIntentos = 0;
        
        // Configurar event listeners para la conexión
        configurarEventListeners();
        
        return true;
        
    } catch (error) {
        console.error('\n❌ ========================================');
        console.error('❌ ERROR AL CONECTAR A MONGODB');
        console.error('❌ ========================================');
        console.error(`📝 Error: ${error.message}`);
        console.error('❌ ========================================\n');
        
        // Reintentar conexión si no se superó el máximo
        if (conexionIntentos < MAX_INTENTOS) {
            conexionIntentos++;
            console.log(`🔄 Reintentando conexión... (${conexionIntentos}/${MAX_INTENTOS})`);
            console.log(`⏳ Esperando ${TIEMPO_ENTRE_INTENTOS / 1000} segundos...\n`);
            
            // Esperar y reintentar
            setTimeout(conectarDB, TIEMPO_ENTRE_INTENTOS);
        } else {
            console.error('❌ ========================================');
            console.error('❌ NO SE PUDO CONECTAR A MONGODB');
            console.error('❌ ========================================');
            console.error('💡 POSIBLES SOLUCIONES:');
            console.error('   1. ¿Tienes MongoDB instalado?');
            console.error('   2. ¿Está corriendo MongoDB? Ejecuta "mongod" en una terminal');
            console.error('   3. ¿Cambiaste el puerto? Revisa la variable MONGODB_URI');
            console.error('   4. ¿Usas MongoDB Atlas? Verifica tu usuario y contraseña');
            console.error('❌ ========================================\n');
            
            // Salir del proceso con error
            process.exit(1);
        }
        
        return false;
    }
};

// ============================================
// CONFIGURAR EVENT LISTENERS DE MONGOOSE
// ============================================
const configurarEventListeners = () => {
    // Cuando la conexión es exitosa
    mongoose.connection.on('connected', () => {
        console.log('🔌 MongoDB: Conexión establecida');
    });
    
    // Cuando hay un error en la conexión
    mongoose.connection.on('error', (err) => {
        console.error('⚠️ MongoDB Error:', err.message);
    });
    
    // Cuando la conexión se desconecta
    mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB: Desconectado. Intentando reconectar...');
    });
    
    // Cuando la aplicación se cierra, cerrar la conexión
    process.on('SIGINT', async () => {
        await cerrarConexion();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await cerrarConexion();
        process.exit(0);
    });
};

// ============================================
// FUNCIÓN PARA CERRAR LA CONEXIÓN
// ============================================
const cerrarConexion = async () => {
    try {
        await mongoose.connection.close();
        console.log('\n🔌 Conexión a MongoDB cerrada correctamente');
    } catch (error) {
        console.error('\n❌ Error al cerrar conexión:', error.message);
    }
};

// ============================================
// FUNCIÓN PARA VERIFICAR ESTADO DE CONEXIÓN
// ============================================
const verificarConexion = () => {
    const estados = {
        0: 'Desconectado',
        1: 'Conectado',
        2: 'Conectando',
        3: 'Desconectando'
    };
    
    const estado = mongoose.connection.readyState;
    return {
        conectado: estado === 1,
        estado: estados[estado] || 'Desconocido',
        codigo: estado,
        nombre: mongoose.connection.name || 'No conectado',
        host: mongoose.connection.host || 'No disponible'
    };
};

// ============================================
// FUNCIÓN PARA OBTENER ESTADÍSTICAS DE LA DB
// ============================================
const obtenerEstadisticas = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return {
                success: false,
                mensaje: 'Base de datos no conectada'
            };
        }
        
        // Obtener estadísticas de la base de datos
        const db = mongoose.connection.db;
        
        // Listar todas las colecciones
        const colecciones = await db.listCollections().toArray();
        const nombresColecciones = colecciones.map(c => c.name);
        
        // Obtener cantidad de documentos por colección
        const statsColecciones = {};
        for (const coleccion of nombresColecciones) {
            const count = await db.collection(coleccion).countDocuments();
            statsColecciones[coleccion] = count;
        }
        
        return {
            success: true,
            nombre: mongoose.connection.name,
            host: mongoose.connection.host,
            puerto: mongoose.connection.port,
            colecciones: nombresColecciones,
            totalDocumentos: Object.values(statsColecciones).reduce((a, b) => a + b, 0),
            stats: statsColecciones
        };
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error.message);
        return {
            success: false,
            mensaje: error.message
        };
    }
};

// ============================================
// FUNCIÓN PARA LIMPIAR/REINICIAR BASE DE DATOS
// (SOLO PARA DESARROLLO)
// ============================================
const limpiarBaseDatos = async (confirmar = false) => {
    if (process.env.NODE_ENV === 'production' && !confirmar) {
        console.error('⚠️ No puedes limpiar la base de datos en producción sin confirmar');
        return false;
    }
    
    try {
        const db = mongoose.connection.db;
        const colecciones = await db.listCollections().toArray();
        
        for (const coleccion of colecciones) {
            await db.collection(coleccion.name).deleteMany({});
            console.log(`🗑️ Colección "${coleccion.name}" limpiada`);
        }
        
        console.log('✅ Base de datos limpiada completamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error al limpiar base de datos:', error.message);
        return false;
    }
};

// ============================================
// FUNCIÓN PARA CREAR ÍNDICES (mejora rendimiento)
// ============================================
const crearIndices = async () => {
    try {
        console.log('📇 Creando índices en las colecciones...');
        
        // Índices para Usuario
        const Usuario = require('../models/Usuario');
        await Usuario.collection.createIndex({ email: 1 }, { unique: true });
        await Usuario.collection.createIndex({ rol: 1 });
        console.log('  ✓ Índices de Usuario creados');
        
        // Índices para Vehiculo
        const Vehiculo = require('../models/Vehiculo');
        await Vehiculo.collection.createIndex({ marca: 1, modelo: 1 });
        await Vehiculo.collection.createIndex({ precio: -1 });
        await Vehiculo.collection.createIndex({ estado: 1 });
        console.log('  ✓ Índices de Vehiculo creados');
        
        // Índices para Cita
        const Cita = require('../models/Cita');
        await Cita.collection.createIndex({ fecha: 1, hora: 1 }, { unique: true });
        await Cita.collection.createIndex({ emailCliente: 1 });
        await Cita.collection.createIndex({ estado: 1 });
        console.log('  ✓ Índices de Cita creados');
        
        // Índices para Venta
        const Venta = require('../models/Venta');
        await Venta.collection.createIndex({ numeroVenta: 1 }, { unique: true });
        await Venta.collection.createIndex({ fechaVenta: -1 });
        await Venta.collection.createIndex({ 'cliente.email': 1 });
        console.log('  ✓ Índices de Venta creados');
        
        console.log('✅ Todos los índices fueron creados exitosamente\n');
        
    } catch (error) {
        console.error('❌ Error al crear índices:', error.message);
    }
};

// ============================================
// FUNCIÓN PARA HACER BACKUP DE LA BASE DE DATOS
// ============================================
const hacerBackup = async () => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Crear carpeta de backups si no existe
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const db = mongoose.connection.db;
        const colecciones = await db.listCollections().toArray();
        
        const backup = {};
        
        for (const coleccion of colecciones) {
            const data = await db.collection(coleccion.name).find({}).toArray();
            backup[coleccion.name] = data;
        }
        
        // Guardar backup como archivo JSON
        const fecha = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const nombreArchivo = `backup_${fecha}.json`;
        const rutaArchivo = path.join(backupDir, nombreArchivo);
        
        fs.writeFileSync(rutaArchivo, JSON.stringify(backup, null, 2));
        
        console.log(`💾 Backup guardado en: ${rutaArchivo}`);
        console.log(`📦 Tamaño: ${(fs.statSync(rutaArchivo).size / 1024).toFixed(2)} KB`);
        
        return {
            success: true,
            ruta: rutaArchivo,
            nombre: nombreArchivo,
            colecciones: Object.keys(backup)
        };
        
    } catch (error) {
        console.error('❌ Error al hacer backup:', error.message);
        return {
            success: false,
            mensaje: error.message
        };
    }
};

// ============================================
// EXPORTAR TODO
// ============================================
module.exports = {
    // Funciones principales
    conectarDB,
    cerrarConexion,
    verificarConexion,
    
    // Funciones de utilidad
    obtenerEstadisticas,
    crearIndices,
    limpiarBaseDatos,
    hacerBackup,
    
    // Exportar mongoose por si se necesita
    mongoose,
    
    // Constantes útiles
    MONGODB_URI
};