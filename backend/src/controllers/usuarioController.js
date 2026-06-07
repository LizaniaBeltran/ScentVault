const User = require('../models/userModel');
const Role = require('../models/roleModel');
const bcrypt = require('bcrypt');

const obtenerUsuarios = async (req, res) => {
    try {
        const { rol } = req.query;
        let filtro = {};
        if (rol) filtro.rol = await Role.findOne({ nombre: rol }).then(r => r?._id);

        const usuarios = await User.find(filtro)
            .populate('rol', 'nombre')
            .select('-password_hash')
            .sort({ createdAt: -1 });

        res.json({ ok: true, data: usuarios });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ ok: false, error: 'Error al obtener usuarios' });
    }
};

const crearUsuario = async (req, res) => {
    try {
        const { nombre, correo, password, rol } = req.body;

        const existe = await User.findOne({ correo: correo.toLowerCase() });
        if (existe) {
            return res.status(400).json({ ok: false, error: 'El correo ya está registrado' });
        }

        const roleDoc = await Role.findOne({ nombre: rol });
        if (!roleDoc) {
            return res.status(400).json({ ok: false, error: 'Rol no válido' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const nuevo = new User({ nombre, correo: correo.toLowerCase(), password_hash, rol: roleDoc._id });
        await nuevo.save();

        const usuario = await User.findById(nuevo._id).populate('rol', 'nombre').select('-password_hash');

        res.status(201).json({ ok: true, message: 'Usuario creado correctamente', data: usuario });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ ok: false, error: error.message || 'Error al crear usuario' });
    }
};

const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo, rol, password } = req.body;

        const updateData = {};
        if (nombre) updateData.nombre = nombre;
        if (correo) updateData.correo = correo.toLowerCase();
        if (rol) {
            const roleDoc = await Role.findOne({ nombre: rol });
            if (roleDoc) updateData.rol = roleDoc._id;
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(password, salt);
        }

        const usuario = await User.findByIdAndUpdate(id, updateData, { new: true })
            .populate('rol', 'nombre')
            .select('-password_hash');

        if (!usuario) {
            return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        }

        res.json({ ok: true, message: 'Usuario actualizado correctamente', data: usuario });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ ok: false, error: 'Error al actualizar usuario' });
    }
};

const darBajaUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await User.findByIdAndUpdate(id, { activo: false }, { new: true })
            .populate('rol', 'nombre')
            .select('-password_hash');

        if (!usuario) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });

        res.json({ ok: true, message: 'Usuario dado de baja correctamente', data: usuario });
    } catch (error) {
        console.error('Error al dar de baja usuario:', error);
        res.status(500).json({ ok: false, error: 'Error al dar de baja usuario' });
    }
};

const reactivarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await User.findByIdAndUpdate(id, { activo: true }, { new: true })
            .populate('rol', 'nombre')
            .select('-password_hash');

        if (!usuario) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });

        res.json({ ok: true, message: 'Usuario reactivado correctamente', data: usuario });
    } catch (error) {
        console.error('Error al reactivar usuario:', error);
        res.status(500).json({ ok: false, error: 'Error al reactivar usuario' });
    }
};

module.exports = { obtenerUsuarios, crearUsuario, actualizarUsuario, darBajaUsuario, reactivarUsuario };
