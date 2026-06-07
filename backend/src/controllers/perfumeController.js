const Perfume = require('../models/perfumeModel');
const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = async (file) => {
    try {
        const b64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(b64, {
            folder: 'scentvault/perfumes',
            public_id: `perfume_${Date.now()}`,
            transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
        });
        return result.secure_url;
    } catch (error) {
        console.error('Error subiendo a Cloudinary:', error.message);
        return null;
    }
};

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
            const url = await uploadToCloudinary(req.file);
            if (url) perfumeData.imagen_url = url;
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
            const url = await uploadToCloudinary(req.file);
            if (url) perfumeData.imagen_url = url;
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

const darBajaPerfume = async (req, res) => {
    try {
        const { id } = req.params;
        const perfume = await Perfume.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );

        if (!perfume) {
            return res.status(404).json({
                ok: false,
                error: 'Perfume no encontrado'
            });
        }

        res.json({
            ok: true,
            message: 'Perfume dado de baja correctamente',
            data: perfume
        });
    } catch (error) {
        console.error('Error al dar de baja perfume:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al dar de baja perfume'
        });
    }
};

const reactivarPerfume = async (req, res) => {
    try {
        const { id } = req.params;
        const perfume = await Perfume.findByIdAndUpdate(
            id,
            { activo: true },
            { new: true }
        );

        if (!perfume) {
            return res.status(404).json({
                ok: false,
                error: 'Perfume no encontrado'
            });
        }

        res.json({
            ok: true,
            message: 'Perfume reactivado correctamente',
            data: perfume
        });
    } catch (error) {
        console.error('Error al reactivar perfume:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al reactivar perfume'
        });
    }
};

const obtenerPerfumesInactivos = async (req, res) => {
    try {
        const perfumes = await Perfume.find({ activo: false }).sort({ createdAt: -1 });

        res.json({
            ok: true,
            data: perfumes
        });
    } catch (error) {
        console.error('Error al obtener perfumes inactivos:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al obtener perfumes inactivos'
        });
    }
};

module.exports = {
    obtenerPerfumes,
    obtenerPerfumePorId,
    crearPerfume,
    actualizarPerfume,
    darBajaPerfume,
    reactivarPerfume,
    obtenerPerfumesInactivos
};
