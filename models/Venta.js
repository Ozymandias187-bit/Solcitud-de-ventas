// Crear una nueva venta
const venta = new Venta({
    numeroVenta: await Venta.generarNumeroVenta(),
    vehiculoId: autoId,
    cliente: {
        nombre: "Juan Pérez",
        email: "juan@email.com",
        telefono: "555-1234567",
        direccion: "Calle Falsa 123, CDMX"
    },
    venta: {
        precioBase: 280000,
        impuestos: 44800,
        descuento: 0,
        total: 324800
    },
    pago: {
        metodoPago: "transferencia",
        referencia: "REF-12345",
        fechaPago: "2026-06-15"
    },
    contrato: {
        numero: "CON-2026-001",
        fechaFirma: "2026-06-15"
    }
});

await venta.save();

// Validar el pago
await venta.validarPago();

// Cancelar la venta (devuelve el auto a disponible)
await venta.cancelar("Cliente cambió de opinión");

// Verificar garantía vigente
if (venta.garantiaVigente()) {
    console.log("El vehículo está en garantía");
}

// Obtener estadísticas de ventas
const stats = await Venta.obtenerEstadisticas();
console.log(`Total de ventas: ${stats.totalVentas}`);
console.log(`Total ingresos: $${stats.totalIngresos}`);