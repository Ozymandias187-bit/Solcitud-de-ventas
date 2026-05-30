// routes/vehiculoRoutes.js - Rutas de vehículos
const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');
const { autenticar, esAdmin, esVendedorOAdmin } = require('../middleware/auth');

// Rutas públicas (cualquiera puede ver los vehículos)
router.get('/', vehiculoController.obtenerTodosVehiculos);
router.get('/disponibles', vehiculoController.obtenerVehiculosDisponibles);
router.get('/buscar', vehiculoController.buscarVehiculos);
router.get('/marcas', vehiculoController.obtenerMarcas);
router.get('/estadisticas', vehiculoController.obtenerEstadisticas);
router.get('/:id', vehiculoController.obtenerVehiculoPorId);

// Rutas protegidas (solo admin o vendedor pueden modificar)
router.post('/', autenticar, esVendedorOAdmin, vehiculoController.crearVehiculo);
router.put('/:id', autenticar, esVendedorOAdmin, vehiculoController.actualizarVehiculo);
router.delete('/:id', autenticar, esAdmin, vehiculoController.eliminarVehiculo);
router.patch('/:id/estado', autenticar, esVendedorOAdmin, vehiculoController.cambiarEstado);

module.exports = router;