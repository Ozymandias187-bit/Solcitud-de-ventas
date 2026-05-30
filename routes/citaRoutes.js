// routes/citaRoutes.js - Rutas de citas
const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');
const { autenticar, esAdmin } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.get('/horarios-disponibles', citaController.obtenerHorariosDisponibles);
router.post('/', citaController.crearCita);

// Rutas protegidas (requieren autenticación)
router.get('/mis-citas', autenticar, citaController.obtenerMisCitas);
router.get('/estadisticas', autenticar, esAdmin, citaController.obtenerEstadisticasCitas);
router.get('/', autenticar, esAdmin, citaController.obtenerTodasCitas);
router.get('/:id', autenticar, citaController.obtenerCitaPorId);
router.put('/:id', autenticar, citaController.actualizarCita);
router.delete('/:id', autenticar, citaController.cancelarCita);
router.put('/:id/confirmar', autenticar, esAdmin, citaController.confirmarCita);
router.put('/:id/completar', autenticar, esAdmin, citaController.completarCita);

module.exports = router;