// ============================================
// middleware/auth.js - Middleware de Autenticación y Autorización
// ============================================
// Este archivo contiene funciones que se ejecutan ANTES de llegar a las rutas
// Su propósito es verificar quién está haciendo la petición y si tiene permisos
// ============================================

const Usuario = require('../models/Usuario');

// ============================================
// 1. MIDDLEWARE DE AUTENTICACIÓN BÁSICA
// ============================================
// Verifica que el usuario haya iniciado sesión
// Se usa en rutas protegidas (ej: perfil, crear venta, etc.)

const autenticar = async (req, res, next) => {
    try {
        // Obtener el token del header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                mensaje: 'No estás autenticado. Por favor inicia sesión.',
                codigo: 'NO_TOKEN'
            });
        }

        // El token viene como "Bearer <token>"
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                mensaje: 'Token no válido o mal formado',
                codigo: 'TOKEN_INVALIDO'
            });
        }

        // Decodificar el token (simple, para principiantes)
        // En producción usar JWT (jsonwebtoken)
        const tokenDecodificado = Buffer.from(token, 'base64').toString();
        const [usuarioId, timestamp] = tokenDecodificado.split(':');
        
        if (!usuarioId) {
            return res.status(401).json({ 
                mensaje: 'Token inválido',
                codigo: 'TOKEN_INVALIDO'
            });
        }

        // Buscar el usuario en la base de datos
        const usuario = await Usuario.findById(usuarioId);
        
        if (!usuario) {
            return res.status(401).json({ 
                mensaje: 'Usuario no encontrado. Por favor inicia sesión nuevamente.',
                codigo: 'USUARIO_NO_ENCONTRADO'
            });
        }

        // Verificar si la cuenta está activa
        if (!usuario.activo) {
            return res.status(401).json({ 
                mensaje: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
                codigo: 'CUENTA_INACTIVA'
            });
        }

        // Verificar si la cuenta está bloqueada
        if (usuario.estaBloqueada && usuario.estaBloqueada()) {
            return res.status(401).json({ 
                mensaje: 'Tu cuenta está temporalmente bloqueada. Intenta más tarde.',
                codigo: 'CUENTA_BLOQUEADA'
            });
        }

        // Guardar el usuario en la request para usarlo en las rutas
        req.usuario = usuario;
        req.usuarioId = usuario._id;
        
        // Continuar con la siguiente función (la ruta)
        next();
        
    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(500).json({ 
            mensaje: 'Error al verificar autenticación',
            codigo: 'ERROR_AUTENTICACION'
        });
    }
};

// ============================================
// 2. MIDDLEWARE DE AUTENTICACIÓN OPCIONAL
// ============================================
// Verifica si hay usuario, pero no requiere que esté autenticado
// Útil para páginas que pueden mostrar más información si hay sesión

const autenticacionOpcional = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (token) {
                const tokenDecodificado = Buffer.from(token, 'base64').toString();
                const [usuarioId] = tokenDecodificado.split(':');
                
                if (usuarioId) {
                    const usuario = await Usuario.findById(usuarioId);
                    if (usuario && usuario.activo) {
                        req.usuario = usuario;
                        req.usuarioId = usuario._id;
                    }
                }
            }
        }
        
        next();
    } catch (error) {
        // Si hay error, simplemente continuamos sin usuario
        next();
    }
};

// ============================================
// 3. MIDDLEWARE DE AUTORIZACIÓN POR ROL
// ============================================
// Verifica que el usuario tenga un rol específico
// Se usa después de autenticar

const autorizarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        // Verificar que el usuario existe (debe haber pasado por autenticar)
        if (!req.usuario) {
            return res.status(401).json({ 
                mensaje: 'Debes iniciar sesión para acceder a este recurso',
                codigo: 'NO_AUTENTICADO'
            });
        }

        // Verificar si el rol del usuario está permitido
        if (rolesPermitidos.includes(req.usuario.rol)) {
            next(); // Sí tiene permiso, continuar
        } else {
            return res.status(403).json({ 
                mensaje: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(', ')}`,
                codigo: 'ACCESO_DENEGADO',
                tuRol: req.usuario.rol
            });
        }
    };
};

// ============================================
// 4. MIDDLEWARE DE AUTORIZACIÓN POR PERMISO
// ============================================
// Verifica que el usuario tenga un permiso específico
// Más granular que los roles

const autorizarPermiso = (permisoRequerido) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ 
                mensaje: 'Debes iniciar sesión para acceder a este recurso',
                codigo: 'NO_AUTENTICADO'
            });
        }

        // Los administradores tienen todos los permisos
        if (req.usuario.rol === 'admin') {
            return next();
        }

        // Verificar si el usuario tiene el permiso específico
        if (req.usuario.tienePermiso && req.usuario.tienePermiso(permisoRequerido)) {
            next();
        } else {
            return res.status(403).json({ 
                mensaje: `No tienes permiso para realizar esta acción: ${permisoRequerido}`,
                codigo: 'PERMISO_DENEGADO'
            });
        }
    };
};

// ============================================
// 5. MIDDLEWARE PARA VERIFICAR PROPIETARIO
// ============================================
// Verifica que el usuario sea el dueño del recurso (ej: su propio perfil)
// Útil para que los usuarios solo puedan modificar sus propios datos

const verificarPropietario = (getResourceId) => {
    return async (req, res, next) => {
        try {
            if (!req.usuario) {
                return res.status(401).json({ 
                    mensaje: 'Debes iniciar sesión',
                    codigo: 'NO_AUTENTICADO'
                });
            }

            // Los administradores pueden acceder a todo
            if (req.usuario.rol === 'admin') {
                return next();
            }

            // Obtener el ID del recurso (ej: de req.params, req.body, etc.)
            const resourceId = getResourceId(req);
            
            // Si el ID del recurso coincide con el ID del usuario, es propietario
            if (resourceId && resourceId.toString() === req.usuario._id.toString()) {
                return next();
            }

            // Si no es admin ni propietario, denegar acceso
            return res.status(403).json({ 
                mensaje: 'No tienes permiso para modificar este recurso',
                codigo: 'NO_PROPIETARIO'
            });
            
        } catch (error) {
            console.error('Error al verificar propietario:', error);
            return res.status(500).json({ 
                mensaje: 'Error al verificar permisos',
                codigo: 'ERROR_VERIFICACION'
            });
        }
    };
};

// ============================================
// 6. MIDDLEWARE PARA VERIFICAR QUE ES ADMIN
// ============================================
// Versión simplificada para solo verificar admin

const esAdmin = async (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ 
                mensaje: 'Debes iniciar sesión',
                codigo: 'NO_AUTENTICADO'
            });
        }

        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({ 
                mensaje: 'Acceso denegado. Se requiere rol de administrador',
                codigo: 'ACCESO_DENEGADO'
            });
        }

        next();
    } catch (error) {
        console.error('Error en esAdmin:', error);
        return res.status(500).json({ 
            mensaje: 'Error al verificar permisos de administrador',
            codigo: 'ERROR_ADMIN'
        });
    }
};

// ============================================
// 7. MIDDLEWARE PARA VERIFICAR QUE ES VENDEDOR O ADMIN
// ============================================

const esVendedorOAdmin = async (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ 
                mensaje: 'Debes iniciar sesión',
                codigo: 'NO_AUTENTICADO'
            });
        }

        if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'vendedor' && req.usuario.rol !== 'gerente') {
            return res.status(403).json({ 
                mensaje: 'Acceso denegado. Se requiere rol de vendedor o administrador',
                codigo: 'ACCESO_DENEGADO'
            });
        }

        next();
    } catch (error) {
        console.error('Error en esVendedorOAdmin:', error);
        return res.status(500).json({ 
            mensaje: 'Error al verificar permisos',
            codigo: 'ERROR_VERIFICACION'
        });
    }
};

// ============================================
// 8. MIDDLEWARE PARA VERIFICAR CLIENTE O PROPIETARIO
// ============================================

const esClienteOAdmin = async (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ 
                mensaje: 'Debes iniciar sesión',
                codigo: 'NO_AUTENTICADO'
            });
        }

        if (req.usuario.rol === 'admin') {
            return next();
        }

        // Para rutas que tienen email en la query o params
        const emailRecurso = req.query.email || req.params.email;
        
        if (emailRecurso && emailRecurso === req.usuario.email) {
            return next();
        }

        if (req.usuario.rol === 'cliente') {
            return next();
        }

        return res.status(403).json({ 
            mensaje: 'Acceso denegado',
            codigo: 'ACCESO_DENEGADO'
        });
        
    } catch (error) {
        console.error('Error en esClienteOAdmin:', error);
        return res.status(500).json({ 
            mensaje: 'Error al verificar permisos',
            codigo: 'ERROR_VERIFICACION'
        });
    }
};

// ============================================
// 9. FUNCIÓN PARA GENERAR TOKEN (utilidad)
// ============================================
// Esta función se usa en el login para crear el token

const generarToken = (usuarioId) => {
    // Token simple (solo para desarrollo)
    // En producción usar JWT
    const token = Buffer.from(`${usuarioId}:${Date.now()}`).toString('base64');
    return token;
};

// ============================================
// 10. VALIDACIÓN DE DATOS DE ENTRADA (OPCIONAL)
// ============================================

// Middleware para validar que los campos requeridos estén presentes
const validarCampos = (camposRequeridos) => {
    return (req, res, next) => {
        const camposFaltantes = [];
        
        for (const campo of camposRequeridos) {
            // Soporta campos anidados con punto: "cliente.nombre"
            const valor = campo.split('.').reduce((obj, key) => obj?.[key], req.body);
            
            if (!valor || valor === '') {
                camposFaltantes.push(campo);
            }
        }
        
        if (camposFaltantes.length > 0) {
            return res.status(400).json({
                mensaje: 'Faltan campos requeridos',
                camposFaltantes: camposFaltantes,
                codigo: 'CAMPOS_REQUERIDOS'
            });
        }
        
        next();
    };
};

// ============================================
// 11. LIMITADOR DE TASA (RATE LIMITING) SIMPLE
// ============================================
// Evita que un usuario haga muchas peticiones en poco tiempo

const rateLimiter = (maxPeticiones = 100, ventanaMs = 15 * 60 * 1000) => {
    const peticiones = new Map();
    
    return (req, res, next) => {
        // Identificador único (IP o usuario)
        const identificador = req.usuarioId || req.ip;
        const ahora = Date.now();
        
        if (!peticiones.has(identificador)) {
            peticiones.set(identificador, []);
        }
        
        const timestamps = peticiones.get(identificador);
        
        // Limpiar timestamps viejos
        while (timestamps.length > 0 && timestamps[0] < ahora - ventanaMs) {
            timestamps.shift();
        }
        
        // Verificar límite
        if (timestamps.length >= maxPeticiones) {
            return res.status(429).json({
                mensaje: 'Demasiadas peticiones. Por favor espera un momento.',
                codigo: 'RATE_LIMIT_EXCEDIDO',
                limite: maxPeticiones,
                ventanaSegundos: ventanaMs / 1000
            });
        }
        
        timestamps.push(ahora);
        next();
    };
};

// ============================================
// 12. LOGGER DE PETICIONES (para desarrollo)
// ============================================

const loggerPeticiones = (req, res, next) => {
    const inicio = Date.now();
    
    // Registrar cuando la respuesta termine
    res.on('finish', () => {
        const duracion = Date.now() - inicio;
        const metodo = req.method;
        const url = req.url;
        const status = res.statusCode;
        const usuario = req.usuario ? `${req.usuario.email} (${req.usuario.rol})` : 'No autenticado';
        
        console.log(`[${new Date().toISOString()}] ${metodo} ${url} - ${status} - ${duracion}ms - Usuario: ${usuario}`);
    });
    
    next();
};

// ============================================
// EXPORTAR TODOS LOS MIDDLEWARES
// ============================================

module.exports = {
    // Middlewares principales
    autenticar,
    autenticacionOpcional,
    
    // Middlewares de autorización
    autorizarRol,
    autorizarPermiso,
    verificarPropietario,
    esAdmin,
    esVendedorOAdmin,
    esClienteOAdmin,
    
    // Utilidades
    generarToken,
    validarCampos,
    rateLimiter,
    loggerPeticiones
};