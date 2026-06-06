const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        const result = await pool.query(
            `SELECT usuarios.id, usuarios.nombre, usuarios.correo, usuarios.password_hash,
                    usuarios.activo, roles.nombre AS rol
             FROM usuarios
             INNER JOIN roles ON usuarios.rol_id = roles.id
             WHERE usuarios.correo = $1`,
            [correo]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                ok: false,
                error: 'Credenciales incorrectas'
            });
        }

        const usuario = result.rows[0];

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
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
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
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 'Error al iniciar sesión'
        });
    }
};

module.exports = {
    login
};