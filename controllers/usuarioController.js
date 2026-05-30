// controllers/usuarioController.js - Controlador de Usuarios
const Usuario = require('../models/Usuario');

// Registrar usuario
const register = async (req, res) => {
    try {
        const { nombre, email, password, telefono } = req.body;
        
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                mensaje: 'El email ya está registrado'
            });
        }
        
        const nuevoUsuario = new Usuario({
            nombre,
            email,
            password,
            telefono,
            rol: 'cliente'
        });
        
        await nuevoUsuario.save();
        
        const token = Buffer.from(`${nuevoUsuario._id}:${Date.now()}`).toString('base64');
        
        res.status(201).json({
            success: true,
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: nuevoUsuario.obtenerResumen()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar usuario',
            error: error.message
        });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const usuario = await Usuario.findOne({ email }).select('+password');
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                mensaje: 'Credenciales incorrectas'
            });
        }
        
        if (usuario.password !== password) {
            await usuario.registrarIntentoFallido();
            return res.status(401).json({
                success: false,
                mensaje: 'Credenciales incorrectas'
            });
        }
        
        await usuario.reiniciarIntentosFallidos();
        await usuario.registrarAcceso(req.ip);
        
        const token = Buffer.from(`${usuario._id}:${Date.now()}`).toString('base64');
        
        res.json({
            success: true,
            mensaje: 'Login exitoso',
            token,
            usuario: usuario.obtenerResumen()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

// Obtener perfil
const obtenerPerfil = async (req, res) => {
    res.json({
        success: true,
        usuario: req.usuario.obtenerResumen()
    });
};

// Actualizar perfil
const actualizarPerfil = async (req, res) => {
    try {
        const { nombre, telefono, direccion } = req.body;
        
        if (nombre) req.usuario.nombre = nombre;
        if (telefono) req.usuario.telefono = telefono;
        if (direccion) req.usuario.direccion = direccion;
        
        await req.usuario.save();
        
        res.json({
            success: true,
            mensaje: 'Perfil actualizado',
            usuario: req.usuario.obtenerResumen()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar perfil',
            error: error.message
        });
    }
};

// Cambiar contraseña
const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, nuevaPassword } = req.body;
        
        const usuario = await Usuario.findById(req.usuario._id).select('+password');
        
        if (usuario.password !== passwordActual) {
            return res.status(401).json({
                success: false,
                mensaje: 'Contraseña actual incorrecta'
            });
        }
        
        usuario.password = nuevaPassword;
        await usuario.save();
        
        res.json({
            success: true,
            mensaje: 'Contraseña cambiada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

// Recuperar password (solicitar token)
const recuperarPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const usuario = await Usuario.findOne({ email });
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }
        
        const token = usuario.generarTokenRecuperacion();
        await usuario.save();
        
        // En producción, enviar email con el token
        res.json({
            success: true,
            mensaje: 'Token de recuperación generado',
            token: token // Solo para desarrollo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al generar recuperación',
            error: error.message
        });
    }
};

// Reset password (usar token)
const resetPassword = async (req, res) => {
    try {
        const { token, nuevaPassword } = req.body;
        
        const usuario = await Usuario.findOne({
            tokenRecuperacion: token,
            tokenRecuperacionExpiracion: { $gt: new Date() }
        });
        
        if (!usuario) {
            return res.status(400).json({
                success: false,
                mensaje: 'Token inválido o expirado'
            });
        }
        
        usuario.password = nuevaPassword;
        usuario.tokenRecuperacion = null;
        usuario.tokenRecuperacionExpiracion = null;
        await usuario.save();
        
        res.json({
            success: true,
            mensaje: 'Contraseña restablecida exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al restablecer contraseña',
            error: error.message
        });
    }
};

// Obtener todos los usuarios (solo admin)
const obtenerTodosUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password');
        res.json({ success: true, usuarios });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

// Obtener usuario por ID
const obtenerUsuarioPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('-password');
        if (!usuario) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }
        res.json({ success: true, usuario });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener usuario',
            error: error.message
        });
    }
};

// Actualizar usuario (admin)
const actualizarUsuario = async (req, res) => {
    try {
        const { rol, activo } = req.body;
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            { rol, activo },
            { new: true }
        ).select('-password');
        
        res.json({
            success: true,
            mensaje: 'Usuario actualizado',
            usuario
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar usuario',
            error: error.message
        });
    }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
    try {
        await Usuario.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            mensaje: 'Usuario eliminado'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar usuario',
            error: error.message
        });
    }
};

// Cambiar rol
const cambiarRol = async (req, res) => {
    try {
        const { rol } = req.body;
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            { rol },
            { new: true }
        ).select('-password');
        
        res.json({
            success: true,
            mensaje: `Rol cambiado a ${rol}`,
            usuario
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al cambiar rol',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    obtenerPerfil,
    actualizarPerfil,
    cambiarPassword,
    recuperarPassword,
    resetPassword,
    obtenerTodosUsuarios,
    obtenerUsuarioPorId,
    actualizarUsuario,
    eliminarUsuario,
    cambiarRol
};