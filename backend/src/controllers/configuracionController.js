const User = require('../models/userModel');
const bcrypt = require('bcrypt');

const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await User.findById(req.usuario.id).populate('rol', 'nombre');
        if (!usuario) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }

        res.json({
            ok: true,
            data: {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol ? usuario.rol.nombre : '',
                activo: usuario.activo
            }
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ ok: false, error: 'Error al obtener perfil' });
    }
};

const actualizarPerfil = async (req, res) => {
    try {
        const { nombre, correo } = req.body;
        const usuario = await User.findByIdAndUpdate(
            req.usuario.id,
            { nombre, correo },
            { new: true }
        ).populate('rol', 'nombre');

        if (!usuario) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }

        res.json({
            ok: true,
            message: 'Perfil actualizado correctamente',
            data: { id: usuario._id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol.nombre }
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ ok: false, error: 'Error al actualizar perfil' });
    }
};

const cambiarPassword = async (req, res) => {
    try {
        const { password_actual, password_nuevo } = req.body;

        const usuario = await User.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }

        const valida = await bcrypt.compare(password_actual, usuario.password_hash);
        if (!valida) {
            return res.status(400).json({ ok: false, error: 'La contraseña actual es incorrecta' });
        }

        const salt = await bcrypt.genSalt(10);
        usuario.password_hash = await bcrypt.hash(password_nuevo, salt);
        await usuario.save();

        res.json({ ok: true, message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ ok: false, error: 'Error al cambiar contraseña' });
    }
};

module.exports = { obtenerPerfil, actualizarPerfil, cambiarPassword };
