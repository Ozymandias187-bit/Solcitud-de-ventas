// ============================================
// ventas.js - Lógica para registrar ventas
// ============================================
// Este archivo controla el formulario de registro de ventas
// y se conecta con api.js para enviar datos al servidor
// ============================================

// Esperar a que el HTML esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // 1. OBTENER REFERENCIAS A LOS ELEMENTOS DEL FORMULARIO
    // ============================================
    const formulario = document.getElementById('registroVentaForm');
    const selectVehiculo = document.getElementById('vehiculoId');
    const detalleVehiculoDiv = document.getElementById('detalleVehiculo');
    const vehiculoInfoP = document.getElementById('vehiculoInfo');
    const precioVehiculoInput = document.getElementById('precioVehiculo');
    const impuestosInput = document.getElementById('impuestos');
    const descuentoInput = document.getElementById('descuento');
    const totalVentaInput = document.getElementById('totalVenta');
    const calcularTotalBtn = document.getElementById('calcularTotalBtn');
    const validarPagoBtn = document.getElementById('validarPagoBtn');
    const registrarVentaBtn = document.getElementById('registrarVentaBtn');
    const limpiarFormularioBtn = document.getElementById('limpiarFormularioBtn');
    const metodoPagoSelect = document.getElementById('metodoPago');
    const mensajeError = document.getElementById('mensajeError');
    const mensajeExito = document.getElementById('mensajeExito');
    const validacionPagoMensaje = document.getElementById('validacionPagoMensaje');
    
    // Variables para almacenar datos temporales
    let vehiculoSeleccionado = null;
    let pagoValidado = false;
    let datosPagoValidados = null;
    
    // ============================================
    // 2. CONFIGURAR FECHA POR DEFECTO (HOY)
    // ============================================
    function configurarFechasPorDefecto() {
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        const fechaHoy = `${año}-${mes}-${dia}`;
        
        const fechaPagoInput = document.getElementById('fechaPago');
        const fechaFirmaInput = document.getElementById('fechaFirma');
        
        if (fechaPagoInput) fechaPagoInput.value = fechaHoy;
        if (fechaFirmaInput) fechaFirmaInput.value = fechaHoy;
    }
    
    // ============================================
    // 3. CARGAR LISTA DE VEHÍCULOS DESDE EL SERVIDOR
    // ============================================
    async function cargarVehiculos() {
        try {
            selectVehiculo.innerHTML = '<option value="">Cargando vehículos...</option>';
            
            const vehiculos = await obtenerVehiculos();
            
            selectVehiculo.innerHTML = '<option value="">-- Selecciona un vehículo --</option>';
            
            if (!vehiculos || vehiculos.length === 0) {
                selectVehiculo.innerHTML = '<option value="">No hay vehículos disponibles</option>';
                return;
            }
            
            // Filtrar solo vehículos disponibles (no vendidos)
            const vehiculosDisponibles = vehiculos.filter(v => v.estado !== 'vendido');
            
            if (vehiculosDisponibles.length === 0) {
                selectVehiculo.innerHTML = '<option value="">No hay vehículos disponibles para venta</option>';
                return;
            }
            
            vehiculosDisponibles.forEach(vehiculo => {
                const option = document.createElement('option');
                option.value = vehiculo._id || vehiculo.id;
                option.setAttribute('data-precio', vehiculo.precio);
                option.setAttribute('data-marca', vehiculo.marca);
                option.setAttribute('data-modelo', vehiculo.modelo);
                option.setAttribute('data-año', vehiculo.año);
                option.setAttribute('data-kilometraje', vehiculo.kilometraje || 'N/A');
                option.textContent = `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.año} - $${vehiculo.precio.toLocaleString()}`;
                selectVehiculo.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error al cargar vehículos:', error);
            selectVehiculo.innerHTML = '<option value="">Error al cargar vehículos</option>';
            mostrarMensajeError('No se pudieron cargar los vehículos. Intenta recargar la página.');
        }
    }
    
    // ============================================
    // 4. MOSTRAR DETALLES DEL VEHÍCULO SELECCIONADO
    // ============================================
    function mostrarDetalleVehiculo() {
        const optionSeleccionado = selectVehiculo.options[selectVehiculo.selectedIndex];
        
        if (!optionSeleccionado || !optionSeleccionado.value) {
            detalleVehiculoDiv.style.display = 'none';
            precioVehiculoInput.value = '';
            vehiculoSeleccionado = null;
            return;
        }
        
        const precio = optionSeleccionado.getAttribute('data-precio');
        const marca = optionSeleccionado.getAttribute('data-marca');
        const modelo = optionSeleccionado.getAttribute('data-modelo');
        const año = optionSeleccionado.getAttribute('data-año');
        const kilometraje = optionSeleccionado.getAttribute('data-kilometraje');
        
        vehiculoSeleccionado = {
            id: optionSeleccionado.value,
            precio: parseFloat(precio),
            marca: marca,
            modelo: modelo,
            año: año,
            kilometraje: kilometraje
        };
        
        // Mostrar detalles
        vehiculoInfoP.innerHTML = `
            <strong>Marca:</strong> ${marca}<br>
            <strong>Modelo:</strong> ${modelo}<br>
            <strong>Año:</strong> ${año}<br>
            <strong>Kilometraje:</strong> ${kilometraje}<br>
            <strong>Precio base:</strong> $${parseFloat(precio).toLocaleString()}
        `;
        
        detalleVehiculoDiv.style.display = 'block';
        precioVehiculoInput.value = parseFloat(precio);
        
        // Resetear cálculos
        impuestosInput.value = '';
        totalVentaInput.value = '';
        descuentoInput.value = '0';
        pagoValidado = false;
        if (validacionPagoMensaje) validacionPagoMensaje.style.display = 'none';
    }
    
    // ============================================
    // 5. CALCULAR TOTAL DE LA VENTA
    // ============================================
    function calcularTotalVenta() {
        if (!vehiculoSeleccionado) {
            mostrarMensajeError('Primero selecciona un vehículo');
            return false;
        }
        
        const precioBase = vehiculoSeleccionado.precio;
        const iva = precioBase * 0.16; // 16% de IVA
        const descuento = parseFloat(descuentoInput.value) || 0;
        
        if (descuento < 0) {
            mostrarMensajeError('El descuento no puede ser negativo');
            descuentoInput.value = 0;
            return false;
        }
        
        if (descuento > precioBase) {
            mostrarMensajeError('El descuento no puede ser mayor al precio del vehículo');
            descuentoInput.value = 0;
            return false;
        }
        
        const total = precioBase + iva - descuento;
        
        impuestosInput.value = iva.toFixed(2);
        totalVentaInput.value = total.toFixed(2);
        
        mostrarMensajeInfo('Total calculado correctamente');
        return true;
    }
    
    // ============================================
    // 6. VALIDAR PAGO (SIMULADO)
    // ============================================
    async function validarPago() {
        const metodoPago = metodoPagoSelect.value;
        
        if (!metodoPago) {
            mostrarMensajeError('Selecciona un método de pago primero');
            return false;
        }
        
        const total = parseFloat(totalVentaInput.value);
        
        if (isNaN(total) || total <= 0) {
            mostrarMensajeError('Primero calcula el total de la venta');
            return false;
        }
        
        // Recopilar datos del pago según el método
        let datosPago = {
            metodoPago: metodoPago,
            total: total,
            fechaPago: document.getElementById('fechaPago')?.value || new Date().toISOString().split('T')[0]
        };
        
        // Validar según método de pago
        if (metodoPago === 'transferencia') {
            const referencia = document.getElementById('referenciaPago')?.value;
            const banco = document.getElementById('bancoOrigen')?.value;
            
            if (!referencia) {
                mostrarMensajeError('Ingresa la referencia de la transferencia');
                return false;
            }
            datosPago.referencia = referencia;
            datosPago.bancoOrigen = banco;
            
        } else if (metodoPago === 'tarjeta_credito' || metodoPago === 'tarjeta_debito') {
            const ultimosDigitos = document.getElementById('ultimosDigitos')?.value;
            const autorizacion = document.getElementById('autorizacion')?.value;
            
            if (!ultimosDigitos || ultimosDigitos.length !== 4) {
                mostrarMensajeError('Ingresa los últimos 4 dígitos de la tarjeta');
                return false;
            }
            datosPago.ultimosDigitos = ultimosDigitos;
            datosPago.autorizacion = autorizacion;
            
        } else if (metodoPago === 'financiamiento') {
            const banco = document.getElementById('bancoFinanciamiento')?.value;
            const numeroContrato = document.getElementById('numeroContrato')?.value;
            
            if (!banco) {
                mostrarMensajeError('Ingresa el banco de financiamiento');
                return false;
            }
            datosPago.bancoFinanciamiento = banco;
            datosPago.numeroContratoFinanciamiento = numeroContrato;
        }
        
        // Simular validación de pago
        mostrarMensajeInfo('Validando pago...', 'info');
        
        try {
            // Usar la función de api.js para validar pago
            const resultado = await validarPago(datosPago);
            
            pagoValidado = true;
            datosPagoValidados = datosPago;
            
            if (validacionPagoMensaje) {
                validacionPagoMensaje.innerHTML = '✅ Pago validado correctamente. Puedes proceder a registrar la venta.';
                validacionPagoMensaje.style.display = 'block';
                validacionPagoMensaje.className = 'success-message';
            }
            
            mostrarMensajeExito('Pago validado correctamente');
            return true;
            
        } catch (error) {
            console.error('Error en validación de pago:', error);
            pagoValidado = false;
            
            if (validacionPagoMensaje) {
                validacionPagoMensaje.innerHTML = '❌ Error al validar el pago: ' + (error.message || 'Intenta nuevamente');
                validacionPagoMensaje.style.display = 'block';
                validacionPagoMensaje.className = 'error-message';
            }
            
            mostrarMensajeError('Error al validar el pago: ' + error.message);
            return false;
        }
    }
    
    // ============================================
    // 7. MOSTRAR CAMPOS ESPECÍFICOS SEGÚN MÉTODO DE PAGO
    // ============================================
    function mostrarCamposPago() {
        const metodo = metodoPagoSelect.value;
        
        document.getElementById('pagoTransferencia').style.display = 'none';
        document.getElementById('pagoTarjeta').style.display = 'none';
        document.getElementById('pagoFinanciamiento').style.display = 'none';
        
        if (metodo === 'transferencia') {
            document.getElementById('pagoTransferencia').style.display = 'block';
        } else if (metodo === 'tarjeta_credito' || metodo === 'tarjeta_debito') {
            document.getElementById('pagoTarjeta').style.display = 'block';
        } else if (metodo === 'financiamiento') {
            document.getElementById('pagoFinanciamiento').style.display = 'block';
        }
        
        // Resetear validación al cambiar método
        pagoValidado = false;
        if (validacionPagoMensaje) validacionPagoMensaje.style.display = 'none';
    }
    
    // ============================================
    // 8. REGISTRAR VENTA (ENVIAR AL SERVIDOR)
    // ============================================
    async function registrarVenta(event) {
        event.preventDefault();
        
        // Validaciones previas
        if (!vehiculoSeleccionado) {
            mostrarMensajeError('Selecciona un vehículo');
            return;
        }
        
        if (!pagoValidado) {
            mostrarMensajeError('Primero debes validar el pago');
            return;
        }
        
        // Validar campos del comprador
        const clienteNombre = document.getElementById('clienteNombre')?.value.trim();
        const clienteEmail = document.getElementById('clienteEmail')?.value.trim();
        const clienteTelefono = document.getElementById('clienteTelefono')?.value.trim();
        const clienteDireccion = document.getElementById('clienteDireccion')?.value.trim();
        
        if (!clienteNombre) {
            mostrarMensajeError('Ingresa el nombre del comprador');
            return;
        }
        
        if (!clienteEmail) {
            mostrarMensajeError('Ingresa el correo del comprador');
            return;
        }
        
        if (!clienteTelefono) {
            mostrarMensajeError('Ingresa el teléfono del comprador');
            return;
        }
        
        if (!clienteDireccion) {
            mostrarMensajeError('Ingresa la dirección del comprador');
            return;
        }
        
        // Validar contrato
        const archivoContrato = document.getElementById('contratoArchivo')?.files[0];
        const numeroContrato = document.getElementById('numeroContratoVenta')?.value.trim();
        const fechaFirma = document.getElementById('fechaFirma')?.value;
        const contratoLeido = document.getElementById('contratoLeido')?.checked;
        
        if (!archivoContrato) {
            mostrarMensajeError('Adjunta el contrato de compra-venta');
            return;
        }
        
        if (!numeroContrato) {
            mostrarMensajeError('Ingresa el número de contrato');
            return;
        }
        
        if (!fechaFirma) {
            mostrarMensajeError('Ingresa la fecha de firma del contrato');
            return;
        }
        
        if (!contratoLeido) {
            mostrarMensajeError('Debes confirmar que el contrato ha sido revisado y firmado');
            return;
        }
        
        // Validar tamaño del archivo (máximo 5MB)
        if (archivoContrato.size > 5 * 1024 * 1024) {
            mostrarMensajeError('El archivo no debe superar los 5MB');
            return;
        }
        
        // Deshabilitar botón mientras se procesa
        const btnRegistrar = document.getElementById('registrarVentaBtn');
        btnRegistrar.disabled = true;
        btnRegistrar.textContent = 'Registrando...';
        
        try {
            // Convertir archivo a Base64 para enviar (simplificado)
            const contratoBase64 = await convertirArchivoABase64(archivoContrato);
            
            // Preparar datos de la venta
            const datosVenta = {
                vehiculoId: vehiculoSeleccionado.id,
                cliente: {
                    nombre: clienteNombre,
                    email: clienteEmail,
                    telefono: clienteTelefono,
                    direccion: clienteDireccion,
                    rfc: document.getElementById('clienteRFC')?.value || null
                },
                venta: {
                    precioBase: vehiculoSeleccionado.precio,
                    impuestos: parseFloat(impuestosInput.value) || 0,
                    descuento: parseFloat(descuentoInput.value) || 0,
                    total: parseFloat(totalVentaInput.value) || 0
                },
                pago: datosPagoValidados,
                contrato: {
                    numero: numeroContrato,
                    fechaFirma: fechaFirma,
                    archivoBase64: contratoBase64,
                    nombreArchivo: archivoContrato.name
                }
            };
            
            // Llamar a la función de api.js para registrar la venta
            const resultado = await registrarVenta(datosVenta);
            
            // Mostrar mensaje de éxito
            mostrarMensajeExito('¡Venta registrada exitosamente!');
            
            // Mostrar resumen de la venta
            mostrarResumenVenta(datosVenta, resultado);
            
            // Limpiar formulario después de registro exitoso
            limpiarFormulario();
            
        } catch (error) {
            console.error('Error al registrar venta:', error);
            mostrarMensajeError('Error al registrar la venta: ' + (error.message || 'Intenta nuevamente'));
        } finally {
            btnRegistrar.disabled = false;
            btnRegistrar.textContent = 'Registrar Venta';
        }
    }
    
    // ============================================
    // 9. CONVERTIR ARCHIVO A BASE64
    // ============================================
    function convertirArchivoABase64(archivo) {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.onload = () => resolve(lector.result.split(',')[1]); // Solo la parte Base64
            lector.onerror = () => reject(new Error('Error al leer el archivo'));
            lector.readAsDataURL(archivo);
        });
    }
    
    // ============================================
    // 10. MOSTRAR RESUMEN DE LA VENTA
    // ============================================
    function mostrarResumenVenta(datosVenta, resultado) {
        const resumenDiv = document.getElementById('resumenVenta');
        const resumenContenido = document.getElementById('resumenContenido');
        
        if (resumenDiv && resumenContenido) {
            const metodoPagoTexto = {
                'efectivo': 'Efectivo',
                'transferencia': 'Transferencia bancaria',
                'tarjeta_credito': 'Tarjeta de crédito',
                'tarjeta_debito': 'Tarjeta de débito',
                'financiamiento': 'Financiamiento'
            };
            
            resumenContenido.innerHTML = `
                <p><strong>Número de venta:</strong> ${resultado.numeroVenta || resultado.id || 'N/A'}</p>
                <p><strong>Vehículo:</strong> ${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo} (${vehiculoSeleccionado.año})</p>
                <p><strong>Comprador:</strong> ${datosVenta.cliente.nombre}</p>
                <p><strong>Total de la venta:</strong> $${datosVenta.venta.total.toLocaleString()}</p>
                <p><strong>Método de pago:</strong> ${metodoPagoTexto[datosVenta.pago.metodoPago] || datosVenta.pago.metodoPago}</p>
                <p><strong>Número de contrato:</strong> ${datosVenta.contrato.numero}</p>
                <p><strong>Fecha de registro:</strong> ${new Date().toLocaleString()}</p>
            `;
            
            resumenDiv.style.display = 'block';
            resumenDiv.scrollIntoView({ behavior: 'smooth' });
            
            // Ocultar el formulario
            if (formulario) formulario.style.display = 'none';
        }
    }
    
    // ============================================
    // 11. LIMPIAR FORMULARIO
    // ============================================
    function limpiarFormulario() {
        // Resetear selección de vehículo
        selectVehiculo.value = '';
        detalleVehiculoDiv.style.display = 'none';
        precioVehiculoInput.value = '';
        impuestosInput.value = '';
        descuentoInput.value = '0';
        totalVentaInput.value = '';
        
        // Limpiar datos del comprador
        document.getElementById('clienteNombre').value = '';
        document.getElementById('clienteEmail').value = '';
        document.getElementById('clienteTelefono').value = '';
        document.getElementById('clienteDireccion').value = '';
        document.getElementById('clienteRFC').value = '';
        
        // Resetear método de pago
        metodoPagoSelect.value = '';
        document.getElementById('pagoTransferencia').style.display = 'none';
        document.getElementById('pagoTarjeta').style.display = 'none';
        document.getElementById('pagoFinanciamiento').style.display = 'none';
        
        // Limpiar campos específicos de pago
        if (document.getElementById('referenciaPago')) document.getElementById('referenciaPago').value = '';
        if (document.getElementById('bancoOrigen')) document.getElementById('bancoOrigen').value = '';
        if (document.getElementById('ultimosDigitos')) document.getElementById('ultimosDigitos').value = '';
        if (document.getElementById('autorizacion')) document.getElementById('autorizacion').value = '';
        if (document.getElementById('bancoFinanciamiento')) document.getElementById('bancoFinanciamiento').value = '';
        if (document.getElementById('numeroContrato')) document.getElementById('numeroContrato').value = '';
        
        // Limpiar contrato
        document.getElementById('contratoArchivo').value = '';
        document.getElementById('numeroContratoVenta').value = '';
        
        // Resetear validación
        pagoValidado = false;
        datosPagoValidados = null;
        
        if (validacionPagoMensaje) validacionPagoMensaje.style.display = 'none';
        
        // Mostrar formulario nuevamente
        if (formulario) formulario.style.display = 'block';
        
        // Ocultar resumen
        const resumenDiv = document.getElementById('resumenVenta');
        if (resumenDiv) resumenDiv.style.display = 'none';
        
        // Configurar fechas nuevamente
        configurarFechasPorDefecto();
        
        mostrarMensajeInfo('Formulario limpiado');
    }
    
    // ============================================
    // 12. MOSTRAR MENSAJES
    // ============================================
    function mostrarMensajeError(mensaje) {
        if (mensajeError) {
            mensajeError.textContent = mensaje;
            mensajeError.style.display = 'block';
            if (mensajeExito) mensajeExito.style.display = 'none';
            
            setTimeout(() => {
                mensajeError.style.display = 'none';
            }, 5000);
        } else {
            alert('❌ ' + mensaje);
        }
    }
    
    function mostrarMensajeExito(mensaje) {
        if (mensajeExito) {
            mensajeExito.textContent = mensaje;
            mensajeExito.style.display = 'block';
            if (mensajeError) mensajeError.style.display = 'none';
            
            setTimeout(() => {
                mensajeExito.style.display = 'none';
            }, 5000);
        } else {
            alert('✅ ' + mensaje);
        }
    }
    
    function mostrarMensajeInfo(mensaje, tipo = 'info') {
        console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    }
    
    // ============================================
    // 13. FUNCIÓN PARA NUEVA VENTA (DESPUÉS DE REGISTRAR)
    // ============================================
    function nuevaVenta() {
        limpiarFormulario();
        if (formulario) formulario.style.display = 'block';
        const resumenDiv = document.getElementById('resumenVenta');
        if (resumenDiv) resumenDiv.style.display = 'none';
        cargarVehiculos(); // Recargar vehículos para quitar el vendido
    }
    
    // ============================================
    // 14. EVENTOS
    // ============================================
    
    // Al seleccionar un vehículo
    if (selectVehiculo) {
        selectVehiculo.addEventListener('change', mostrarDetalleVehiculo);
    }
    
    // Calcular total
    if (calcularTotalBtn) {
        calcularTotalBtn.addEventListener('click', calcularTotalVenta);
    }
    
    // Validar pago
    if (validarPagoBtn) {
        validarPagoBtn.addEventListener('click', validarPago);
    }
    
    // Enviar formulario
    if (formulario) {
        formulario.addEventListener('submit', registrarVenta);
    }
    
    // Limpiar formulario
    if (limpiarFormularioBtn) {
        limpiarFormularioBtn.addEventListener('click', limpiarFormulario);
    }
    
    // Cambio en método de pago
    if (metodoPagoSelect) {
        metodoPagoSelect.addEventListener('change', mostrarCamposPago);
    }
    
    // Botón de nueva venta
    const nuevaVentaBtn = document.getElementById('nuevaVentaBtn');
    if (nuevaVentaBtn) {
        nuevaVentaBtn.addEventListener('click', nuevaVenta);
    }
    
    // Validar descuento en tiempo real
    if (descuentoInput) {
        descuentoInput.addEventListener('input', function() {
            if (vehiculoSeleccionado && totalVentaInput.value) {
                calcularTotalVenta();
            }
        });
    }
    
    // ============================================
    // 15. INICIALIZAR TODO AL CARGAR LA PÁGINA
    // ============================================
    function inicializar() {
        configurarFechasPorDefecto();
        cargarVehiculos();
        
        // Verificar si el usuario es administrador
        const usuario = obtenerUsuarioActual();
        if (!usuario || usuario.rol !== 'admin') {
            mostrarMensajeError('Acceso restringido. Solo administradores pueden registrar ventas.');
            if (formulario) formulario.style.display = 'none';
        }
    }
    
    inicializar();
    
});