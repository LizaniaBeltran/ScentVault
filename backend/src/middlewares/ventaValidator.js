const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const validarVenta = [
    body('cliente')
        .optional({ nullable: true })
        .custom(value => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('El cliente debe ser válido');
            }
            return true;
        }),

    body('metodo_pago')
        .trim()
        .notEmpty()
        .withMessage('El método de pago es obligatorio'),

    body('productos')
        .isArray({ min: 1 })
        .withMessage('Debe agregar al menos un producto'),

    body('productos.*.perfume')
        .custom(value => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('El perfume debe ser válido');
            }
            return true;
        }),

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
