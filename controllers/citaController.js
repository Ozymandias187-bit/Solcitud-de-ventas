// ============================================
// controllers/citaController.js - Controlador de Citas
// ============================================
// Este archivo contiene toda la lógica de negocio relacionada con las citas
// Las funciones aquí se llaman desde las rutas (citaRoutes.js)
// ============================================

const Cita = require('../models/Cita');
const Vehiculo = require('../models/Vehiculo');
const Usuario = require('../models/Usuario');

// ============================================
// FUNCIONES PARA OBTENER HORARIOS
// ============================================

/**
 * Obtener horarios disponibles para una fecha específica
 * GET /api/citas/horarios-disponibles?fecha=2026-06-15
 */
const obtenerHorariosDisponibles = async (req, res) => {
    try {
        const { fecha } = req.query;
        
        // Validar que la fecha fue proporcionada
        if (!fecha) {
            return res.status(400).json({
                success: false,
                mensaje: 'La fecha es requerida',
                codigo: 'FECHA_REQUERIDA'
            });
        }
        
        // Validar formato de fecha
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El formato de fecha debe ser YYYY-MM-DD',
                codigo: 'FORMATO_FECHA_INVALIDO'
            });
        }
        
        // Horarios comerciales disponibles
        const todosHorarios = [
            '10:00', '10:30',
            '11:00', '11:30',
            '12:00', '12:30',
            '13:00', '13:30',
            '14:00', '14:30',
            '15:00', '15:30',
            '16:00', '16:30',
            '17:00', '17:30',
            '18:00'
        ];
        
        // Obtener citas ya agendadas para esa fecha (no canceladas)
        const citasExistentes = await Cita.find({
            fecha: fecha,
            estado: { $nin: ['cancelada'] }
        });
        
        // Extraer los horarios ocupados
        const horariosOcupados = citasExistentes.map(cita => cita.hora);
        
        // Filtrar horarios disponibles
        const horariosDisponibles = todosHorarios.filter(hora => !horariosOcupados.includes(hora));
        
        // Verificar si la fecha es sábado (solo hasta las 14:00)
        const diaSemana = new Date(fecha).getDay();
        if (diaSemana === 6) { // Sábado
            const horariosSabado = horariosDisponibles.filter(hora => {
                const horaNum = parseInt(hora.split(':')[0]);
                return horaNum < 14;
            });
            return res.json({
                success: true,
                fecha: fecha,
                horarios: horariosSabado,
                esSabado: true,
                mensaje: 'Los sábados el horario es hasta las 14:00'
            });
        }
        
        // Verificar si es domingo (cerrado)
        if (diaSemana === 0) {
            return res.json({
                success: true,
                fecha: fecha,
                horarios: [],
                esDomingo: true,
                mensaje: 'Los domingos no hay atención. Por favor selecciona otro día'
            });
        }
        
        res.json({
            success: true,
            fecha: fecha,
            horarios: horariosDisponibles,
            totalDisponibles: horariosDisponibles.length,
            mensaje: horariosDisponibles.length === 0 ? 'No hay horarios disponibles para esta fecha' : null
        });
        
    } catch (error) {
        console.error('Error en obtenerHorariosDisponibles:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener los horarios disponibles',
            error: error.message,
            codigo: 'ERROR_HORARIOS'
        });
    }
};

// ============================================
// FUNCIONES CRUD PRINCIPALES
// ============================================

/**
 * Crear una nueva cita
 * POST /api/citas
 */
const crearCita = async (req, res) => {
    try {
        const {
            vehiculoId,
            tipoCita,
            fecha,
            hora,
            nombreCliente,
            emailCliente,
            telefonoCliente,
            comentarios
        } = req.body;
        
        // Validar campos requeridos
        const camposRequeridos = [];
        if (!vehiculoId) camposRequeridos.push('vehiculoId');
        if (!tipoCita) camposRequeridos.push('tipoCita');
        if (!fecha) camposRequeridos.push('fecha');
        if (!hora) camposRequeridos.push('hora');
        if (!nombreCliente) camposRequeridos.push('nombreCliente');
        if (!emailCliente) camposRequeridos.push('emailCliente');
        if (!telefonoCliente) camposRequeridos.push('telefonoCliente');
        
        if (camposRequeridos.length > 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'Faltan campos requeridos',
                camposFaltantes: camposRequeridos,
                codigo: 'CAMPOS_REQUERIDOS'
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailCliente)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El email no tiene un formato válido',
                codigo: 'EMAIL_INVALIDO'
            });
        }
        
        // Verificar que el vehículo existe
        const vehiculo = await Vehiculo.findById(vehiculoId);
        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                mensaje: 'El vehículo seleccionado no existe',
                codigo: 'VEHICULO_NO_ENCONTRADO'
            });
        }
        
        // Verificar que el vehículo está disponible (no vendido)
        if (vehiculo.estado === 'vendido' && tipoCita === 'compra') {
            return res.status(400).json({
                success: false,
                mensaje: 'Este vehículo ya fue vendido. No se puede agendar cita para compra',
                codigo: 'VEHICULO_VENDIDO'
            });
        }
        
        // Verificar que el horario no está ocupado
        const citaExistente = await Cita.findOne({
            fecha: fecha,
            hora: hora,
            estado: { $nin: ['cancelada'] }
        });
        
        if (citaExistente) {
            return res.status(400).json({
                success: false,
                mensaje: 'El horario seleccionado ya no está disponible',
                codigo: 'HORARIO_NO_DISPONIBLE'
            });
        }
        
        // Verificar que la fecha no sea en el pasado
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaCita = new Date(fecha);
        fechaCita.setHours(0, 0, 0, 0);
        
        if (fechaCita < hoy) {
            return res.status(400).json({
                success: false,
                mensaje: 'No se pueden agendar citas en fechas pasadas',
                codigo: 'FECHA_PASADA'
            });
        }
        
        // Verificar que la hora esté dentro del horario laboral
        const horaNum = parseInt(hora.split(':')[0]);
        const diaSemana = fechaCita.getDay();
        
        if (diaSemana === 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'Los domingos no hay atención',
                codigo: 'DOMINGO_NO_ATENCION'
            });
        }
        
        if (diaSemana === 6 && horaNum >= 14) {
            return res.status(400).json({
                success: false,
                mensaje: 'Los sábados el horario es solo hasta las 14:00',
                codigo: 'SABADO_HORARIO_LIMITADO'
            });
        }
        
        if (horaNum < 10 || (horaNum >= 19 || (horaNum === 18 && parseInt(hora.split(':')[1]) > 0))) {
            return res.status(400).json({
                success: false,
                mensaje: 'El horario de atención es de 10:00 a 18:00',
                codigo: 'HORARIO_NO_LABORAL'
            });
        }
        
        // Obtener ID del usuario si está autenticado
        let usuarioId = null;
        if (req.usuario && req.usuario._id) {
            usuarioId = req.usuario._id;
        } else {
            // Buscar o crear usuario por email (para clientes no registrados)
            let usuarioExistente = await Usuario.findOne({ email: emailCliente });
            if (!usuarioExistente) {
                // Crear usuario básico para el cliente
                const nuevoUsuario = new Usuario({
                    nombre: nombreCliente.split(' ')[0],
                    apellidoPaterno: nombreCliente.split(' ')[1] || '',
                    email: emailCliente,
                    password: Math.random().toString(36).substring(7), // Contraseña temporal
                    telefono: telefonoCliente,
                    rol: 'cliente',
                    activo: true
                });
                usuarioExistente = await nuevoUsuario.save();
            }
            usuarioId = usuarioExistente._id;
        }
        
        // Crear la cita
        const nuevaCita = new Cita({
            vehiculoId,
            usuarioId,
            tipoCita,
            fecha,
            hora,
            nombreCliente,
            emailCliente,
            telefonoCliente,
            comentarios: comentarios || '',
            estado: 'pendiente'
        });
        
        await nuevaCita.save();
        
        // Poblar los datos del vehículo para la respuesta
        const citaCompleta = await Cita.findById(nuevaCita._id).populate('vehiculoId');
        
        res.status(201).json({
            success: true,
            mensaje: 'Cita agendada exitosamente',
            cita: citaCompleta,
            numeroConfirmacion: nuevaCita._id.toString().slice(-6).toUpperCase()
        });
        
    } catch (error) {
        console.error('Error en crearCita:', error);
        
        // Manejar error de duplicado (misma fecha y hora)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                mensaje: 'Ya existe una cita en este horario',
                codigo: 'CITA_DUPLICADA'
            });
        }
        
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear la cita',
            error: error.message,
            codigo: 'ERROR_CREAR_CITA'
        });
    }
};

/**
 * Obtener todas las citas (solo admin)
 * GET /api/citas
 */
const obtenerTodasCitas = async (req, res) => {
    try {
        const { estado, fecha, email, page = 1, limit = 10 } = req.query;
        
        // Construir filtro
        const filtro = {};
        if (estado) filtro.estado = estado;
        if (fecha) filtro.fecha = fecha;
        if (email) filtro.emailCliente = email;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const citas = await Cita.find(filtro)
            .populate('vehiculoId')
            .populate('usuarioId', 'nombre email')
            .sort({ fecha: -1, hora: 1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Cita.countDocuments(filtro);
        
        res.json({
            success: true,
            citas,
            paginacion: {
                total,
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                limite: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Error en obtenerTodasCitas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener las citas',
            error: error.message,
            codigo: 'ERROR_OBTENER_CITAS'
        });
    }
};

/**
 * Obtener citas del usuario actual
 * GET /api/citas/mis-citas
 */
const obtenerMisCitas = async (req, res) => {
    try {
        let citas = [];
        
        // Si el usuario está autenticado, buscar por su ID
        if (req.usuario && req.usuario._id) {
            citas = await Cita.find({ usuarioId: req.usuario._id })
                .populate('vehiculoId')
                .sort({ fecha: -1, hora: -1 });
        } 
        // Si hay email en query, buscar por email
        else if (req.query.email) {
            citas = await Cita.find({ emailCliente: req.query.email })
                .populate('vehiculoId')
                .sort({ fecha: -1, hora: -1 });
        }
        // Si no hay usuario ni email, error
        else {
            return res.status(400).json({
                success: false,
                mensaje: 'Se requiere autenticación o proporcionar un email',
                codigo: 'EMAIL_REQUERIDO'
            });
        }
        
        res.json({
            success: true,
            citas,
            total: citas.length
        });
        
    } catch (error) {
        console.error('Error en obtenerMisCitas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener tus citas',
            error: error.message,
            codigo: 'ERROR_MIS_CITAS'
        });
    }
};

/**
 * Obtener una cita por ID
 * GET /api/citas/:id
 */
const obtenerCitaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const cita = await Cita.findById(id)
            .populate('vehiculoId')
            .populate('usuarioId', 'nombre email telefono');
        
        if (!cita) {
            return res.status(404).json({
                success: false,
                mensaje: 'Cita no encontrada',
                codigo: 'CITA_NO_ENCONTRADA'
            });
        }
        
        // Verificar permisos (admin puede ver todas, otros solo las suyas)
        if (req.usuario && req.usuario.rol !== 'admin') {
            if (cita.usuarioId && cita.usuarioId._id.toString() !== req.usuario._id.toString()) {
                if (cita.emailCliente !== req.usuario.email) {
                    return res.status(403).json({
                        success: false,
                        mensaje: 'No tienes permiso para ver esta cita',
                        codigo: 'ACCESO_DENEGADO'
                    });
                }
            }
        }
        
        res.json({
            success: true,
            cita
        });
        
    } catch (error) {
        console.error('Error en obtenerCitaPorId:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener la cita',
            error: error.message,
            codigo: 'ERROR_OBTENER_CITA'
        });
    }
};

/**
 * Actualizar una cita
 * PUT /api/citas/:id
 */
const actualizarCita = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, hora, comentarios } = req.body;
        
        const cita = await Cita.findById(id);
        
        if (!cita) {
            return res.status(404).json({
                success: false,
                mensaje: 'Cita no encontrada',
                codigo: 'CITA_NO_ENCONTRADA'
            });
        }
        
        // Verificar permisos
        if (req.usuario && req.usuario.rol !== 'admin') {
            if (cita.emailCliente !== req.usuario.email) {
                return res.status(403).json({
                    success: false,
                    mensaje: 'No tienes permiso para modificar esta cita',
                    codigo: 'ACCESO_DENEGADO'
                });
            }
        }
        
        // Verificar que la cita no esté cancelada o completada
        if (cita.estado === 'cancelada') {
            return res.status(400).json({
                success: false,
                mensaje: 'No se puede modificar una cita cancelada',
                codigo: 'CITA_CANCELADA'
            });
        }
        
        if (cita.estado === 'completada') {
            return res.status(400).json({
                success: false,
                mensaje: 'No se puede modificar una cita ya completada',
                codigo: 'CITA_COMPLETADA'
            });
        }
        
        // Si cambia fecha u hora, verificar disponibilidad
        if ((fecha && fecha !== cita.fecha) || (hora && hora !== cita.hora)) {
            const nuevaFecha = fecha || cita.fecha;
            const nuevaHora = hora || cita.hora;
            
            const citaExistente = await Cita.findOne({
                _id: { $ne: id },
                fecha: nuevaFecha,
                hora: nuevaHora,
                estado: { $nin: ['cancelada'] }
            });
            
            if (citaExistente) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El nuevo horario no está disponible',
                    codigo: 'HORARIO_NO_DISPONIBLE'
                });
            }
        }
        
        // Actualizar campos
        if (fecha) cita.fecha = fecha;
        if (hora) cita.hora = hora;
        if (comentarios !== undefined) cita.comentarios = comentarios;
        
        await cita.save();
        
        const citaActualizada = await Cita.findById(id).populate('vehiculoId');
        
        res.json({
            success: true,
            mensaje: 'Cita actualizada exitosamente',
            cita: citaActualizada
        });
        
    } catch (error) {
        console.error('Error en actualizarCita:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar la cita',
            error: error.message,
            codigo: 'ERROR_ACTUALIZAR_CITA'
        });
    }
};

/**
 * Cancelar una cita
 * DELETE /api/citas/:id
 */
const cancelarCita = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        
        const cita = await Cita.findById(id);
        
        if (!cita) {
            return res.status(404).json({
                success: false,
                mensaje: 'Cita no encontrada',
                codigo: 'CITA_NO_ENCONTRADA'
            });
        }
        
        // Verificar permisos
        if (req.usuario && req.usuario.rol !== 'admin') {
            if (cita.emailCliente !== req.usuario.email) {
                return res.status(403).json({
                    success: false,
                    mensaje: 'No tienes permiso para cancelar esta cita',
                    codigo: 'ACCESO_DENEGADO'
                });
            }
        }
        
        // Verificar que la cita no esté ya cancelada o completada
        if (cita.estado === 'cancelada') {
            return res.status(400).json({
                success: false,
                mensaje: 'La cita ya está cancelada',
                codigo: 'CITA_YA_CANCELADA'
            });
        }
        
        if (cita.estado === 'completada') {
            return res.status(400).json({
                success: false,
                mensaje: 'No se puede cancelar una cita ya completada',
                codigo: 'CITA_COMPLETADA'
            });
        }
        
        // Cancelar la cita
        cita.estado = 'cancelada';
        if (motivo) cita.comentarios = `${cita.comentarios || ''}\nMotivo cancelación: ${motivo}`;
        
        await cita.save();
        
        res.json({
            success: true,
            mensaje: 'Cita cancelada exitosamente',
            cita: {
                id: cita._id,
                estado: cita.estado,
                fecha: cita.fecha,
                hora: cita.hora
            }
        });
        
    } catch (error) {
        console.error('Error en cancelarCita:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al cancelar la cita',
            error: error.message,
            codigo: 'ERROR_CANCELAR_CITA'
        });
    }
};

/**
 * Confirmar una cita (solo admin)
 * PUT /api/citas/:id/confirmar
 */
const confirmarCita = async (req, res) => {
    try {
        const { id } = req.params;
        
        const cita = await Cita.findById(id);
        
        if (!cita) {
            return res.status(404).json({
                success: false,
                mensaje: 'Cita no encontrada',
                codigo: 'CITA_NO_ENCONTRADA'
            });
        }
        
        if (cita.estado !== 'pendiente') {
            return res.status(400).json({
                success: false,
                mensaje: `No se puede confirmar una cita en estado ${cita.estado}`,
                codigo: 'ESTADO_INVALIDO'
            });
        }
        
        cita.estado = 'confirmada';
        await cita.save();
        
        res.json({
            success: true,
            mensaje: 'Cita confirmada exitosamente',
            cita
        });
        
    } catch (error) {
        console.error('Error en confirmarCita:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al confirmar la cita',
            error: error.message,
            codigo: 'ERROR_CONFIRMAR_CITA'
        });
    }
};

/**
 * Completar una cita (solo admin)
 * PUT /api/citas/:id/completar
 */
const completarCita = async (req, res) => {
    try {
        const { id } = req.params;
        
        const cita = await Cita.findById(id);
        
        if (!cita) {
            return res.status(404).json({
                success: false,
                mensaje: 'Cita no encontrada',
                codigo: 'CITA_NO_ENCONTRADA'
            });
        }
        
        if (cita.estado !== 'confirmada') {
            return res.status(400).json({
                success: false,
                mensaje: `No se puede completar una cita en estado ${cita.estado}`,
                codigo: 'ESTADO_INVALIDO'
            });
        }
        
        cita.estado = 'completada';
        await cita.save();
        
        res.json({
            success: true,
            mensaje: 'Cita completada exitosamente',
            cita
        });
        
    } catch (error) {
        console.error('Error en completarCita:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al completar la cita',
            error: error.message,
            codigo: 'ERROR_COMPLETAR_CITA'
        });
    }
};

// ============================================
// FUNCIONES ADICIONALES
// ============================================

/**
 * Obtener estadísticas de citas (solo admin)
 * GET /api/citas/estadisticas
 */
const obtenerEstadisticasCitas = async (req, res) => {
    try {
        const total = await Cita.countDocuments();
        const pendientes = await Cita.countDocuments({ estado: 'pendiente' });
        const confirmadas = await Cita.countDocuments({ estado: 'confirmada' });
        const canceladas = await Cita.countDocuments({ estado: 'cancelada' });
        const completadas = await Cita.countDocuments({ estado: 'completada' });
        
        // Citas por tipo
        const citasVisita = await Cita.countDocuments({ tipoCita: 'visita' });
        const citasCompra = await Cita.countDocuments({ tipoCita: 'compra' });
        
        // Citas de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const citasHoy = await Cita.countDocuments({ fecha: hoy });
        
        // Próximas citas (siguientes 7 días)
        const semana = new Date();
        semana.setDate(semana.getDate() + 7);
        const semanaStr = semana.toISOString().split('T')[0];
        const proximasCitas = await Cita.countDocuments({
            fecha: { $gte: hoy, $lte: semanaStr },
            estado: { $in: ['pendiente', 'confirmada'] }
        });
        
        res.json({
            success: true,
            estadisticas: {
                total,
                pendientes,
                confirmadas,
                canceladas,
                completadas,
                porTipo: {
                    visita: citasVisita,
                    compra: citasCompra
                },
                citasHoy,
                proximasCitasSemana: proximasCitas
            }
        });
        
    } catch (error) {
        console.error('Error en obtenerEstadisticasCitas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener estadísticas',
            error: error.message,
            codigo: 'ERROR_ESTADISTICAS'
        });
    }
};

// ============================================
// EXPORTAR TODAS LAS FUNCIONES
// ============================================

module.exports = {
    obtenerHorariosDisponibles,
    crearCita,
    obtenerTodasCitas,
    obtenerMisCitas,
    obtenerCitaPorId,
    actualizarCita,
    cancelarCita,
    confirmarCita,
    completarCita,
    obtenerEstadisticasCitas
};