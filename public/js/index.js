// ============================================
// index.js - Lógica para la página principal
// ============================================
// Este archivo controla:
// - Carga y filtrado del catálogo de vehículos
// - Inicio de sesión y registro
// - Interacciones de la página principal
// ============================================

// Esperar a que el HTML esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // 1. OBTENER REFERENCIAS A ELEMENTOS
    // ============================================
    const vehiculosGrid = document.getElementById('vehiculosGrid');
    const resultadoCount = document.getElementById('resultadoCount');
    const filtroMarca = document.getElementById('filtroMarca');
    const filtroPrecioMin = document.getElementById('filtroPrecioMin');
    const filtroPrecioMax = document.getElementById('filtroPrecioMax');
    const filtroAño = document.getElementById('filtroAño');
    const btnFiltrar = document.getElementById('btnFiltrar');
    const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
    
    // Variables para almacenar datos
    let todosLosVehiculos = [];
    
    // ============================================
    // 2. CARGAR VEHÍCULOS DESDE EL SERVIDOR
    // ============================================
    async function cargarVehiculos() {
        try {
            vehiculosGrid.innerHTML = '<div class="loading">🔄 Cargando vehículos...</div>';
            
            const vehiculos = await obtenerVehiculos();
            todosLosVehiculos = vehiculos;
            
            mostrarVehiculos(todosLosVehiculos);
            
        } catch (error) {
            console.error('Error al cargar vehículos:', error);
            vehiculosGrid.innerHTML = '<div class="error">❌ Error al cargar los vehículos. Intenta recargar la página.</div>';
        }
    }
    
    // ============================================
    // 3. MOSTRAR VEHÍCULOS EN EL GRID
    // ============================================
    function mostrarVehiculos(vehiculos) {
        if (!vehiculos || vehiculos.length === 0) {
            vehiculosGrid.innerHTML = '<div class="sin-resultados">😞 No se encontraron vehículos con esos criterios</div>';
            resultadoCount.textContent = '0 vehículos encontrados';
            return;
        }
        
        // Mostrar solo vehículos disponibles (no vendidos)
        const disponibles = vehiculos.filter(v => v.estado !== 'vendido');
        
        if (disponibles.length === 0) {
            vehiculosGrid.innerHTML = '<div class="sin-resultados">😞 No hay vehículos disponibles en este momento</div>';
            resultadoCount.textContent = '0 vehículos disponibles';
            return;
        }
        
        resultadoCount.textContent = `${disponibles.length} vehículo(s) disponible(s)`;
        
        // Generar HTML para cada vehículo
        vehiculosGrid.innerHTML = disponibles.map(vehiculo => `
            <div class="vehiculo-card" data-id="${vehiculo._id}">
                <div class="vehiculo-imagen">
                    🚗
                </div>
                <div class="vehiculo-info">
                    <h3>${vehiculo.marca} ${vehiculo.modelo}</h3>
                    <div class="vehiculo-detalles">
                        <span class="año">📅 ${vehiculo.año}</span>
                        <span class="kilometraje">📊 ${vehiculo.kilometraje?.toLocaleString() || 0} km</span>
                        <span class="color">🎨 ${vehiculo.color || 'No especificado'}</span>
                    </div>
                    <div class="vehiculo-precio">
                        $${vehiculo.precio.toLocaleString()}
                    </div>
                    <div class="vehiculo-acciones">
                        <button class="btn-ver-detalle" data-id="${vehiculo._id}">Ver detalles</button>
                        <button class="btn-agendar-cita" data-id="${vehiculo._id}">Agendar cita</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Agregar eventos a los botones
        document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
            btn.addEventListener('click', () => verDetalleVehiculo(btn.getAttribute('data-id')));
        });
        
        document.querySelectorAll('.btn-agendar-cita').forEach(btn => {
            btn.addEventListener('click', () => irAAgendarCita(btn.getAttribute('data-id')));
        });
    }
    
    // ============================================
    // 4. VER DETALLE DE UN VEHÍCULO
    // ============================================
    function verDetalleVehiculo(id) {
        const vehiculo = todosLosVehiculos.find(v => v._id === id);
        
        if (!vehiculo) return;
        
        // Crear modal de detalles
        const modalHTML = `
            <div id="detalleModal" class="modal">
                <div class="modal-content modal-grande">
                    <span class="close-modal">&times;</span>
                    <h2>${vehiculo.marca} ${vehiculo.modelo}</h2>
                    <div class="detalle-contenido">
                        <div class="detalle-imagen">
                            🚗
                        </div>
                        <div class="detalle-info">
                            <p><strong>Marca:</strong> ${vehiculo.marca}</p>
                            <p><strong>Modelo:</strong> ${vehiculo.modelo}</p>
                            <p><strong>Año:</strong> ${vehiculo.año}</p>
                            <p><strong>Precio:</strong> $${vehiculo.precio.toLocaleString()}</p>
                            <p><strong>Kilometraje:</strong> ${vehiculo.kilometraje?.toLocaleString() || 0} km</p>
                            <p><strong>Color:</strong> ${vehiculo.color || 'No especificado'}</p>
                            <p><strong>Estado:</strong> ${vehiculo.estado === 'disponible' ? '✅ Disponible' : '❌ Vendido'}</p>
                            <p><strong>Descripción:</strong> ${vehiculo.descripcion || 'Sin descripción'}</p>
                        </div>
                    </div>
                    <div class="detalle-acciones">
                        <button class="btn-agendar" data-id="${vehiculo._id}">📅 Agendar Cita</button>
                        <button class="btn-comprar" data-id="${vehiculo._id}">💰 Comprar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar modal al body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('detalleModal');
        const closeBtn = modal.querySelector('.close-modal');
        
        // Evento para cerrar modal
        closeBtn.onclick = () => modal.remove();
        
        // Cerrar al hacer clic fuera
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        // Eventos de los botones
        modal.querySelector('.btn-agendar')?.addEventListener('click', () => {
            irAAgendarCita(vehiculo._id);
            modal.remove();
        });
        
        modal.querySelector('.btn-comprar')?.addEventListener('click', () => {
            if (vehiculo.estado === 'vendido') {
                alert('❌ Este vehículo ya fue vendido');
                return;
            }
            
            const usuario = obtenerUsuarioActual();
            if (!usuario) {
                alert('⚠️ Debes iniciar sesión para comprar un vehículo');
                mostrarLoginModal();
                modal.remove();
                return;
            }
            
            if (usuario.rol !== 'admin') {
                alert('⚠️ Solo el administrador puede registrar ventas. Por favor, agenda una cita para la compra.');
                irAAgendarCita(vehiculo._id);
                modal.remove();
                return;
            }
            
            // Redirigir a registrar venta con el vehículo preseleccionado
            window.location.href = `/registrar-venta.html?vehiculo=${vehiculo._id}`;
        });
    }
    
    // ============================================
    // 5. IR A AGENDAR CITA
    // ============================================
    function irAAgendarCita(vehiculoId) {
        window.location.href = `/agendar-cita.html?vehiculo=${vehiculoId}`;
    }
    
    // ============================================
    // 6. FILTRAR VEHÍCULOS
    // ============================================
    function filtrarVehiculos() {
        let resultado = [...todosLosVehiculos];
        
        // Filtrar solo disponibles
        resultado = resultado.filter(v => v.estado !== 'vendido');
        
        // Filtrar por marca
        const marca = filtroMarca.value;
        if (marca) {
            resultado = resultado.filter(v => v.marca === marca);
        }
        
        // Filtrar por precio mínimo
        const precioMin = parseFloat(filtroPrecioMin.value);
        if (!isNaN(precioMin)) {
            resultado = resultado.filter(v => v.precio >= precioMin);
        }
        
        // Filtrar por precio máximo
        const precioMax = parseFloat(filtroPrecioMax.value);
        if (!isNaN(precioMax)) {
            resultado = resultado.filter(v => v.precio <= precioMax);
        }
        
        // Filtrar por año
        const año = filtroAño.value;
        if (año) {
            resultado = resultado.filter(v => v.año === parseInt(año));
        }
        
        mostrarVehiculos(resultado);
    }
    
    // ============================================
    // 7. LIMPIAR FILTROS
    // ============================================
    function limpiarFiltros() {
        filtroMarca.value = '';
        filtroPrecioMin.value = '';
        filtroPrecioMax.value = '';
        filtroAño.value = '';
        
        mostrarVehiculos(todosLosVehiculos);
    }
    
    // ============================================
    // 8. INICIO DE SESIÓN Y REGISTRO
    // ============================================
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    function mostrarLoginModal() {
        loginModal.style.display = 'flex';
    }
    
    function cerrarModales() {
        if (loginModal) loginModal.style.display = 'none';
        if (registerModal) registerModal.style.display = 'none';
    }
    
    function actualizarUIUsuario() {
        const usuario = obtenerUsuarioActual();
        
        if (usuario) {
            userNameDisplay.textContent = `👤 ${usuario.nombre}`;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
        } else {
            userNameDisplay.textContent = '';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
    }
    
    // Evento de login
    if (loginBtn) {
        loginBtn.addEventListener('click', mostrarLoginModal);
    }
    
    // Evento de logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            cerrarSesion();
            actualizarUIUsuario();
            alert('Sesión cerrada correctamente');
        });
    }
    
    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(close => {
        close.addEventListener('click', cerrarModales);
    });
    
    window.onclick = (event) => {
        if (event.target === loginModal) cerrarModales();
        if (event.target === registerModal) cerrarModales();
    };
    
    // Formulario de login
    const loginForm = document.getElementById('loginFormModal');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const resultado = await iniciarSesion(email, password);
                alert(`✅ Bienvenido ${resultado.usuario.nombre}`);
                cerrarModales();
                actualizarUIUsuario();
                loginForm.reset();
            } catch (error) {
                alert('❌ Error al iniciar sesión: ' + error.message);
            }
        });
    }
    
    // Mostrar registro
    const showRegisterLink = document.getElementById('showRegisterLink');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            registerModal.style.display = 'flex';
        });
    }
    
    // Mostrar login desde registro
    const showLoginLink = document.getElementById('showLoginLink');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.style.display = 'none';
            loginModal.style.display = 'flex';
        });
    }
    
    // Formulario de registro
    const registerForm = document.getElementById('registerFormModal');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('registerNombre').value;
            const email = document.getElementById('registerEmail').value;
            const telefono = document.getElementById('registerTelefono').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('❌ Las contraseñas no coinciden');
                return;
            }
            
            try {
                const resultado = await registrarUsuario({ nombre, email, telefono, password });
                alert(`✅ Registro exitoso. Bienvenido ${resultado.usuario.nombre}`);
                cerrarModales();
                actualizarUIUsuario();
                registerForm.reset();
            } catch (error) {
                alert('❌ Error al registrarse: ' + error.message);
            }
        });
    }
    
    // ============================================
    // 9. FORMULARIO DE CONTACTO
    // ============================================
    const contactoForm = document.getElementById('contactoForm');
    if (contactoForm) {
        contactoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('📨 Mensaje enviado. Te contactaremos pronto.');
            contactoForm.reset();
        });
    }
    
    // ============================================
    // 10. EVENTOS DE FILTROS
    // ============================================
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', filtrarVehiculos);
    }
    
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
    }
    
    // Filtrar al presionar Enter en los inputs de precio
    [filtroPrecioMin, filtroPrecioMax].forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') filtrarVehiculos();
            });
        }
    });
    
    // ============================================
    // 11. INICIALIZAR
    // ============================================
    actualizarUIUsuario();
    cargarVehiculos();
    
    // Verificar si hay un vehículo en la URL (para redirección)
    const urlParams = new URLSearchParams(window.location.search);
    const vehiculoId = urlParams.get('vehiculo');
    if (vehiculoId) {
        setTimeout(() => verDetalleVehiculo(vehiculoId), 500);
    }
    
});