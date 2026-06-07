const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        const usuario = await User.findOne({ correo: correo.toLowerCase() }).populate('rol');

        if (!usuario) {
            return res.status(401).json({
                ok: false,
                error: 'Credenciales incorrectas'
            });
        }

        if (!usuario.activo) {
            return res.status(403).json({
                ok: false,
                error: 'Usuario inactivo'
            });
        }

        const passwordValido = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValido) {
            return res.status(401).json({
                ok: false,
                error: 'Credenciales incorrectas'
            });
        }

        const token = jwt.sign(
            {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol.nombre
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );

        res.json({
            ok: true,
            message: 'Inicio de sesión correcto',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol.nombre
            }
        });

    } catch (error) {
        console.error('Error detallado en login:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            ok: false,
            error: 'Error al iniciar sesión'
        });
    }
};

module.exports = {
    login
};
