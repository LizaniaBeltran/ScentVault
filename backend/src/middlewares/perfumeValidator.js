const { body, validationResult } = require('express-validator');

const validarPerfume = [

    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio'),

    body('marca')
        .trim()
        .notEmpty()
        .withMessage('La marca es obligatoria'),

    body('familia_olfativa')
        .trim()
        .notEmpty()
        .withMessage('La familia olfativa es obligatoria'),

    body('precio')
        .isFloat({ min: 1 })
        .withMessage('El precio debe ser mayor a cero'),

    body('stock')
        .isInt({ min: 0 })
        .withMessage('El stock no puede ser negativo'),

    body('duracion_horas')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('La duración debe ser positiva'),

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
    validarPerfume
};