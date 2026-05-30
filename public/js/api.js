// ============================================
// api.js - Peticiones al servidor (backend)
// ============================================
// Este archivo contiene funciones reutilizables
// para comunicarse con el servidor Node.js
// ============================================

// Configuración básica
const API_URL = 'http://localhost:3000/api';  // Cambia el puerto si usas otro

// ============================================
// FUNCIÓN GENÉRICA PARA PETICIONES
// ============================================
// Esta función se usa por dentro, no la llamas directamente desde los botones
async function peticionHTTP(url, metodo = 'GET', datos = null) {
    // Opciones básicas de la petición
    const opciones = {
        method: metodo,  // GET, POST, PUT, DELETE
        headers: {
            'Content-Type': 'application/json'  // Decimos que enviamos JSON
        }
    };

    // Si hay datos para enviar (en POST o PUT), los añadimos al cuerpo
    if (datos) {
        opciones.body = JSON.stringify(datos);  // Convertir objeto a texto JSON
    }

    // Obtener el token de autenticación si existe (sesión del usuario)
    const token = localStorage.getItem('token');
    if (token) {
        opciones.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        // Hacer la petición al servidor
        const respuesta = await fetch(`${API_URL}${url}`, opciones);
        
        // Intentar convertir la respuesta a JSON
        let datosRespuesta;
        const textoRespuesta = await respuesta.text();
        
        try {
            datosRespuesta = JSON.parse(textoRespuesta);
        } catch (e) {
            datosRespuesta = { mensaje: textoRespuesta || 'Respuesta vacía' };
        }

        // Si la respuesta no es exitosa (error 400, 500, etc.)
        if (!respuesta.ok) {
            throw new Error(datosRespuesta.mensaje || `Error ${respuesta.status}: ${respuesta.statusText}`);
        }

        return datosRespuesta;

    } catch (error) {
        console.error('Error en petición HTTP:', error);
        throw error;  // Re-lanzamos el error para que quien llamó lo maneje
    }
}

// ============================================
// FUNCIONES PARA VEHÍCULOS
// ============================================

// Obtener todos los vehículos (catálogo)
async function obtenerVehiculos() {
    return await peticionHTTP('/vehiculos');
}

// Obtener un solo vehículo por su ID
async function obtenerVehiculoPorId(id) {
    return await peticionHTTP(`/vehiculos/${id}`);
}

// ============================================
// FUNCIONES PARA CITAS
// ============================================

// Obtener horarios disponibles para una fecha específica
async function obtenerHorariosDisponibles(fecha) {
    return await peticionHTTP(`/citas/horarios-disponibles?fecha=${fecha}`);
}

// Crear una nueva cita
async function crearCita(datosCita) {
    return await peticionHTTP('/citas', 'POST', datosCita);
}

// Obtener las citas del usuario actual
async function obtenerMisCitas() {
    return await peticionHTTP('/citas/mis-citas');
}

// Cancelar una cita
async function cancelarCita(idCita) {
    return await peticionHTTP(`/citas/${idCita}`, 'DELETE');
}

// ============================================
// FUNCIONES PARA VENTAS
// ============================================

// Calcular total de una venta (precio + impuestos)
async function calcularTotal(vehiculoId) {
    return await peticionHTTP(`/ventas/calcular-total/${vehiculoId}`);
}

// Registrar una nueva venta
async function registrarVenta(datosVenta) {
    return await peticionHTTP('/ventas', 'POST', datosVenta);
}

// Validar un pago (simulado)
async function validarPago(datosPago) {
    return await peticionHTTP('/ventas/validar-pago', 'POST', datosPago);
}

// ============================================
// FUNCIONES PARA USUARIOS (AUTENTICACIÓN)
// ============================================

// Iniciar sesión
async function iniciarSesion(email, password) {
    const respuesta = await peticionHTTP('/auth/login', 'POST', { email, password });
    // Guardar el token en localStorage si el login fue exitoso
    if (respuesta.token) {
        localStorage.setItem('token', respuesta.token);
        localStorage.setItem('usuario', JSON.stringify(respuesta.usuario));
    }
    return respuesta;
}

// Registrar un nuevo usuario
async function registrarUsuario(datosUsuario) {
    const respuesta = await peticionHTTP('/auth/register', 'POST', datosUsuario);
    // Guardar el token automáticamente después del registro
    if (respuesta.token) {
        localStorage.setItem('token', respuesta.token);
        localStorage.setItem('usuario', JSON.stringify(respuesta.usuario));
    }
    return respuesta;
}

// Cerrar sesión (solo borra datos locales)
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
}

// Obtener el usuario actual (si está logueado)
function obtenerUsuarioActual() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

// Verificar si el usuario está autenticado
function estaAutenticado() {
    return localStorage.getItem('token') !== null;
}
