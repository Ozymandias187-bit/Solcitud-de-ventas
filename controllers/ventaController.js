// ============================================
// controllers/ventaController.js - Controlador de Ventas
// ============================================
// Este archivo contiene toda la lógica de negocio relacionada con las ventas
// Maneja registro de ventas, validación de pagos, facturación, etc.
// ============================================

const Venta = require('../models/Venta');
const Vehiculo = require('../models/Vehiculo');
const Usuario = require('../models/Usuario');
const Cita = require('../models/Cita');

// ============================================
// FUNCIONES PARA CÁLCULOS Y VALIDACIONES
// ============================================

/**
 * Calcular total de una venta (precio + impuestos - descuento)
 * GET /api/ventas/calcular-total/:vehiculoId
 */
const calcularTotal = async (req, res) => {
    try {
        const { vehiculoId } = req.params;
        const { descuento = 0 } = req.query;
        
        // Verificar que el vehículo existe
        const vehiculo = await Vehiculo.findById(vehiculoId);
        
        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                mensaje: 'Vehículo no encontrado',
                codigo: 'VEHICULO_NO_ENCONTRADO'
            });
        }
        
        // Verificar que el vehículo está disponible
        if (vehiculo.estado === 'vendido') {
            return res.status(400).json({
                success: false,
                mensaje: 'Este vehículo ya fue vendido',
                codigo: 'VEHICULO_VENDIDO'
            });
        }
        
        // Calcular impuestos (IVA 16%)
        const precioBase = vehiculo.precio;
        const iva = precioBase * 0.16;
        const descuentoNum = parseFloat(descuento) || 0;
        
        // Validar descuento
        if (descuentoNum < 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El descuento no puede ser negativo',
                codigo: 'DESCUENTO_NEGATIVO'
            });
        }
        
        if (descuentoNum > precioBase) {
            return res.status(400).json({
                success: false,
                mensaje: 'El descuento no puede ser mayor al precio del vehículo',
                codigo: 'DESCUENTO_EXCEDIDO'
            });
        }
        
        const total = precioBase + iva - descuentoNum;
        
        res.json({
            success: true,
            datos: {
                vehiculo: {
                    id: vehiculo._id,
                    marca: vehiculo.marca,
                    modelo: vehiculo.modelo,
                    año: vehiculo.año
                },
                precios: {
                    precioBase: precioBase,
                    precioBaseFormateado: `$${precioBase.toLocaleString()}`,
                    iva: iva,
                    ivaFormateado: `$${iva.toLocaleString()}`,
                    descuento: descuentoNum,
                    descuentoFormateado: `$${descuentoNum.toLocaleString()}`,
                    total: total,
                    totalFormateado: `$${total.toLocaleString()}`
                },
                impuestos: {
                    tasaIVA: 16,
                    montoIVA: iva
                }
            }
        });
        
    } catch (error) {
        console.error('Error en calcularTotal:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al calcular el total',
            error: error.message,
            codigo: 'ERROR_CALCULO_TOTAL'
        });
    }
};

/**
 * Validar pago (simulación)
 * POST /api/ventas/validar-pago
 */
const validarPago = async (req, res) => {
    try {
        const {
            metodoPago,
            total,
            referencia,
            ultimosDigitos,
            autorizacion,
            bancoOrigen,
            bancoFinanciamiento,
            numeroContratoFinanciamiento
        } = req.body;
        
        // Validar método de pago
        if (!metodoPago) {
            return res.status(400).json({
                success: false,
                mensaje: 'El método de pago es requerido',
                codigo: 'METODO_PAGO_REQUERIDO'
            });
        }
        
        // Validar total
        if (!total || total <= 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El total de la venta es requerido y debe ser mayor a 0',
                codigo: 'TOTAL_INVALIDO'
            });
        }
        
        // Simular validación de pago según método
        let pagoValidado = false;
        let mensajeValidacion = '';
        let codigoAutorizacion = autorizacion || `AUT-${Date.now()}`;
        
        switch (metodoPago) {
            case 'efectivo':
                pagoValidado = true;
                mensajeValidacion = 'Pago en efectivo registrado correctamente';
                break;
                
            case 'transferencia':
                if (!referencia) {
                    return res.status(400).json({
                        success: false,
                        mensaje: 'La referencia de transferencia es requerida',
                        codigo: 'REFERENCIA_REQUERIDA'
                    });
                }
                pagoValidado = true;
                mensajeValidacion = 'Transferencia validada correctamente';
                break;
                
            case 'tarjeta_credito':
            case 'tarjeta_debito':
                if (!ultimosDigitos || ultimosDigitos.length !== 4) {
                    return res.status(400).json({
                        success: false,
                        mensaje: 'Los últimos 4 dígitos de la tarjeta son requeridos',
                        codigo: 'DIGITOS_TARJETA_REQUERIDOS'
                    });
                }
                if (!autorizacion) {
                    return res.status(400).json({
                        success: false,
                        mensaje: 'El código de autorización es requerido',
                        codigo: 'AUTORIZACION_REQUERIDA'
                    });
                }
                pagoValidado = true;
                mensajeValidacion = 'Pago con tarjeta validado correctamente';
                break;
                
            case 'financiamiento':
                if (!bancoFinanciamiento) {
                    return res.status(400).json({
                        success: false,
                        mensaje: 'El banco de financiamiento es requerido',
                        codigo: 'BANCO_FINANCIAMIENTO_REQUERIDO'
                    });
                }
                pagoValidado = true;
                mensajeValidacion = 'Financiamiento aprobado correctamente';
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    mensaje: 'Método de pago no válido',
                    codigo: 'METODO_PAGO_INVALIDO'
                });
        }
        
        // Simular tiempo de procesamiento (para dar sensación real)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        res.json({
            success: true,
            validado: pagoValidado,
            mensaje: mensajeValidacion,
            datos: {
                autorizacion: codigoAutorizacion,
                fechaValidacion: new Date().toISOString(),
                metodoPago: metodoPago,
                totalValidado: total
            }
        });
        
    } catch (error) {
        console.error('Error en validarPago:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al validar el pago',
            error: error.message,
            codigo: 'ERROR_VALIDAR_PAGO'
        });
    }
};

// ============================================
// FUNCIONES CRUD PRINCIPALES
// ============================================

/**
 * Registrar una nueva venta
 * POST /api/ventas
 */
const registrarVenta = async (req, res) => {
    try {
        const {
            vehiculoId,
            cliente,
            venta,
            pago,
            contrato,
            vendedorId,
            notas
        } = req.body;
        
        // Validar campos requeridos
        const camposRequeridos = [];
        if (!vehiculoId) camposRequeridos.push('vehiculoId');
        if (!cliente?.nombre) camposRequeridos.push('cliente.nombre');
        if (!cliente?.email) camposRequeridos.push('cliente.email');
        if (!cliente?.telefono) camposRequeridos.push('cliente.telefono');
        if (!cliente?.direccion) camposRequeridos.push('cliente.direccion');
        if (!venta?.precioBase) camposRequeridos.push('venta.precioBase');
        if (!venta?.total) camposRequeridos.push('venta.total');
        if (!pago?.metodoPago) camposRequeridos.push('pago.metodoPago');
        if (!pago?.fechaPago) camposRequeridos.push('pago.fechaPago');
        if (!contrato?.numero) camposRequeridos.push('contrato.numero');
        if (!contrato?.fechaFirma) camposRequeridos.push('contrato.fechaFirma');
        
        if (camposRequeridos.length > 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'Faltan campos requeridos',
                camposFaltantes: camposRequeridos,
                codigo: 'CAMPOS_REQUERIDOS'
            });
        }
        
        // Verificar que el vehículo existe
        const vehiculo = await Vehiculo.findById(vehiculoId);
        
        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                mensaje: 'Vehículo no encontrado',
                codigo: 'VEHICULO_NO_ENCONTRADO'
            });
        }
        
        // Verificar que el vehículo no está vendido
        if (vehiculo.estado === 'vendido') {
            return res.status(400).json({
                success: false,
                mensaje: 'Este vehículo ya fue vendido',
                codigo: 'VEHICULO_YA_VENDIDO'
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cliente.email)) {
            return res.status(400).json({
                success: false,
                mensaje: 'El email del cliente no es válido',
                codigo: 'EMAIL_INVALIDO'
            });
        }
        
        // Verificar que el total calculado sea correcto
        const totalCalculado = venta.precioBase + (venta.impuestos || 0) - (venta.descuento || 0);
        if (Math.abs(venta.total - totalCalculado) > 0.01) {
            return res.status(400).json({
                success: false,
                mensaje: 'El total calculado no coincide con el total proporcionado',
                codigo: 'TOTAL_INCORRECTO',
                detalles: {
                    totalCalculado: totalCalculado,
                    totalProporcionado: venta.total,
                    diferencia: venta.total - totalCalculado
                }
            });
        }
        
        // Generar número de venta único
        const numeroVenta = await Venta.generarNumeroVenta();
        
        // Obtener información del vendedor
        let vendedorInfo = null;
        let vendedorNombre = null;
        
        if (req.usuario && req.usuario._id) {
            vendedorInfo = req.usuario._id;
            vendedorNombre = req.usuario.nombreCompleto ? req.usuario.nombreCompleto() : req.usuario.nombre;
        } else if (vendedorId) {
            const vendedor = await Usuario.findById(vendedorId);
            if (vendedor) {
                vendedorInfo = vendedorId;
                vendedorNombre = vendedor.nombreCompleto ? vendedor.nombreCompleto() : vendedor.nombre;
            }
        }
        
        // Crear la venta
        const nuevaVenta = new Venta({
            numeroVenta,
            vehiculoId,
            cliente: {
                nombre: cliente.nombre,
                email: cliente.email,
                telefono: cliente.telefono,
                direccion: cliente.direccion,
                rfc: cliente.rfc || null,
                curp: cliente.curp || null
            },
            venta: {
                precioBase: venta.precioBase,
                impuestos: venta.impuestos || (venta.precioBase * 0.16),
                descuento: venta.descuento || 0,
                total: venta.total,
                comision: venta.comision || (venta.total * 0.03)
            },
            pago: {
                metodoPago: pago.metodoPago,
                referencia: pago.referencia || null,
                bancoOrigen: pago.bancoOrigen || null,
                ultimosDigitos: pago.ultimosDigitos || null,
                autorizacion: pago.autorizacion || null,
                bancoFinanciamiento: pago.bancoFinanciamiento || null,
                numeroContratoFinanciamiento: pago.numeroContratoFinanciamiento || null,
                fechaPago: pago.fechaPago,
                moneda: pago.moneda || 'MXN',
                tipoCambio: pago.tipoCambio || 1,
                estatusPago: 'validado',
                fechaValidacion: new Date()
            },
            contrato: {
                numero: contrato.numero,
                fechaFirma: contrato.fechaFirma,
                archivoUrl: contrato.archivoUrl || null,
                nombreArchivo: contrato.nombreArchivo || null,
                terminos: contrato.terminos || 'Términos y condiciones estándar de compra-venta'
            },
            vendedorId: vendedorInfo,
            vendedorNombre: vendedorNombre,
            notas: notas || null,
            garantia: {
                tieneGarantia: true,
                mesesGarantia: 12,
                kilometrosGarantia: 20000
            },
            fechaVenta: new Date()
        });
        
        await nuevaVenta.save();
        
        // Actualizar el estado del vehículo a "vendido"
        vehiculo.estado = 'vendido';
        vehiculo.fechaVenta = new Date();
        if (vendedorInfo) {
            vehiculo.compradorId = vendedorInfo;
        }
        await vehiculo.save();
        
        // Si hay una cita relacionada, marcarla como completada
        if (req.body.citaId) {
            const cita = await Cita.findById(req.body.citaId);
            if (cita && cita.estado !== 'cancelada') {
                cita.estado = 'completada';
                await cita.save();
            }
        }
        
        // Poblar datos del vehículo para la respuesta
        const ventaCompleta = await Venta.findById(nuevaVenta._id).populate('vehiculoId');
        
        res.status(201).json({
            success: true,
            mensaje: 'Venta registrada exitosamente',
            venta: ventaCompleta,
            numeroVenta: numeroVenta,
            comprobante: {
                id: nuevaVenta._id,
                numero: numeroVenta,
                fecha: nuevaVenta.fechaVenta,
                total: nuevaVenta.venta.total,
                totalFormateado: `$${nuevaVenta.venta.total.toLocaleString()}`
            }
        });
        
    } catch (error) {
        console.error('Error en registrarVenta:', error);
        
        // Manejar error de duplicado (número de venta o contrato)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                mensaje: 'El número de venta o contrato ya existe',
                codigo: 'DUPLICADO'
            });
        }
        
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar la venta',
            error: error.message,
            codigo: 'ERROR_REGISTRAR_VENTA'
        });
    }
};

/**
 * Obtener todas las ventas (solo admin/gerente)
 * GET /api/ventas
 */
const obtenerTodasVentas = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            fechaInicio,
            fechaFin,
            metodoPago,
            vendedorId,
            clienteEmail
        } = req.query;
        
        // Construir filtro
        const filtro = { cancelada: false };
        
        if (fechaInicio || fechaFin) {
            filtro.fechaVenta = {};
            if (fechaInicio) filtro.fechaVenta.$gte = new Date(fechaInicio);
            if (fechaFin) filtro.fechaVenta.$lte = new Date(fechaFin);
        }
        
        if (metodoPago) filtro['pago.metodoPago'] = metodoPago;
        if (vendedorId) filtro.vendedorId = vendedorId;
        if (clienteEmail) filtro['cliente.email'] = clienteEmail;
        
        // Si es vendedor, solo ver sus ventas
        if (req.usuario && req.usuario.rol === 'vendedor') {
            filtro.vendedorId = req.usuario._id;
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const ventas = await Venta.find(filtro)
            .populate('vehiculoId')
            .populate('vendedorId', 'nombre email')
            .sort({ fechaVenta: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Venta.countDocuments(filtro);
        
        // Calcular totales
        const totalIngresos = await Venta.aggregate([
            { $match: filtro },
            { $group: { _id: null, total: { $sum: '$venta.total' } } }
        ]);
        
        res.json({
            success: true,
            ventas,
            resumen: {
                totalVentas: total,
                totalIngresos: totalIngresos[0]?.total || 0,
                totalIngresosFormateado: `$${(totalIngresos[0]?.total || 0).toLocaleString()}`
            },
            paginacion: {
                total,
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                limite: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Error en obtenerTodasVentas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener las ventas',
            error: error.message,
            codigo: 'ERROR_OBTENER_VENTAS'
        });
    }
};

/**
 * Obtener una venta por ID
 * GET /api/ventas/:id
 */
const obtenerVentaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const venta = await Venta.findById(id)
            .populate('vehiculoId')
            .populate('vendedorId', 'nombre email telefono');
        
        if (!venta) {
            return res.status(404).json({
                success: false,
                mensaje: 'Venta no encontrada',
                codigo: 'VENTA_NO_ENCONTRADA'
            });
        }
        
        // Verificar permisos
        if (req.usuario && req.usuario.rol === 'vendedor') {
            if (venta.vendedorId && venta.vendedorId._id.toString() !== req.usuario._id.toString()) {
                return res.status(403).json({
                    success: false,
                    mensaje: 'No tienes permiso para ver esta venta',
                    codigo: 'ACCESO_DENEGADO'
                });
            }
        }
        
        res.json({
            success: true,
            venta
        });
        
    } catch (error) {
        console.error('Error en obtenerVentaPorId:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener la venta',
            error: error.message,
            codigo: 'ERROR_OBTENER_VENTA'
        });
    }
};

/**
 * Obtener ventas del usuario actual (cliente)
 * GET /api/ventas/mis-compras
 */
const obtenerMisCompras = async (req, res) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                mensaje: 'Debes iniciar sesión para ver tus compras',
                codigo: 'NO_AUTENTICADO'
            });
        }
        
        const ventas = await Venta.find({ 'cliente.email': req.usuario.email })
            .populate('vehiculoId')
            .sort({ fechaVenta: -1 });
        
        res.json({
            success: true,
            ventas,
            total: ventas.length
        });
        
    } catch (error) {
        console.error('Error en obtenerMisCompras:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener tus compras',
            error: error.message,
            codigo: 'ERROR_MIS_COMPRAS'
        });
    }
};

/**
 * Cancelar una venta (solo admin/gerente)
 * PUT /api/ventas/:id/cancelar
 */
const cancelarVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        
        const venta = await Venta.findById(id);
        
        if (!venta) {
            return res.status(404).json({
                success: false,
                mensaje: 'Venta no encontrada',
                codigo: 'VENTA_NO_ENCONTRADA'
            });
        }
        
        if (venta.cancelada) {
            return res.status(400).json({
                success: false,
                mensaje: 'La venta ya está cancelada',
                codigo: 'VENTA_YA_CANCELADA'
            });
        }
        
        // Verificar si se puede cancelar (últimos 30 días)
        if (!venta.sePuedeCancelar) {
            return res.status(400).json({
                success: false,
                mensaje: 'Esta venta no se puede cancelar porque tiene más de 30 días',
                codigo: 'CANCELACION_NO_PERMITIDA'
            });
        }
        
        // Cancelar la venta
        venta.cancelada = true;
        venta.fechaCancelacion = new Date();
        venta.motivoCancelacion = motivo || 'Cancelación solicitada';
        venta.pago.estatusPago = 'reembolsado';
        
        await venta.save();
        
        // Devolver el vehículo a disponible
        const vehiculo = await Vehiculo.findById(venta.vehiculoId);
        if (vehiculo) {
            vehiculo.estado = 'disponible';
            vehiculo.fechaVenta = null;
            await vehiculo.save();
        }
        
        res.json({
            success: true,
            mensaje: 'Venta cancelada exitosamente',
            venta: {
                id: venta._id,
                numeroVenta: venta.numeroVenta,
                cancelada: venta.cancelada,
                fechaCancelacion: venta.fechaCancelacion,
                motivo: venta.motivoCancelacion
            }
        });
        
    } catch (error) {
        console.error('Error en cancelarVenta:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al cancelar la venta',
            error: error.message,
            codigo: 'ERROR_CANCELAR_VENTA'
        });
    }
};

/**
 * Generar factura para una venta
 * POST /api/ventas/:id/facturar
 */
const generarFactura = async (req, res) => {
    try {
        const { id } = req.params;
        
        const venta = await Venta.findById(id).populate('vehiculoId');
        
        if (!venta) {
            return res.status(404).json({
                success: false,
                mensaje: 'Venta no encontrada',
                codigo: 'VENTA_NO_ENCONTRADA'
            });
        }
        
        if (venta.cancelada) {
            return res.status(400).json({
                success: false,
                mensaje: 'No se puede facturar una venta cancelada',
                codigo: 'VENTA_CANCELADA'
            });
        }
        
        if (venta.factura && venta.factura.numero) {
            return res.status(400).json({
                success: false,
                mensaje: 'Esta venta ya tiene una factura generada',
                codigo: 'FACTURA_YA_EXISTE',
                factura: venta.factura
            });
        }
        
        // Generar factura
        const año = new Date().getFullYear();
        const numero = `FACT-${año}-${venta.numeroVenta}`;
        const uuid = require('crypto').randomBytes(16).toString('hex').toUpperCase();
        
        venta.factura = {
            numero: numero,
            serie: 'A',
            fechaEmision: new Date(),
            uuid: uuid
        };
        
        await venta.save();
        
        res.json({
            success: true,
            mensaje: 'Factura generada exitosamente',
            factura: venta.factura,
            datosFactura: {
                emisor: 'RPM Auto and Service',
                rfcEmisor: 'RPM123456789',
                receptor: venta.cliente,
                concepto: `${venta.vehiculoId.marca} ${venta.vehiculoId.modelo} ${venta.vehiculoId.año}`,
                subtotal: venta.venta.precioBase,
                iva: venta.venta.impuestos,
                total: venta.venta.total
            }
        });
        
    } catch (error) {
        console.error('Error en generarFactura:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al generar la factura',
            error: error.message,
            codigo: 'ERROR_GENERAR_FACTURA'
        });
    }
};

// ============================================
// FUNCIONES DE ESTADÍSTICAS Y REPORTES
// ============================================

/**
 * Obtener estadísticas de ventas
 * GET /api/ventas/estadisticas
 */
const obtenerEstadisticasVentas = async (req, res) => {
    try {
        const estadisticas = await Venta.obtenerEstadisticas();
        
        // Agregar ventas del día
        const ventasHoy = await Venta.ventasDelDia();
        const totalHoy = ventasHoy.reduce((sum, v) => sum + v.venta.total, 0);
        
        // Ventas del mes actual
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);
        
        const ventasMes = await Venta.find({
            fechaVenta: { $gte: inicioMes },
            cancelada: false
        });
        
        const totalMes = ventasMes.reduce((sum, v) => sum + v.venta.total, 0);
        
        res.json({
            success: true,
            estadisticas: {
                ...estadisticas,
                ventasHoy: {
                    cantidad: ventasHoy.length,
                    total: totalHoy,
                    totalFormateado: `$${totalHoy.toLocaleString()}`
                },
                ventasMes: {
                    cantidad: ventasMes.length,
                    total: totalMes,
                    totalFormateado: `$${totalMes.toLocaleString()}`
                }
            }
        });
        
    } catch (error) {
        console.error('Error en obtenerEstadisticasVentas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener estadísticas',
            error: error.message,
            codigo: 'ERROR_ESTADISTICAS'
        });
    }
};

/**
 * Obtener ventas por vendedor
 * GET /api/ventas/por-vendedor/:vendedorId
 */
const obtenerVentasPorVendedor = async (req, res) => {
    try {
        const { vendedorId } = req.params;
        const { fechaInicio, fechaFin } = req.query;
        
        const filtro = { vendedorId: vendedorId, cancelada: false };
        
        if (fechaInicio || fechaFin) {
            filtro.fechaVenta = {};
            if (fechaInicio) filtro.fechaVenta.$gte = new Date(fechaInicio);
            if (fechaFin) filtro.fechaVenta.$lte = new Date(fechaFin);
        }
        
        const ventas = await Venta.find(filtro)
            .populate('vehiculoId')
            .sort({ fechaVenta: -1 });
        
        const totalVentas = ventas.length;
        const totalIngresos = ventas.reduce((sum, v) => sum + v.venta.total, 0);
        const totalComisiones = ventas.reduce((sum, v) => sum + (v.venta.comision || 0), 0);
        
        const vendedor = await Usuario.findById(vendedorId);
        
        res.json({
            success: true,
            vendedor: vendedor ? {
                id: vendedor._id,
                nombre: vendedor.nombreCompleto ? vendedor.nombreCompleto() : vendedor.nombre,
                email: vendedor.email
            } : null,
            resumen: {
                totalVentas,
                totalIngresos,
                totalIngresosFormateado: `$${totalIngresos.toLocaleString()}`,
                totalComisiones,
                totalComisionesFormateado: `$${totalComisiones.toLocaleString()}`
            },
            ventas
        });
        
    } catch (error) {
        console.error('Error en obtenerVentasPorVendedor:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener ventas por vendedor',
            error: error.message,
            codigo: 'ERROR_VENTAS_VENDEDOR'
        });
    }
};

/**
 * Exportar ventas a CSV (simulado)
 * GET /api/ventas/exportar
 */
const exportarVentasCSV = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        
        const filtro = { cancelada: false };
        
        if (fechaInicio || fechaFin) {
            filtro.fechaVenta = {};
            if (fechaInicio) filtro.fechaVenta.$gte = new Date(fechaInicio);
            if (fechaFin) filtro.fechaVenta.$lte = new Date(fechaFin);
        }
        
        const ventas = await Venta.find(filtro)
            .populate('vehiculoId')
            .sort({ fechaVenta: -1 });
        
        // Crear cabeceras CSV
        const cabeceras = [
            'Número Venta',
            'Fecha Venta',
            'Cliente',
            'Email Cliente',
            'Vehículo',
            'Precio Base',
            'IVA',
            'Descuento',
            'Total',
            'Método Pago',
            'Número Contrato',
            'Vendedor'
        ];
        
        // Crear filas
        const filas = ventas.map(venta => [
            venta.numeroVenta,
            venta.fechaVenta.toISOString().split('T')[0],
            venta.cliente.nombre,
            venta.cliente.email,
            `${venta.vehiculoId?.marca || ''} ${venta.vehiculoId?.modelo || ''}`,
            venta.venta.precioBase,
            venta.venta.impuestos,
            venta.venta.descuento,
            venta.venta.total,
            venta.pago.metodoPago,
            venta.contrato.numero,
            venta.vendedorNombre || ''
        ]);
        
        // Generar CSV
        const csvContent = [
            cabeceras.join(','),
            ...filas.map(fila => fila.map(celda => `"${celda}"`).join(','))
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=ventas_${new Date().toISOString().split('T')[0]}.csv`);
        
        res.send(csvContent);
        
    } catch (error) {
        console.error('Error en exportarVentasCSV:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al exportar ventas',
            error: error.message,
            codigo: 'ERROR_EXPORTAR'
        });
    }
};

// ============================================
// EXPORTAR TODAS LAS FUNCIONES
// ============================================

module.exports = {
    // Cálculos y validaciones
    calcularTotal,
    validarPago,
    
    // CRUD principal
    registrarVenta,
    obtenerTodasVentas,
    obtenerVentaPorId,
    obtenerMisCompras,
    cancelarVenta,
    generarFactura,
    
    // Estadísticas y reportes
    obtenerEstadisticasVentas,
    obtenerVentasPorVendedor,
    exportarVentasCSV
};