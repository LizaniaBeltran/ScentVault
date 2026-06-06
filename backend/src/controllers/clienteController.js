const clienteModel = require('../models/clienteModel');

const obtenerClientes = async (req, res) => {

    try {

        const clientes = await clienteModel.obtenerClientes();

        res.json({
            ok: true,
            data: clientes
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            error: 'Error al obtener clientes'
        });

    }
};

const crearCliente = async (req, res) => {

    try {

        const cliente = await clienteModel.crearCliente(req.body);

        res.status(201).json({
            ok: true,
            message: 'Cliente registrado correctamente',
            data: cliente
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            error: 'Error al registrar cliente'
        });

    }
};

const actualizarCliente = async (req, res) => {

    try {

        const { id } = req.params;

        const cliente = await clienteModel.actualizarCliente(
            id,
            req.body
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