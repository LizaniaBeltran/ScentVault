const Cliente = require('../models/clienteModel');

const obtenerClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find().sort({ createdAt: -1 });

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

module.exports = {
    obtenerClientes,
    crearCliente,
    actualizarCliente
};
