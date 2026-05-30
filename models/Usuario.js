// ============================================
// models/Usuario.js - Modelo de Usuarios para MongoDB
// ============================================
// Este archivo define cómo se guardan los usuarios en la base de datos
// Maneja clientes, administradores y vendedores del concesionario
// ============================================

const mongoose = require('mongoose');
const crypto = require('crypto');

// ============================================
// ESQUEMA DE USUARIO (La estructura de cada usuario)
// ============================================
const UsuarioSchema = new mongoose.Schema(
    {
        // ========== INFORMACIÓN PERSONAL ==========
        nombre: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
            maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
        },

        apellidoPaterno: {
            type: String,
            required: false,
            trim: true,
            maxlength: [50, 'El apellido paterno no puede tener más de 50 caracteres']
        },

        apellidoMaterno: {
            type: String,
            required: false,
            trim: true,
            maxlength: [50, 'El apellido materno no puede tener más de 50 caracteres']
        },

        email: {
            type: String,
            required: [true, 'El email es requerido'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            validate: {
                validator: function(v) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: 'Debes ingresar un email válido'
            }
        },

        password: {
            type: String,
            required: [true, 'La contraseña es requerida'],
            minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
            select: false  // No se incluye por defecto en las consultas
        },

        telefono: {
            type: String,
            required: false,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^[0-9\s\-\(\)\+]+$/.test(v);
                },
                message: 'Debes ingresar un número de teléfono válido'
            }
        },

        celular: {
            type: String,
            required: false,
            trim: true
        },

        // ========== DIRECCIÓN ==========
        direccion: {
            calle: { type: String, trim: true },
            numero: { type: String, trim: true },
            colonia: { type: String, trim: true },
            ciudad: { type: String, trim: true },
            estado: { type: String, trim: true },
            codigoPostal: { type: String, trim: true },
            pais: { type: String, default: 'México', trim: true }
        },

        // ========== IDENTIFICACIÓN FISCAL ==========
        rfc: {
            type: String,
            unique: true,
            sparse: true,
            uppercase: true,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    // Validación básica de RFC mexicano (persona física o moral)
                    return /^[A-ZÑ&]{3,4}[0-9]{6}[A-V1-9]{1}[0-9A-Z]{1}[0-9A]$/.test(v);
                },
                message: 'Debes ingresar un RFC válido'
            }
        },

        curp: {
            type: String,
            unique: true,
            sparse: true,
            uppercase: true,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    // Validación básica de CURP mexicana
                    return /^[A-Z]{4}[0-9]{6}[A-Z]{6}[0-9]{2}$/.test(v);
                },
                message: 'Debes ingresar una CURP válida'
            }
        },

        // ========== ROL Y PERMISOS ==========
        rol: {
            type: String,
            enum: {
                values: ['cliente', 'vendedor', 'admin', 'gerente', 'mecanico'],
                message: '{VALUE} no es un rol válido'
            },
            default: 'cliente',
            required: true,
            index: true
        },

        permisos: [{
            type: String,
            enum: [
                'ver_vehiculos',
                'crear_vehiculos',
                'editar_vehiculos',
                'eliminar_vehiculos',
                'ver_ventas',
                'crear_ventas',
                'editar_ventas',
                'cancelar_ventas',
                'ver_citas',
                'crear_citas',
                'editar_citas',
                'cancelar_citas',
                'ver_usuarios',
                'crear_usuarios',
                'editar_usuarios',
                'eliminar_usuarios',
                'ver_reportes',
                'generar_reportes'
            ]
        }],

        // ========== INFORMACIÓN LABORAL (para empleados) ==========
        empleado: {
            numeroEmpleado: {
                type: String,
                unique: true,
                sparse: true,
                uppercase: true
            },
            puesto: {
                type: String,
                trim: true
            },
            departamento: {
                type: String,
                enum: ['ventas', 'servicios', 'administración', 'gerencia', 'taller'],
                required: false
            },
            fechaContratacion: {
                type: Date,
                required: false
            },
            salario: {
                type: Number,
                min: [0, 'El salario no puede ser negativo'],
                required: false
            },
            comision: {
                type: Number,
                default: 0,
                min: [0, 'La comisión no puede ser negativa'],
                max: [100, 'La comisión no puede ser mayor al 100%']
            },
            jefeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Usuario',
                required: false
            }
        },

        // ========== ESTADO DE LA CUENTA ==========
        activo: {
            type: Boolean,
            default: true,
            index: true
        },

        emailVerificado: {
            type: Boolean,
            default: false
        },

        telefonoVerificado: {
            type: Boolean,
            default: false
        },

        fechaVerificacionEmail: {
            type: Date,
            required: false
        },

        // ========== AUTENTICACIÓN Y SEGURIDAD ==========
        tokenVerificacion: {
            type: String,
            select: false
        },

        tokenRecuperacion: {
            type: String,
            select: false
        },

        tokenRecuperacionExpiracion: {
            type: Date,
            select: false
        },

        ultimoAcceso: {
            type: Date,
            required: false
        },

        ultimaIP: {
            type: String,
            required: false
        },

        intentosFallidos: {
            type: Number,
            default: 0,
            min: [0, 'Los intentos fallidos no pueden ser negativos'],
            max: [10, 'Máximo 10 intentos fallidos']
        },

        bloqueadoHasta: {
            type: Date,
            required: false
        },

        // ========== PREFERENCIAS ==========
        preferencias: {
            notificacionesEmail: {
                type: Boolean,
                default: true
            },
            notificacionesSMS: {
                type: Boolean,
                default: false
            },
            idioma: {
                type: String,
                enum: ['es', 'en'],
                default: 'es'
            },
            tema: {
                type: String,
                enum: ['claro', 'oscuro'],
                default: 'claro'
            }
        },

        // ========== NOTAS INTERNAS ==========
        notas: {
            type: String,
            required: false,
            trim: true,
            maxlength: [500, 'Las notas no pueden tener más de 500 caracteres']
        },

        // ========== FECHAS ==========
        fechaRegistro: {
            type: Date,
            default: Date.now,
            index: true
        },

        fechaActualizacion: {
            type: Date,
            default: Date.now
        },

        ultimaModificacionPor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'usuarios'
    }
);

// ============================================
// ÍNDICES PARA MEJORAR EL RENDIMIENTO
// ============================================

UsuarioSchema.index({ email: 1 }, { unique: true });
UsuarioSchema.index({ rol: 1, activo: 1 });
UsuarioSchema.index({ 'empleado.numeroEmpleado': 1 });
UsuarioSchema.index({ nombre: 'text', email: 'text' });
UsuarioSchema.index({ rfc: 1 }, { unique: true, sparse: true });
UsuarioSchema.index({ curp: 1 }, { unique: true, sparse: true });

// ============================================
// MIDDLEWARE (se ejecuta antes de guardar)
// ============================================

// Antes de guardar, actualizar fecha y procesar datos
UsuarioSchema.pre('save', function(next) {
    this.fechaActualizacion = new Date();
    
    // Generar nombre completo si no se proporcionaron apellidos
    if (!this.apellidoPaterno && !this.apellidoMaterno) {
        const partes = this.nombre.trim().split(' ');
        this.nombre = partes[0];
        if (partes[1]) this.apellidoPaterno = partes[1];
        if (partes[2]) this.apellidoMaterno = partes[2];
    }
    
    // Asignar permisos según el rol
    if (this.isModified('rol') || this.isNew) {
        this.permisos = this.obtenerPermisosPorRol();
    }
    
    next();
});

// Antes de actualizar, actualizar fecha
UsuarioSchema.pre('findOneAndUpdate', function(next) {
    this.set({ fechaActualizacion: new Date() });
    next();
});

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

// Obtener permisos según el rol
UsuarioSchema.methods.obtenerPermisosPorRol = function() {
    const permisosPorRol = {
        'cliente': [
            'ver_vehiculos',
            'ver_citas',
            'crear_citas',
            'editar_citas',
            'cancelar_citas'
        ],
        'vendedor': [
            'ver_vehiculos',
            'crear_vehiculos',
            'editar_vehiculos',
            'ver_ventas',
            'crear_ventas',
            'ver_citas',
            'crear_citas',
            'editar_citas',
            'ver_reportes'
        ],
        'gerente': [
            'ver_vehiculos',
            'crear_vehiculos',
            'editar_vehiculos',
            'ver_ventas',
            'crear_ventas',
            'editar_ventas',
            'cancelar_ventas',
            'ver_citas',
            'crear_citas',
            'editar_citas',
            'cancelar_citas',
            'ver_usuarios',
            'ver_reportes',
            'generar_reportes'
        ],
        'admin': [
            'ver_vehiculos',
            'crear_vehiculos',
            'editar_vehiculos',
            'eliminar_vehiculos',
            'ver_ventas',
            'crear_ventas',
            'editar_ventas',
            'cancelar_ventas',
            'ver_citas',
            'crear_citas',
            'editar_citas',
            'cancelar_citas',
            'ver_usuarios',
            'crear_usuarios',
            'editar_usuarios',
            'eliminar_usuarios',
            'ver_reportes',
            'generar_reportes'
        ],
        'mecanico': [
            'ver_vehiculos',
            'editar_vehiculos',
            'ver_citas'
        ]
    };
    
    return permisosPorRol[this.rol] || permisosPorRol['cliente'];
};

// Verificar si el usuario tiene un permiso específico
UsuarioSchema.methods.tienePermiso = function(permiso) {
    return this.permisos.includes(permiso) || this.rol === 'admin';
};

// Verificar si el usuario es administrador
UsuarioSchema.methods.esAdmin = function() {
    return this.rol === 'admin';
};

// Verificar si el usuario es vendedor
UsuarioSchema.methods.esVendedor = function() {
    return this.rol === 'vendedor';
};

// Verificar si el usuario es cliente
UsuarioSchema.methods.esCliente = function() {
    return this.rol === 'cliente';
};

// Verificar si la cuenta está bloqueada
UsuarioSchema.methods.estaBloqueada = function() {
    if (!this.bloqueadoHasta) return false;
    return new Date() < this.bloqueadoHasta;
};

// Registrar intento fallido
UsuarioSchema.methods.registrarIntentoFallido = async function() {
    this.intentosFallidos += 1;
    
    if (this.intentosFallidos >= 5) {
        // Bloquear por 30 minutos después de 5 intentos fallidos
        this.bloqueadoHasta = new Date();
        this.bloqueadoHasta.setMinutes(this.bloqueadoHasta.getMinutes() + 30);
    }
    
    await this.save();
};

// Reiniciar intentos fallidos
UsuarioSchema.methods.reiniciarIntentosFallidos = async function() {
    this.intentosFallidos = 0;
    this.bloqueadoHasta = null;
    await this.save();
};

// Registrar acceso
UsuarioSchema.methods.registrarAcceso = function(ip) {
    this.ultimoAcceso = new Date();
    if (ip) this.ultimaIP = ip;
    return this.save();
};

// Generar token de verificación de email
UsuarioSchema.methods.generarTokenVerificacion = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.tokenVerificacion = token;
    return token;
};

// Verificar email
UsuarioSchema.methods.verificarEmail = async function() {
    this.emailVerificado = true;
    this.fechaVerificacionEmail = new Date();
    this.tokenVerificacion = null;
    await this.save();
};

// Generar token de recuperación de contraseña
UsuarioSchema.methods.generarTokenRecuperacion = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.tokenRecuperacion = token;
    this.tokenRecuperacionExpiracion = new Date();
    this.tokenRecuperacionExpiracion.setHours(this.tokenRecuperacionExpiracion.getHours() + 1);
    return token;
};

// Cambiar contraseña
UsuarioSchema.methods.cambiarPassword = async function(nuevaPassword) {
    this.password = nuevaPassword;
    this.tokenRecuperacion = null;
    this.tokenRecuperacionExpiracion = null;
    await this.save();
};

// Obtener nombre completo
UsuarioSchema.methods.nombreCompleto = function() {
    const partes = [this.nombre];
    if (this.apellidoPaterno) partes.push(this.apellidoPaterno);
    if (this.apellidoMaterno) partes.push(this.apellidoMaterno);
    return partes.join(' ');
};

// Obtener rol en español
UsuarioSchema.methods.rolTexto = function() {
    const roles = {
        'cliente': '👤 Cliente',
        'vendedor': '💼 Vendedor',
        'gerente': '📊 Gerente',
        'admin': '⚙️ Administrador',
        'mecanico': '🔧 Mecánico'
    };
    return roles[this.rol] || this.rol;
};

// Obtener resumen del usuario
UsuarioSchema.methods.obtenerResumen = function() {
    return {
        id: this._id,
        nombre: this.nombreCompleto(),
        email: this.email,
        telefono: this.telefono,
        rol: this.rol,
        rolTexto: this.rolTexto(),
        activo: this.activo,
        emailVerificado: this.emailVerificado,
        fechaRegistro: this.fechaRegistro
    };
};

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

// Buscar usuario por email (con contraseña)
UsuarioSchema.statics.buscarPorEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// Buscar usuarios por rol
UsuarioSchema.statics.buscarPorRol = function(rol, activo = true) {
    const query = { rol: rol };
    if (activo !== undefined) query.activo = activo;
    return this.find(query).sort({ nombre: 1 });
};

// Buscar vendedores activos
UsuarioSchema.statics.buscarVendedores = function() {
    return this.find({ rol: 'vendedor', activo: true }).sort({ nombre: 1 });
};

// Buscar usuarios por texto
UsuarioSchema.statics.buscarPorTexto = function(texto) {
    return this.find({
        $or: [
            { nombre: { $regex: texto, $options: 'i' } },
            { email: { $regex: texto, $options: 'i' } },
            { apellidoPaterno: { $regex: texto, $options: 'i' } }
        ],
        activo: true
    });
};

// Obtener estadísticas de usuarios
UsuarioSchema.statics.obtenerEstadisticas = async function() {
    const totalUsuarios = await this.countDocuments();
    const totalActivos = await this.countDocuments({ activo: true });
    const totalInactivos = await this.countDocuments({ activo: false });
    
    const usuariosPorRol = await this.aggregate([
        { $group: {
            _id: '$rol',
            count: { $sum: 1 }
        }}
    ]);
    
    const emailVerificados = await this.countDocuments({ emailVerificado: true });
    const emailNoVerificados = await this.countDocuments({ emailVerificado: false });
    
    const registrosPorMes = await this.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: '$fechaRegistro' },
                    month: { $month: '$fechaRegistro' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    
    return {
        totalUsuarios,
        totalActivos,
        totalInactivos,
        usuariosPorRol,
        emailVerificados,
        emailNoVerificados,
        registrosPorMes
    };
};

// Crear usuario admin por defecto (si no existe)
UsuarioSchema.statics.crearAdminPorDefecto = async function() {
    const adminExistente = await this.findOne({ rol: 'admin' });
    
    if (!adminExistente) {
        const admin = new this({
            nombre: 'Administrador',
            apellidoPaterno: 'Sistema',
            email: 'admin@rpmauto.com',
            password: 'admin123',  // En producción usar bcrypt
            telefono: '555-0000-000',
            rol: 'admin',
            activo: true,
            emailVerificado: true
        });
        
        await admin.save();
        console.log('✅ Usuario administrador creado por defecto');
        console.log('   Email: admin@rpmauto.com');
        console.log('   Contraseña: admin123');
    }
};

// ============================================
// VIRTUALES
// ============================================

// Nombre completo del usuario
UsuarioSchema.virtual('nombreCompletoVirtual').get(function() {
    return this.nombreCompleto();
});

// Iniciales del usuario
UsuarioSchema.virtual('iniciales').get(function() {
    const iniciales = [this.nombre.charAt(0)];
    if (this.apellidoPaterno) iniciales.push(this.apellidoPaterno.charAt(0));
    if (this.apellidoMaterno) iniciales.push(this.apellidoMaterno.charAt(0));
    return iniciales.join('').toUpperCase();
});

// Verificar si el perfil está completo
UsuarioSchema.virtual('perfilCompleto').get(function() {
    return !!(this.telefono && this.direccion.calle && this.direccion.ciudad);
});

// Antigüedad como usuario (días desde registro)
UsuarioSchema.virtual('antigüedadDias').get(function() {
    const hoy = new Date();
    const diferencia = hoy - this.fechaRegistro;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
});

// ============================================
// VALIDACIONES PERSONALIZADAS
// ============================================

// Validar que el email no esté en uso
UsuarioSchema.pre('validate', async function(next) {
    if (this.isModified('email')) {
        const existe = await mongoose.model('Usuario').findOne({ email: this.email });
        if (existe && existe._id.toString() !== this._id?.toString()) {
            next(new Error('El email ya está registrado'));
        } else {
            next();
        }
    } else {
        next();
    }
});

// Validar que el número de empleado sea único
UsuarioSchema.pre('validate', async function(next) {
    if (this.empleado?.numeroEmpleado) {
        const existe = await mongoose.model('Usuario').findOne({
            'empleado.numeroEmpleado': this.empleado.numeroEmpleado
        });
        if (existe && existe._id.toString() !== this._id?.toString()) {
            next(new Error('El número de empleado ya está registrado'));
        } else {
            next();
        }
    } else {
        next();
    }
});

// ============================================
// CONFIGURACIÓN DE JSON
// ============================================
UsuarioSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.tokenVerificacion;
        delete ret.tokenRecuperacion;
        delete ret.tokenRecuperacionExpiracion;
        delete ret.__v;
        return ret;
    }
});

UsuarioSchema.set('toObject', {
    virtuals: true
});

// ============================================
// CREAR Y EXPORTAR EL MODELO
// ============================================
const Usuario = mongoose.model('Usuario', UsuarioSchema);

module.exports = Usuario;