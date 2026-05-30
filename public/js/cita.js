// ============================================
// citas.js - Lógica para agendar y gestionar citas
// ============================================
// Este archivo controla el formulario de agendar cita
// y se conecta con api.js para enviar datos al servidor
// ============================================

// Esperar a que el HTML esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // 1. OBTENER REFERENCIAS A LOS ELEMENTOS DEL FORMULARIO
    // ============================================
    const formulario = document.getElementById('agendarCitaForm');
    const selectVehiculo = document.getElementById('vehiculoId');
    const selectTipoCita = document.getElementById('tipoCita');
    const inputFecha = document.getElementById('fecha');
    const selectHora = document.getElementById('hora');
    const inputNombre = document.getElementById('nombreCliente');
    const inputEmail = document.getElementById('emailCliente');
    const inputTelefono = document.getElementById('telefonoCliente');
    const btnSubmit = document.getElementById('submitBtn');
    const mensajeError = document.getElementById('mensajeError');
    const mensajeExito = document.getElementById('mensajeExito');
    
    // ============================================
    // 2. CONFIGURAR FECHA MÍNIMA (NO PERMITIR FECHAS PASADAS)
    // ============================================
    function configurarFechaMinima() {
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        const fechaMinima = `${año}-${mes}-${dia}`;
        inputFecha.min = fechaMinima;
    }
    
    // ============================================
    // 3. CARGAR LISTA DE VEHÍCULOS DESDE EL SERVIDOR
    // ============================================
    async function cargarVehiculos() {
        try {
            // Mostrar mensaje de carga
            selectVehiculo.innerHTML = '<option value="">Cargando vehículos...</option>';
            
            // Llamar a la función de api.js
            const vehiculos = await obtenerVehiculos();
            
            // Limpiar y agregar opción por defecto
            selectVehiculo.innerHTML = '<option value="">-- Selecciona un vehículo --</option>';
            
            // Verificar si hay vehículos
            if (!vehiculos || vehiculos.length === 0) {
                selectVehiculo.innerHTML = '<option value="">No hay vehículos disponibles</option>';
                return;
            }
            
            // Agregar cada vehículo como una opción
            vehiculos.forEach(vehiculo => {
                const option = document.createElement('option');
                option.value = vehiculo._id || vehiculo.id;
                option.textContent = `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.año} - $${vehiculo.precio}`;
                selectVehiculo.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error al cargar vehículos:', error);
            selectVehiculo.innerHTML = '<option value="">Error al cargar vehículos</option>';
            mostrarMensajeError('No se pudieron cargar los vehículos. Intenta recargar la página.');
        }
    }
    
    // ============================================
    // 4. CARGAR DATOS DEL USUARIO AUTENTICADO
    // ============================================
    function cargarDatosUsuario() {
        const usuario = obtenerUsuarioActual();
        
        if (usuario) {
            // Usuario logueado - llenar campos automáticamente
            if (inputNombre) inputNombre.value = usuario.nombre || '';
            if (inputEmail) inputEmail.value = usuario.email || '';
            
            // Hacer los campos de solo lectura (no se pueden editar)
            if (inputNombre) inputNombre.readOnly = true;
            if (inputEmail) inputEmail.readOnly = true;
            
        } else {
            // Usuario NO logueado - campos vacíos y editables
            if (inputNombre) {
                inputNombre.value = '';
                inputNombre.readOnly = false;
                inputNombre.placeholder = 'Ingresa tu nombre completo';
            }
            if (inputEmail) {
                inputEmail.value = '';
                inputEmail.readOnly = false;
                inputEmail.placeholder = 'Ingresa tu correo electrónico';
            }
        }
    }
    
    // ============================================
    // 5. CARGAR HORARIOS DISPONIBLES SEGÚN FECHA SELECCIONADA
    // ============================================
    async function cargarHorariosDisponibles(fecha) {
        if (!fecha) {
            selectHora.innerHTML = '<option value="">-- Primero selecciona una fecha --</option>';
            return;
        }
        
        try {
            // Mostrar carga
            selectHora.innerHTML = '<option value="">Cargando horarios...</option>';
            selectHora.disabled = true;
            
            // Llamar a la función de api.js
            const horarios = await obtenerHorariosDisponibles(fecha);
            
            // Limpiar y agregar opción por defecto
            selectHora.innerHTML = '<option value="">-- Selecciona una hora --</option>';
            
            // Verificar si hay horarios disponibles
            if (!horarios || horarios.length === 0) {
                selectHora.innerHTML = '<option value="">No hay horarios disponibles para esta fecha</option>';
                return;
            }
            
            // Agregar cada horario como opción
            horarios.forEach(horario => {
                const option = document.createElement('option');
                option.value = horario;
                option.textContent = horario;
                selectHora.appendChild(option);
            });
            
            selectHora.disabled = false;
            
        } catch (error) {
            console.error('Error al cargar horarios:', error);
            selectHora.innerHTML = '<option value="">Error al cargar horarios</option>';
            mostrarMensajeError('No se pudieron cargar los horarios disponibles.');
        }
    }
    
    // ============================================
    // 6. MOSTRAR MENSAJES DE ERROR O ÉXITO
    // ============================================
    function mostrarMensajeError(mensaje) {
        if (mensajeError) {
            mensajeError.textContent = mensaje;
            mensajeError.style.display = 'block';
            
            // Ocultar mensaje de éxito si estaba visible
            if (mensajeExito) mensajeExito.style.display = 'none';
            
            // Auto-ocultar después de 5 segundos
            setTimeout(() => {
                mensajeError.style.display = 'none';
            }, 5000);
        }
    }
    
    function mostrarMensajeExito(mensaje) {
        if (mensajeExito) {
            mensajeExito.textContent = mensaje;
            mensajeExito.style.display = 'block';
            
            // Ocultar mensaje de error si estaba visible
            if (mensajeError) mensajeError.style.display = 'none';
            
            // Auto-ocultar después de 5 segundos
            setTimeout(() => {
                mensajeExito.style.display = 'none';
            }, 5000);
        }
    }
    
    // ============================================
    // 7. LIMPIAR FORMULARIO DESPUÉS DE ÉXITO
    // ============================================
    function limpiarFormulario() {
        if (selectVehiculo) selectVehiculo.value = '';
        if (selectTipoCita) selectTipoCita.value = '';
        if (inputFecha) inputFecha.value = '';
        if (selectHora) selectHora.innerHTML = '<option value="">-- Primero selecciona una fecha --</option>';
        if (inputTelefono) inputTelefono.value = '';
        
        // No limpiar nombre y email si el usuario está logueado
        const usuario = obtenerUsuarioActual();
        if (!usuario) {
            if (inputNombre) inputNombre.value = '';
            if (inputEmail) inputEmail.value = '';
        }
    }
    
    // ============================================
    // 8. ENVIAR FORMULARIO (CREAR CITA)
    // ============================================
    async function enviarFormulario(event) {
        event.preventDefault(); // Evitar que el formulario recargue la página
        
        try {
            // Validar que todos los campos requeridos estén llenos
            const vehiculoId = selectVehiculo.value;
            const tipoCita = selectTipoCita.value;
            const fecha = inputFecha.value;
            const hora = selectHora.value;
            const telefono = inputTelefono.value.trim();
            
            if (!vehiculoId) {
                mostrarMensajeError('Por favor, selecciona un vehículo');
                return;
            }
            
            if (!tipoCita) {
                mostrarMensajeError('Por favor, selecciona el tipo de cita');
                return;
            }
            
            if (!fecha) {
                mostrarMensajeError('Por favor, selecciona una fecha');
                return;
            }
            
            if (!hora) {
                mostrarMensajeError('Por favor, selecciona una hora');
                return;
            }
            
            if (!telefono) {
                mostrarMensajeError('Por favor, ingresa tu número de teléfono');
                return;
            }
            
            // Obtener datos del usuario
            const usuario = obtenerUsuarioActual();
            let nombre = inputNombre.value.trim();
            let email = inputEmail.value.trim();
            
            if (!nombre) {
                mostrarMensajeError('Por favor, ingresa tu nombre');
                return;
            }
            
            if (!email) {
                mostrarMensajeError('Por favor, ingresa tu correo electrónico');
                return;
            }
            
            // Deshabilitar botón para evitar doble envío
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Agendando...';
            
            // Preparar datos para enviar
            const datosCita = {
                vehiculoId: vehiculoId,
                tipoCita: tipoCita,
                fecha: fecha,
                hora: hora,
                nombreCliente: nombre,
                emailCliente: email,
                telefonoCliente: telefono,
                comentarios: document.getElementById('comentarios')?.value || ''
            };
            
            // Si el usuario está logueado, agregar su ID
            if (usuario && usuario.id) {
                datosCita.usuarioId = usuario.id;
            }
            
            // Llamar a la función de api.js para crear la cita
            const resultado = await crearCita(datosCita);
            
            // Mostrar mensaje de éxito
            mostrarMensajeExito('¡Cita agendada con éxito! Te enviaremos un correo de confirmación.');
            
            // Mostrar resumen de la cita
            mostrarResumenCita(datosCita, resultado);
            
            // Limpiar formulario (opcional)
            limpiarFormulario();
            
        } catch (error) {
            console.error('Error al agendar cita:', error);
            mostrarMensajeError(error.message || 'Error al agendar la cita. Intenta nuevamente.');
        } finally {
            // Re-habilitar botón
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Agendar Cita';
        }
    }
    
    // ============================================
    // 9. MOSTRAR RESUMEN DE LA CITA
    // ============================================
    function mostrarResumenCita(datosCita, resultado) {
        const resumenDiv = document.getElementById('resumenCita');
        const resumenTexto = document.getElementById('resumenTexto');
        
        if (resumenDiv && resumenTexto) {
            const tipoTexto = datosCita.tipoCita === 'visita' ? 'Visita al concesionario' : 'Cita para compra';
            
            resumenTexto.innerHTML = `
                <strong>Vehículo:</strong> ${selectVehiculo.options[selectVehiculo.selectedIndex]?.text || 'Seleccionado'}<br>
                <strong>Tipo de cita:</strong> ${tipoTexto}<br>
                <strong>Fecha:</strong> ${datosCita.fecha}<br>
                <strong>Hora:</strong> ${datosCita.hora}<br>
                <strong>Atenderá a:</strong> ${datosCita.nombreCliente}<br>
                <strong>Número de confirmación:</strong> ${resultado.id || resultado._id || 'Enviado por correo'}
            `;
            
            resumenDiv.style.display = 'block';
            
            // Scroll al resumen
            resumenDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // ============================================
    // 10. VALIDACIÓN DE TELÉFONO EN TIEMPO REAL
    // ============================================
    function validarTelefono() {
        if (inputTelefono) {
            inputTelefono.addEventListener('input', function(e) {
                // Solo permitir números, guiones y espacios
                this.value = this.value.replace(/[^0-9\s\-]/g, '');
            });
        }
    }
    
    // ============================================
    // 11. EVENTO: CUANDO CAMBIA LA FECHA, CARGAR HORARIOS
    // ============================================
    if (inputFecha) {
        inputFecha.addEventListener('change', function() {
            const fechaSeleccionada = this.value;
            if (fechaSeleccionada) {
                cargarHorariosDisponibles(fechaSeleccionada);
            } else {
                selectHora.innerHTML = '<option value="">-- Primero selecciona una fecha --</option>';
            }
        });
    }
    
    // ============================================
    // 12. EVENTO: ENVIAR FORMULARIO
    // ============================================
    if (formulario) {
        formulario.addEventListener('submit', enviarFormulario);
    }
    
    // ============================================
    // 13. INICIALIZAR TODO AL CARGAR LA PÁGINA
    // ============================================
    function inicializar() {
        configurarFechaMinima();
        cargarVehiculos();
        cargarDatosUsuario();
        validarTelefono();
        
        // Si ya hay una fecha seleccionada al cargar, cargar horarios
        if (inputFecha && inputFecha.value) {
            cargarHorariosDisponibles(inputFecha.value);
        }
    }
    
    // Ejecutar inicialización
    inicializar();
    
});