// controllers/vehiculoController.js - Controlador de Vehículos
const Vehiculo = require('../models/Vehiculo');

// Obtener todos los vehículos
const obtenerTodosVehiculos = async (req, res) => {
    try {
        const vehiculos = await Vehiculo.find();
        res.json({
            success: true,
            vehiculos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener vehículos',
            error: error.message
        });
    }
};

// Obtener vehículos disponibles
const obtenerVehiculosDisponibles = async (req, res) => {
    try {
        const vehiculos = await Vehiculo.find({ estado: 'disponible' });
        res.json({
            success: true,
            vehiculos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener vehículos disponibles',
            error: error.message
        });
    }
};

// Buscar vehículos (con filtros)
const buscarVehiculos = async (req, res) => {
    try {
        const { marca, modelo, año, precioMin, precioMax } = req.query;
        const filtro = { estado: 'disponible' };
        
        if (marca) filtro.marca = marca.toUpperCase();
        if (modelo) filtro.modelo = new RegExp(modelo, 'i');
        if (año) filtro.año = parseInt(año);
        if (precioMin || precioMax) {
            filtro.precio = {};
            if (precioMin) filtro.precio.$gte = parseFloat(precioMin);
            if (precioMax) filtro.precio.$lte = parseFloat(precioMax);
        }
        
        const vehiculos = await Vehiculo.find(filtro);
        res.json({
            success: true,
            vehiculos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error en búsqueda',
            error: error.message
        });
    }
};

// Obtener vehículo por ID
const obtenerVehiculoPorId = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id);
        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                mensaje: 'Vehículo no encontrado'
            });
        }
        res.json({
            success: true,
            vehiculo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener vehículo',
            error: error.message
        });
    }
};

// Crear vehículo
const crearVehiculo = async (req, res) => {
    try {
        const nuevoVehiculo = new Vehiculo(req.body);
        await nuevoVehiculo.save();
        res.status(201).json({
            success: true,
            mensaje: 'Vehículo creado exitosamente',
            vehiculo: nuevoVehiculo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear vehículo',
            error: error.message
        });
    }
};

// Actualizar vehículo
const actualizarVehiculo = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                mensaje: 'Vehículo no encontrado'
            });
        }
        res.json({
            success: true,
            mensaje: 'Vehículo actualizado',
            vehiculo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar',
            error: error.message
        });
    }
};

// Eliminar vehículo
const eliminarVehiculo = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findByIdAndDelete(req.params.id);
        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                mensaje: 'Vehículo no encontrado'
            });
        }
        res.json({
            success: true,
            mensaje: 'Vehículo eliminado'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar',
            error: error.message
        });
    }
};

// Cambiar estado del vehículo
const cambiarEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        const vehiculo = await Vehiculo.findByIdAndUpdate(
            req.params.id,
            { estado },
            { new: true }
        );
        res.json({
            success: true,
            mensaje: `Estado cambiado a ${estado}`,
            vehiculo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al cambiar estado',
            error: error.message
        });
    }
};

// Obtener marcas disponibles
const obtenerMarcas = async (req, res) => {
    try {
        const marcas = await Vehiculo.distinct('marca');
        res.json({ success: true, marcas });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener marcas',
            error: error.message
        });
    }
};

// Obtener estadísticas
const obtenerEstadisticas = async (req, res) => {
    try {
        const total = await Vehiculo.countDocuments();
        const disponibles = await Vehiculo.countDocuments({ estado: 'disponible' });
        const vendidos = await Vehiculo.countDocuments({ estado: 'vendido' });
        
        res.json({
            success: true,
            estadisticas: { total, disponibles, vendidos }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

module.exports = {
    obtenerTodosVehiculos,
    obtenerVehiculosDisponibles,
    buscarVehiculos,
    obtenerVehiculoPorId,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
    cambiarEstado,
    obtenerMarcas,
    obtenerEstadisticas
};