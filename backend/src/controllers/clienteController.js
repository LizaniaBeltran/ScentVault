const Cliente = require('../models/clienteModel');
const Venta = require('../models/ventaModel');

const obtenerClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find({ activo: true }).sort({ createdAt: -1 });

        res.json({
            ok: true,
            data: clientes
        });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al obtener clientes'
        });
    }
};

const obtenerClientesInactivos = async (req, res) => {
    try {
        const clientes = await Cliente.find({ activo: false }).sort({ createdAt: -1 });

        res.json({
            ok: true,
            data: clientes
        });
    } catch (error) {
        console.error('Error al obtener clientes inactivos:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al obtener clientes inactivos'
        });
    }
};

const crearCliente = async (req, res) => {
    try {
        const nuevoCliente = new Cliente(req.body);
        await nuevoCliente.save();

        res.status(201).json({
            ok: true,
            message: 'Cliente registrado correctamente',
            data: nuevoCliente
        });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al registrar cliente'
        });
    }
};

const actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const cliente = await Cliente.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        if (!cliente) {
            return res.status(404).json({
                ok: false,
                error: 'Cliente no encontrado'
            });
        }

        res.json({
            ok: true,
            message: 'Cliente actualizado correctamente',
            data: cliente
        });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al actualizar cliente'
        });
    }
};

const darBajaCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Cliente.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );

        if (!cliente) {
            return res.status(404).json({
                ok: false,
                error: 'Cliente no encontrado'
            });
        }

        res.json({
            ok: true,
            message: 'Cliente dado de baja correctamente',
            data: cliente
        });
    } catch (error) {
        console.error('Error al dar de baja cliente:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al dar de baja cliente'
        });
    }
};

const reactivarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Cliente.findByIdAndUpdate(
            id,
            { activo: true },
            { new: true }
        );

        if (!cliente) {
            return res.status(404).json({
                ok: false,
                error: 'Cliente no encontrado'
            });
        }

        res.json({
            ok: true,
            message: 'Cliente reactivado correctamente',
            data: cliente
        });
    } catch (error) {
        console.error('Error al reactivar cliente:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al reactivar cliente'
        });
    }
};

const obtenerHistorialCompras = async (req, res) => {
    try {
        const { id } = req.params;
        const ventas = await Venta.find({ cliente: id })
            .populate('vendedor', 'nombre')
            .populate('productos.perfume', 'nombre imagen_url')
            .sort({ fecha_venta: -1 });

        res.json({
            ok: true,
            data: ventas
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al obtener historial de compras'
        });
    }
};

module.exports = {
    obtenerClientes,
    obtenerClientesInactivos,
    crearCliente,
    actualizarCliente,
    darBajaCliente,
    reactivarCliente,
    obtenerHistorialCompras
};
