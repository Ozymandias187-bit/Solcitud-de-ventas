// routes/ventaRoutes.js - Rutas de ventas
const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const { autenticar, esAdmin, esVendedorOAdmin } = require('../middleware/auth');

// Rutas públicas (con autenticación opcional para cálculo)
router.get('/calcular-total/:vehiculoId', ventaController.calcularTotal);
router.post('/validar-pago', ventaController.validarPago);

// Rutas protegidas (requieren autenticación)
router.post('/', autenticar, esVendedorOAdmin, ventaController.registrarVenta);
router.get('/mis-compras', autenticar, ventaController.obtenerMisCompras);
router.get('/estadisticas', autenticar, esAdmin, ventaController.obtenerEstadisticasVentas);
router.get('/exportar', autenticar, esAdmin, ventaController.exportarVentasCSV);
router.get('/por-vendedor/:vendedorId', autenticar, esAdmin, ventaController.obtenerVentasPorVendedor);
router.get('/', autenticar, esVendedorOAdmin, ventaController.obtenerTodasVentas);
router.get('/:id', autenticar, ventaController.obtenerVentaPorId);
router.put('/:id/cancelar', autenticar, esAdmin, ventaController.cancelarVenta);
router.post('/:id/facturar', autenticar, esVendedorOAdmin, ventaController.generarFactura);

module.exports = router;