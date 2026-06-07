const Perfume = require('../models/perfumeModel');

const obtenerPerfumes = async (req, res) => {
    try {
        const perfumes = await Perfume.find({ activo: true }).sort({ createdAt: -1 });

        res.json({
            ok: true,
            data: perfumes
        });
    } catch (error) {
        console.error('Error al obtener perfumes:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al obtener perfumes'
        });
    }
};

const obtenerPerfumePorId = async (req, res) => {
    try {
        const { id } = req.params;
        const perfume = await Perfume.findById(id);

        if (!perfume) {
            return res.status(404).json({
                ok: false,
                error: 'Perfume no encontrado'
            });
        }

        res.json({
            ok: true,
            data: perfume
        });
    } catch (error) {
        console.error('Error al obtener perfume:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al obtener perfume'
        });
    }
};

const crearPerfume = async (req, res) => {
    try {
        const perfumeData = req.body;
        
        if (req.file) {
            perfumeData.imagen_url = req.file.secure_url;
        }
        
        const nuevoPerfume = new Perfume(perfumeData);
        await nuevoPerfume.save();

        res.status(201).json({
            ok: true,
            message: 'Perfume registrado correctamente',
            data: nuevoPerfume
        });
    } catch (error) {
        console.error('Error al crear perfume:', error);
        res.status(500).json({
            ok: false,
            error: error.message || 'Error al registrar perfume'
        });
    }
};

const actualizarPerfume = async (req, res) => {
    try {
        const { id } = req.params;
        const perfumeData = req.body;
        
        if (req.file) {
            perfumeData.imagen_url = req.file.secure_url;
        }
        
        const perfumeActualizado = await Perfume.findByIdAndUpdate(
            id,
            perfumeData,
            { new: true }
        );

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
        console.error('Error al actualizar perfume:', error);
        res.status(500).json({
            ok: false,
            error: error.message || 'Error al actualizar perfume'
        });
    }
};

const eliminarPerfume = async (req, res) => {
    try {
        const { id } = req.params;
        const perfumeEliminado = await Perfume.findByIdAndDelete(id);

        if (!perfumeEliminado) {
            return res.status(404).json({
                ok: false,
                error: 'Perfume no encontrado'
            });
        }

        res.json({
            ok: true,
            message: 'Perfume eliminado correctamente',
            data: perfumeEliminado
        });
    } catch (error) {
        console.error('Error al eliminar perfume:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al eliminar perfume'
        });
    }
};

module.exports = {
    obtenerPerfumes,
    obtenerPerfumePorId,
    crearPerfume,
    actualizarPerfume,
    eliminarPerfume
};
