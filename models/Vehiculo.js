// ============================================
// models/Vehiculo.js - Modelo de Vehículos para MongoDB
// ============================================
// Este archivo define cómo se guardan los vehículos en la base de datos
// Contiene toda la información de los autos del concesionario
// ============================================

const mongoose = require('mongoose');

// ============================================
// ESQUEMA DE VEHÍCULO (La estructura de cada auto)
// ============================================
const VehiculoSchema = new mongoose.Schema(
    {
        // ========== INFORMACIÓN BÁSICA ==========
        marca: {
            type: String,
            required: [true, 'La marca del vehículo es requerida'],
            trim: true,
            uppercase: true,  // Guarda en mayúsculas (TOYOTA, HONDA, etc.)
            enum: {
                values: ['TOYOTA', 'HONDA', 'NISSAN', 'MAZDA', 'CHEVROLET', 'FORD', 'VOLKSWAGEN', 'BMW', 'MERCEDES', 'AUDI', 'HYUNDAI', 'KIA', 'SUZUKI', 'RENAULT', 'PEUGEOT', 'OTRO'],
                message: '{VALUE} no es una marca válida'
            }
        },

        modelo: {
            type: String,
            required: [true, 'El modelo del vehículo es requerido'],
            trim: true,
            uppercase: true,
            minlength: [1, 'El modelo debe tener al menos 1 carácter'],
            maxlength: [50, 'El modelo no puede tener más de 50 caracteres']
        },

        año: {
            type: Number,
            required: [true, 'El año del vehículo es requerido'],
            min: [1950, 'El año no puede ser menor a 1950'],
            max: [new Date().getFullYear() + 1, `El año no puede ser mayor a ${new Date().getFullYear() + 1}`],
            validate: {
                validator: Number.isInteger,
                message: 'El año debe ser un número entero'
            }
        },

        // ========== INFORMACIÓN ECONÓMICA ==========
        precio: {
            type: Number,
            required: [true, 'El precio del vehículo es requerido'],
            min: [1000, 'El precio mínimo es de $1,000'],
            max: [5000000, 'El precio máximo es de $5,000,000'],
            validate: {
                validator: function(v) {
                    return v > 0;
                },
                message: 'El precio debe ser mayor a 0'
            }
        },

        precioOriginal: {
            type: Number,
            required: false,
            min: [1000, 'El precio original mínimo es de $1,000']
        },

        // ========== INFORMACIÓN TÉCNICA ==========
        kilometraje: {
            type: Number,
            required: false,
            default: 0,
            min: [0, 'El kilometraje no puede ser negativo'],
            validate: {
                validator: Number.isInteger,
                message: 'El kilometraje debe ser un número entero'
            }
        },

        color: {
            type: String,
            required: false,
            trim: true,
            uppercase: true,
            enum: {
                values: ['BLANCO', 'NEGRO', 'GRIS', 'ROJO', 'AZUL', 'VERDE', 'AMARILLO', 'NARANJA', 'MARRÓN', 'DORADO', 'PLATEADO', 'OTRO'],
                message: '{VALUE} no es un color válido'
            }
        },

        transmision: {
            type: String,
            enum: ['MANUAL', 'AUTOMÁTICA', 'CVT', 'SEMIAUTOMÁTICA'],
            default: 'MANUAL',
            uppercase: true
        },

        combustible: {
            type: String,
            enum: ['GASOLINA', 'DIESEL', 'ELÉCTRICO', 'HÍBRIDO', 'GNC'],
            default: 'GASOLINA',
            uppercase: true
        },

        cilindraje: {
            type: Number,
            required: false,
            min: [0, 'El cilindraje no puede ser negativo'],
            max: [8000, 'El cilindraje máximo es 8000 cc']
        },

        potencia: {
            type: Number,
            required: false,
            min: [0, 'La potencia no puede ser negativa'],
            max: [1000, 'La potencia máxima es 1000 HP']
        },

        // ========== INFORMACIÓN DE ESTADO ==========
        estado: {
            type: String,
            enum: ['disponible', 'vendido', 'reservado', 'en_mantenimiento'],
            default: 'disponible',
            required: true
        },

        condicion: {
            type: String,
            enum: ['nuevo', 'seminuevo', 'usado'],
            default: 'nuevo',
            required: true
        },

        // ========== CARACTERÍSTICAS ADICIONALES ==========
        numeroPuertas: {
            type: Number,
            enum: [2, 3, 4, 5],
            default: 4
        },

        numeroAsientos: {
            type: Number,
            enum: [2, 4, 5, 6, 7, 8, 9],
            default: 5
        },

        tracción: {
            type: String,
            enum: ['DELANTERA', 'TRASERA', '4X4', 'AWD'],
            uppercase: true
        },

        // ========== IMÁGENES ==========
        imagenes: [{
            type: String,  // URLs o rutas de las imágenes
            validate: {
                validator: function(v) {
                    return v.length <= 5;  // Máximo 5 imágenes
                },
                message: 'Solo se permiten máximo 5 imágenes'
            }
        }],

        imagenPrincipal: {
            type: String,
            default: '/images/default-car.jpg'
        },

        // ========== DOCUMENTACIÓN ==========
        numeroSerie: {
            type: String,
            unique: true,
            sparse: true,  // Permite null/undefined pero si existe debe ser único
            uppercase: true,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^[A-HJ-NPR-TV-Z0-9]{17}$/.test(v);  // VIN válido (17 caracteres)
                },
                message: 'El número de serie (VIN) debe tener 17 caracteres'
            }
        },

        numeroMotor: {
            type: String,
            unique: true,
            sparse: true,
            uppercase: true,
            trim: true
        },

        placas: {
            type: String,
            uppercase: true,
            trim: true
        },

        // ========== DESCRIPCIÓN ==========
        descripcion: {
            type: String,
            required: false,
            trim: true,
            maxlength: [1000, 'La descripción no puede tener más de 1000 caracteres']
        },

        características: [{
            type: String,  // Array de características (ABS, Airbags, etc.)
            trim: true
        }],

        // ========== EXTRAS / ACCESORIOS ==========
        extras: [{
            nombre: {
                type: String,
                required: true
            },
            incluido: {
                type: Boolean,
                default: true
            }
        }],

        // ========== DATOS DE COMPRA (se llenan cuando se vende) ==========
        fechaVenta: {
            type: Date,
            required: false
        },

        compradorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: false
        },

        // ========== MANTENIMIENTO ==========
        ultimoMantenimiento: {
            type: Date,
            required: false
        },

        proximoMantenimiento: {
            type: Date,
            required: false
        },

        kilometrajeMantenimiento: {
            type: Number,
            min: 0
        },

        // ========== FECHAS DE REGISTRO ==========
        fechaRegistro: {
            type: Date,
            default: Date.now
        },

        fechaActualizacion: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,      // Crea automáticamente createdAt y updatedAt
        versionKey: false,     // No agrega el campo __v
        collection: 'vehiculos'
    }
);

// ============================================
// ÍNDICES PARA MEJORAR EL RENDIMIENTO
// ============================================

// Índice para búsquedas por marca y modelo
VehiculoSchema.index({ marca: 1, modelo: 1 });

// Índice para búsquedas por precio
VehiculoSchema.index({ precio: -1 });

// Índice para búsquedas por estado y condición
VehiculoSchema.index({ estado: 1, condicion: 1 });

// Índice para búsquedas por año
VehiculoSchema.index({ año: -1 });

// Índice combinado para búsquedas avanzadas
VehiculoSchema.index({ marca: 1, modelo: 1, año: 1, estado: 1 });

// Índice de texto para búsqueda por palabras clave
VehiculoSchema.index({
    marca: 'text',
    modelo: 'text',
    descripcion: 'text',
    características: 'text'
});

// ============================================
// MIDDLEWARE (se ejecuta antes de guardar)
// ============================================

// Antes de guardar, actualizar la fecha de actualización
VehiculoSchema.pre('save', function(next) {
    this.fechaActualizacion = new Date();
    
    // Si no hay precio original, usar el precio actual
    if (!this.precioOriginal && this.precio) {
        this.precioOriginal = this.precio;
    }
    
    // Validar que el kilometraje sea apropiado según la condición
    if (this.condicion === 'nuevo' && this.kilometraje > 100) {
        next(new Error('Un vehículo nuevo no puede tener más de 100 km'));
    }
    
    next();
});

// Antes de actualizar, actualizar fecha
VehiculoSchema.pre('findOneAndUpdate', function(next) {
    this.set({ fechaActualizacion: new Date() });
    next();
});

// ============================================
// MÉTODOS DE INSTANCIA (para cada vehículo)
// ============================================

// Método para vender el vehículo
VehiculoSchema.methods.vender = async function(compradorId) {
    if (this.estado === 'vendido') {
        throw new Error('Este vehículo ya fue vendido');
    }
    
    this.estado = 'vendido';
    this.fechaVenta = new Date();
    this.compradorId = compradorId;
    
    return await this.save();
};

// Método para reservar el vehículo
VehiculoSchema.methods.reservar = async function() {
    if (this.estado !== 'disponible') {
        throw new Error('Este vehículo no está disponible para reservar');
    }
    
    this.estado = 'reservado';
    return await this.save();
};

// Método para poner disponible nuevamente
VehiculoSchema.methods.disponible = async function() {
    this.estado = 'disponible';
    this.compradorId = null;
    return await this.save();
};

// Método para aplicar descuento
VehiculoSchema.methods.aplicarDescuento = function(porcentaje) {
    if (porcentaje < 0 || porcentaje > 100) {
        throw new Error('El porcentaje de descuento debe estar entre 0 y 100');
    }
    
    const descuento = this.precio * (porcentaje / 100);
    this.precio = this.precio - descuento;
    return this.save();
};

// Método para registrar mantenimiento
VehiculoSchema.methods.registrarMantenimiento = function(fecha, kilometraje) {
    this.ultimoMantenimiento = fecha || new Date();
    if (kilometraje) {
        this.kilometrajeMantenimiento = kilometraje;
        this.proximoMantenimiento = new Date();
        this.proximoMantenimiento.setMonth(this.proximoMantenimiento.getMonth() + 6);
    }
    return this.save();
};

// Método para obtener el precio con formato
VehiculoSchema.methods.precioFormateado = function() {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(this.precio);
};

// Método para obtener el porcentaje de descuento aplicado
VehiculoSchema.methods.porcentajeDescuento = function() {
    if (!this.precioOriginal) return 0;
    return Math.round(((this.precioOriginal - this.precio) / this.precioOriginal) * 100);
};

// Método para verificar si está en oferta
VehiculoSchema.methods.estaEnOferta = function() {
    return this.precioOriginal && this.precio < this.precioOriginal;
};

// Método para obtener un resumen del vehículo
VehiculoSchema.methods.obtenerResumen = function() {
    return {
        id: this._id,
        nombre: `${this.marca} ${this.modelo}`,
        año: this.año,
        precio: this.precio,
        precioFormateado: this.precioFormateado(),
        color: this.color,
        kilometraje: this.kilometraje,
        estado: this.estado,
        condicion: this.condicion,
        imagen: this.imagenPrincipal
    };
};

// ============================================
// MÉTODOS ESTÁTICOS (para toda la colección)
// ============================================

// Buscar vehículos disponibles
VehiculoSchema.statics.buscarDisponibles = function() {
    return this.find({ estado: 'disponible' }).sort({ precio: 1 });
};

// Buscar por rango de precio
VehiculoSchema.statics.buscarPorRangoPrecio = function(min, max) {
    const query = { estado: 'disponible' };
    if (min) query.precio = { $gte: min };
    if (max) query.precio = { ...query.precio, $lte: max };
    return this.find(query).sort({ precio: 1 });
};

// Buscar por marca
VehiculoSchema.statics.buscarPorMarca = function(marca) {
    return this.find({ marca: marca.toUpperCase(), estado: 'disponible' }).sort({ precio: 1 });
};

// Buscar por año
VehiculoSchema.statics.buscarPorAño = function(año) {
    return this.find({ año: año, estado: 'disponible' }).sort({ precio: 1 });
};

// Buscar vehículos nuevos
VehiculoSchema.statics.buscarNuevos = function() {
    return this.find({ condicion: 'nuevo', estado: 'disponible' }).sort({ precio: 1 });
};

// Buscar vehículos usados
VehiculoSchema.statics.buscarUsados = function() {
    return this.find({ condicion: 'usado', estado: 'disponible' }).sort({ precio: 1 });
};

// Buscar vehículos por rango de kilometraje
VehiculoSchema.statics.buscarPorKilometraje = function(maxKm) {
    return this.find({ kilometraje: { $lte: maxKm }, estado: 'disponible' }).sort({ kilometraje: 1 });
};

// Obtener estadísticas de inventario
VehiculoSchema.statics.obtenerEstadisticas = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$estado',
                count: { $sum: 1 },
                precioPromedio: { $avg: '$precio' },
                precioMin: { $min: '$precio' },
                precioMax: { $max: '$precio' }
            }
        }
    ]);
    
    const total = await this.countDocuments();
    const totalDisponibles = await this.countDocuments({ estado: 'disponible' });
    const valorInventario = await this.aggregate([
        { $match: { estado: 'disponible' } },
        { $group: { _id: null, total: { $sum: '$precio' } } }
    ]);
    
    return {
        total,
        totalDisponibles,
        totalVendidos: await this.countDocuments({ estado: 'vendido' }),
        valorInventario: valorInventario[0]?.total || 0,
        porEstado: stats
    };
};

// Búsqueda por texto (marca, modelo, descripción)
VehiculoSchema.statics.buscarPorTexto = function(texto) {
    return this.find(
        { $text: { $search: texto }, estado: 'disponible' },
        { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
};

// Obtener marcas disponibles (para filtros)
VehiculoSchema.statics.obtenerMarcas = async function() {
    return await this.distinct('marca', { estado: 'disponible' });
};

// ============================================
// VIRTUALES (campos calculados que no se guardan)
// ============================================

// Nombre completo del vehículo
VehiculoSchema.virtual('nombreCompleto').get(function() {
    return `${this.marca} ${this.modelo} ${this.año}`;
});

// Antigüedad del vehículo
VehiculoSchema.virtual('antigüedad').get(function() {
    const añoActual = new Date().getFullYear();
    return añoActual - this.año;
});

// Verificar si es vehículo nuevo (menos de 100 km)
VehiculoSchema.virtual('esNuevo').get(function() {
    return this.kilometraje <= 100;
});

// Verificar si necesita mantenimiento
VehiculoSchema.virtual('necesitaMantenimiento').get(function() {
    if (!this.proximoMantenimiento) return false;
    return new Date() > this.proximoMantenimiento;
});

// Estado en español
VehiculoSchema.virtual('estadoTexto').get(function() {
    const estados = {
        'disponible': '✅ Disponible',
        'vendido': '❌ Vendido',
        'reservado': '🔒 Reservado',
        'en_mantenimiento': '🔧 En Mantenimiento'
    };
    return estados[this.estado] || this.estado;
});

// Condición en español
VehiculoSchema.virtual('condicionTexto').get(function() {
    const condiciones = {
        'nuevo': '🚗 Nuevo',
        'seminuevo': '🔄 Seminuevo',
        'usado': '🔧 Usado'
    };
    return condiciones[this.condicion] || this.condicion;
});

// URL de la imagen principal (si no hay, usar default)
VehiculoSchema.virtual('imagenUrl').get(function() {
    if (this.imagenPrincipal && this.imagenPrincipal !== '/images/default-car.jpg') {
        return this.imagenPrincipal;
    }
    
    // Imagen por defecto según marca
    const imagenesPorMarca = {
        'TOYOTA': '/images/toyota-default.jpg',
        'HONDA': '/images/honda-default.jpg',
        'NISSAN': '/images/nissan-default.jpg'
    };
    
    return imagenesPorMarca[this.marca] || '/images/default-car.jpg';
});

// ============================================
// VALIDACIONES PERSONALIZADAS
// ============================================

// Validar que el precio no sea menor al 50% del original (evita errores)
VehiculoSchema.pre('validate', function(next) {
    if (this.precioOriginal && this.precio < this.precioOriginal * 0.5) {
        next(new Error('El precio no puede ser menor al 50% del precio original'));
    } else {
        next();
    }
});

// Validar que el año sea razonable
VehiculoSchema.pre('validate', function(next) {
    if (this.condicion === 'nuevo' && this.año < new Date().getFullYear()) {
        next(new Error('Un vehículo nuevo debe ser del año actual o siguiente'));
    } else {
        next();
    }
});

// ============================================
// CONFIGURACIÓN DE JSON
// ============================================
VehiculoSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.precioFormateado = doc.precioFormateado();
        delete ret.__v;
        return ret;
    }
});

VehiculoSchema.set('toObject', {
    virtuals: true
});

// ============================================
// CREAR Y EXPORTAR EL MODELO
// ============================================
const Vehiculo = mongoose.model('Vehiculo', VehiculoSchema);

module.exports = Vehiculo;