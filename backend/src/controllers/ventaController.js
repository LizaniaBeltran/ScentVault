const ventaModel = require('../models/ventaModel');

const obtenerVentas = async (req, res) => {
    try {
        const ventas = await ventaModel.obtenerVentas();

        res.json({
            ok: true,
            data: ventas
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 'Error al obtener ventas'
        });
    }
};

const crearVenta = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        const venta = await ventaModel.crearVenta(req.body, usuarioId);

        res.status(201).json({
            ok: true,
            message: 'Venta registrada correctamente',
            data: venta
        });

    } catch (error) {
        res.status(400).json({
            ok: false,
            error: error.message
        });
    }
};

module.exports = {
    obtenerVentas,
    crearVenta
};