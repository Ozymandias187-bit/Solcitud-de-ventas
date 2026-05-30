// routes/usuarioRoutes.js - Rutas de usuarios
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { autenticar, esAdmin } = require('../middleware/auth');

// Rutas públicas
router.post('/register', usuarioController.register);
router.post('/login', usuarioController.login);
router.post('/recuperar-password', usuarioController.recuperarPassword);
router.post('/reset-password', usuarioController.resetPassword);

// Rutas protegidas (requieren autenticación)
router.get('/perfil', autenticar, usuarioController.obtenerPerfil);
router.put('/perfil', autenticar, usuarioController.actualizarPerfil);
router.put('/cambiar-password', autenticar, usuarioController.cambiarPassword);

// Rutas solo para administradores
router.get('/', autenticar, esAdmin, usuarioController.obtenerTodosUsuarios);
router.get('/:id', autenticar, esAdmin, usuarioController.obtenerUsuarioPorId);
router.put('/:id', autenticar, esAdmin, usuarioController.actualizarUsuario);
router.delete('/:id', autenticar, esAdmin, usuarioController.eliminarUsuario);
router.put('/:id/rol', autenticar, esAdmin, usuarioController.cambiarRol);

module.exports = router;