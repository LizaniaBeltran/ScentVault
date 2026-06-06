const { body, validationResult } = require('express-validator');

const validarCliente = [

    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio'),

    body('telefono')
        .trim()
        .notEmpty()
        .withMessage('El teléfono es obligatorio'),

    body('correo')
        .isEmail()
        .withMessage('Correo electrónico inválido'),

    body('preferencia_olfativa')
        .trim()
        .notEmpty()
        .withMessage('La preferencia olfativa es obligatoria'),

    (req, res, next) => {

        const errores = validationResult(req);

        if (!errores.isEmpty()) {

            return res.status(400).json({
                ok: false,
                errores: errores.array()
            });

        }

        next();
    }
];

module.exports = {
    validarCliente
};