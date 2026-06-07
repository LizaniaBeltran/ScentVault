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
        const perfumeData = req.body;
        
        // Si se subió una imagen, agregar URL de Cloudinary
        if (req.file) {
            perfumeData.imagen_url = req.file.secure_url;
        }
        
        const nuevoPerfume = await perfumeModel.crearPerfume(perfumeData);

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
        
        // Si se subió una nueva imagen, agregar URL de Cloudinary
        if (req.file) {
            perfumeData.imagen_url = req.file.secure_url;
        }
        // Si no se subió imagen, no modificar imagen_url (conservar la anterior)
        
        const perfumeActualizado = await perfumeModel.actualizarPerfume(id, perfumeData);

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

module.exports = {
    obtenerPerfumes,
    crearPerfume,
    actualizarPerfume
};