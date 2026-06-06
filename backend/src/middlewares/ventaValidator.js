const { body, validationResult } = require('express-validator');

const validarVenta = [
    body('cliente_id')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('El cliente debe ser válido'),

    body('metodo_pago')
        .trim()
        .notEmpty()
        .withMessage('El método de pago es obligatorio'),

    body('productos')
        .isArray({ min: 1 })
        .withMessage('Debe agregar al menos un producto'),

    body('productos.*.perfume_id')
        .isInt({ min: 1 })
        .withMessage('El perfume debe ser válido'),

    body('productos.*.cantidad')
        .isInt({ min: 1 })
        .withMessage('La cantidad debe ser mayor a cero'),

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
    validarVenta
};