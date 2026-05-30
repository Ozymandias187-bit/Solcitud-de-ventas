// ============================================
// models/Cita.js - Modelo de Citas para MongoDB
// ============================================
// Este archivo define cómo se guardan las citas en la base de datos
// Es como un "molde" que valida que los datos sean correctos
// antes de guardarlos en MongoDB
// ============================================

const mongoose = require('mongoose');

// ============================================
// ESQUEMA DE CITA (La estructura de cada cita)
// ============================================
const CitaSchema = new mongoose.Schema(
    {
        // ========== RELACIÓN CON VEHÍCULO ==========
        // ID del vehículo que se quiere ver/comprar
        vehiculoId: {
            type: mongoose.Schema.Types.ObjectId,  // Tipo especial que referencia a otro documento
            ref: 'Vehiculo',                       // Indica que se relaciona con el modelo Vehiculo
            required: [true, 'El vehículo es requerido']  // Campo obligatorio
        },

        // ========== RELACIÓN CON USUARIO (opcional) ==========
        // ID del usuario que agenda la cita (si está registrado)
        usuarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',                        // Relación con el modelo Usuario
            required: false                       // Opcional (cliente puede no estar registrado)
        },

        // ========== TIPO DE CITA ==========
        tipoCita: {
            type: String,
            enum: ['visita', 'compra'],           // Solo permite estos dos valores
            required: [true, 'El tipo de cita es requerido'],
            lowercase: true,                      // Convierte a minúsculas automáticamente
            trim: true                            // Elimina espacios al inicio y final
        },

        // ========== FECHA Y HORA ==========
        fecha: {
            type: String,                          // Formato: YYYY-MM-DD
            required: [true, 'La fecha es requerida'],
            validate: {
                validator: function(v) {
                    // Validar que la fecha tenga formato YYYY-MM-DD
                    return /^\d{4}-\d{2}-\d{2}$/.test(v);
                },
                message: 'La fecha debe tener formato YYYY-MM-DD'
            }
        },

        hora: {
            type: String,                          // Formato: HH:MM
            required: [true, 'La hora es requerida'],
            validate: {
                validator: function(v) {
                    // Validar que la hora tenga formato HH:MM
                    return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                },
                message: 'La hora debe tener formato HH:MM (ej: 14:30)'
            }
        },

        // ========== DATOS DEL CLIENTE ==========
        nombreCliente: {
            type: String,
            required: [true, 'El nombre del cliente es requerido'],
            trim: true,
            minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
            maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
        },

        emailCliente: {
            type: String,
            required: [true, 'El email del cliente es requerido'],
            lowercase: true,
            trim: true,
            validate: {
                validator: function(v) {
                    // Validar formato de email
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: 'Debes ingresar un email válido'
            }
        },

        telefonoCliente: {
            type: String,
            required: [true, 'El teléfono del cliente es requerido'],
            trim: true,
            validate: {
                validator: function(v) {
                    // Validar teléfono (permite números, espacios, guiones)
                    return /^[0-9\s\-\(\)\+]+$/.test(v);
                },
                message: 'Debes ingresar un número de teléfono válido'
            }
        },

        // ========== COMENTARIOS ADICIONALES ==========
        comentarios: {
            type: String,
            required: false,
            trim: true,
            maxlength: [500, 'Los comentarios no pueden tener más de 500 caracteres']
        },

        // ========== ESTADO DE LA CITA ==========
        estado: {
            type: String,
            enum: ['pendiente', 'confirmada', 'cancelada', 'completada'],
            default: 'pendiente',                  // Por defecto, las citas están pendientes
            required: true
        },

        // ========== FECHA DE CREACIÓN (automática) ==========
        fechaCreacion: {
            type: Date,
            default: Date.now                     // Se asigna automáticamente la fecha actual
        },

        // ========== FECHA DE MODIFICACIÓN (automática) ==========
        fechaModificacion: {
            type: Date,
            default: Date.now
        }
    },
    {
        // Opciones adicionales del esquema
        timestamps: true,      // Crea automáticamente createdAt y updatedAt
        versionKey: false,     // No agrega el campo __v (versión)
        collection: 'citas'    // Nombre de la colección en MongoDB
    }
);

// ============================================
// ÍNDICES PARA MEJORAR EL RENDIMIENTO
// ============================================

// Índice compuesto: evita que haya dos citas a la misma hora el mismo día
// Esto ayuda a prevenir citas duplicadas
CitaSchema.index({ fecha: 1, hora: 1 }, { unique: true });

// Índice para buscar citas por email del cliente (más rápido)
CitaSchema.index({ emailCliente: 1 });

// Índice para buscar citas por estado
CitaSchema.index({ estado: 1 });

// Índice para buscar citas por fecha
CitaSchema.index({ fecha: -1 });  // -1 = orden descendente (más recientes primero)

// ============================================
// MIDDLEWARE (se ejecuta antes de guardar)
// ============================================

// Antes de guardar, actualizar la fecha de modificación
CitaSchema.pre('save', function(next) {
    this.fechaModificacion = new Date();
    next();
});

// Antes de actualizar, actualizar la fecha de modificación
CitaSchema.pre('findOneAndUpdate', function(next) {
    this.set({ fechaModificacion: new Date() });
    next();
});

// ============================================
// MÉTODOS DE INSTANCIA (para cada cita individual)
// ============================================

// Método para confirmar la cita
CitaSchema.methods.confirmar = function() {
    this.estado = 'confirmada';
    return this.save();
};

// Método para cancelar la cita
CitaSchema.methods.cancelar = function() {
    this.estado = 'cancelada';
    return this.save();
};

// Método para completar la cita
CitaSchema.methods.completar = function() {
    this.estado = 'completada';
    return this.save();
};

// Método para verificar si la cita está pendiente
CitaSchema.methods.estaPendiente = function() {
    return this.estado === 'pendiente';
};

// Método para verificar si la cita se puede cancelar
CitaSchema.methods.sePuedeCancelar = function() {
    // Solo se pueden cancelar citas pendientes o confirmadas
    return this.estado === 'pendiente' || this.estado === 'confirmada';
};

// Método para obtener información formateada de la cita
CitaSchema.methods.obtenerResumen = function() {
    return {
        id: this._id,
        tipoCita: this.tipoCita === 'visita' ? 'Visita al concesionario' : 'Cita para compra',
        fecha: this.fecha,
        hora: this.hora,
        cliente: this.nombreCliente,
        email: this.emailCliente,
        telefono: this.telefonoCliente,
        estado: this.estado,
        fechaCreacion: this.fechaCreacion
    };
};

// ============================================
// MÉTODOS ESTÁTICOS (para toda la colección de citas)
// ============================================

// Buscar citas por email del cliente
CitaSchema.statics.buscarPorEmail = function(email) {
    return this.find({ emailCliente: email })
               .populate('vehiculoId')      // Trae los datos completos del vehículo
               .sort({ fecha: -1, hora: -1 });  // Ordenar por fecha más reciente
};

// Buscar citas por fecha específica
CitaSchema.statics.buscarPorFecha = function(fecha) {
    return this.find({ fecha: fecha })
               .populate('vehiculoId')
               .sort({ hora: 1 });  // Ordenar por hora (más temprano primero)
};

// Buscar citas pendientes
CitaSchema.statics.buscarPendientes = function() {
    return this.find({ estado: 'pendiente' })
               .populate('vehiculoId')
               .sort({ fecha: 1, hora: 1 });
};

// Buscar citas por rango de fechas
CitaSchema.statics.buscarPorRangoFechas = function(fechaInicio, fechaFin) {
    return this.find({
        fecha: {
            $gte: fechaInicio,  // Mayor o igual que fechaInicio
            $lte: fechaFin      // Menor o igual que fechaFin
        }
    }).populate('vehiculoId').sort({ fecha: 1, hora: 1 });
};

// Obtener horarios disponibles para una fecha
CitaSchema.statics.obtenerHorariosOcupados = async function(fecha) {
    const citas = await this.find({ fecha: fecha, estado: { $ne: 'cancelada' } });
    return citas.map(cita => cita.hora);
};

// Contar citas por estado
CitaSchema.statics.contarPorEstado = async function() {
    return await this.aggregate([
        {
            $group: {
                _id: '$estado',
                count: { $sum: 1 }
            }
        }
    ]);
};

// Cancelar todas las citas vencidas (fechas pasadas)
CitaSchema.statics.cancelarCitasVencidas = async function() {
    const hoy = new Date().toISOString().split('T')[0];
    
    return await this.updateMany(
        {
            fecha: { $lt: hoy },           // Fechas anteriores a hoy
            estado: { $in: ['pendiente', 'confirmada'] }
        },
        {
            estado: 'cancelada',
            fechaModificacion: new Date()
        }
    );
};

// ============================================
// VALIDACIONES PERSONALIZADAS
// ============================================

// Validar que la fecha no sea en el pasado (solo para nuevas citas)
CitaSchema.pre('validate', function(next) {
    if (this.isNew) {  // Solo para citas nuevas, no para actualizaciones
        const hoy = new Date();
        const fechaCita = new Date(this.fecha);
        
        // Resetear horas para comparar solo fechas
        hoy.setHours(0, 0, 0, 0);
        fechaCita.setHours(0, 0, 0, 0);
        
        if (fechaCita < hoy) {
            next(new Error('No se pueden agendar citas en fechas pasadas'));
        } else {
            next();
        }
    } else {
        next();
    }
});

// Validar que la hora esté dentro del horario comercial
CitaSchema.pre('validate', function(next) {
    const horaNum = parseInt(this.hora.split(':')[0]);
    
    if (horaNum < 9 || horaNum > 18) {
        next(new Error('Las citas solo están disponibles de 9:00 a 18:00 horas'));
    } else {
        next();
    }
});

// ============================================
// VIRTUALES (campos calculados que no se guardan)
// ============================================

// Virtual para obtener la fecha formateada
CitaSchema.virtual('fechaFormateada').get(function() {
    const [año, mes, dia] = this.fecha.split('-');
    return `${dia}/${mes}/${año}`;
});

// Virtual para obtener la hora formateada
CitaSchema.virtual('horaFormateada').get(function() {
    const [hora, minuto] = this.hora.split(':');
    const horaNum = parseInt(hora);
    const ampm = horaNum >= 12 ? 'PM' : 'AM';
    const hora12 = horaNum % 12 || 12;
    return `${hora12}:${minuto} ${ampm}`;
});

// Virtual para obtener el tipo de cita en español
CitaSchema.virtual('tipoCitaTexto').get(function() {
    return this.tipoCita === 'visita' ? 'Visita al concesionario' : 'Cita para compra';
});

// Virtual para obtener el estado en español
CitaSchema.virtual('estadoTexto').get(function() {
    const estados = {
        'pendiente': 'Pendiente de confirmación',
        'confirmada': 'Confirmada',
        'cancelada': 'Cancelada',
        'completada': 'Completada'
    };
    return estados[this.estado] || this.estado;
});

// Virtual para saber si la cita es hoy
CitaSchema.virtual('esHoy').get(function() {
    const hoy = new Date().toISOString().split('T')[0];
    return this.fecha === hoy;
});

// Virtual para saber si la cita ya pasó
CitaSchema.virtual('yaPaso').get(function() {
    const hoy = new Date().toISOString().split('T')[0];
    return this.fecha < hoy;
});

// ============================================
// CONFIGURACIÓN DE JSON (cómo se ve cuando se convierte a JSON)
// ============================================
CitaSchema.set('toJSON', {
    virtuals: true,      // Incluir los campos virtuales
    transform: function(doc, ret) {
        delete ret.__v;   // Eliminar versión
        delete ret.fechaModificacion;  // Opcional: ocultar campos internos
        return ret;
    }
});

CitaSchema.set('toObject', {
    virtuals: true
});

// ============================================
// CREAR Y EXPORTAR EL MODELO
// ============================================
const Cita = mongoose.model('Cita', CitaSchema);

module.exports = Cita;