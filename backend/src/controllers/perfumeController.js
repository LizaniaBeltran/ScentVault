const perfumeModel = require('../models/perfumeModel');

const obtenerPerfumes = async (req, res) => {
    try {
        const perfumes = await perfumeModel.obtenerPerfumes();

        res.json({
            ok: true,
            data: perfumes
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 'Error al obtener perfumes'
        });
    }
};

const crearPerfume = async (req, res) => {
    try {
        const nuevoPerfume = await perfumeModel.crearPerfume(req.body);

        res.status(201).json({
            ok: true,
            message: 'Perfume registrado correctamente',
            data: nuevoPerfume
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 'Error al registrar perfume'
        });
    }
};

const actualizarPerfume = async (req, res) => {
    try {
        const { id } = req.params;
        const perfumeActualizado = await perfumeModel.actualizarPerfume(id, req.body);

        if (!perfumeActualizado) {
            return res.status(404).json({
                ok: false,
                error: 'Perfume no encontrado'
            });
        }

        res.json({
            ok: true,
            message: 'Perfume actualizado correctamente',
            data: perfumeActualizado
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 'Error al actualizar perfume'
        });
    }
};

module.exports = {
    obtenerPerfumes,
    crearPerfume,
    actualizarPerfume
};