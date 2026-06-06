const express = require('express');
const router = express.Router();

const ventaController = require('../controllers/ventaController');

const {
    verificarToken,
    permitirRoles
} = require('../middlewares/authMiddleware');

const {
    validarVenta
} = require('../middlewares/ventaValidator');

router.get(
    '/',
    verificarToken,
    ventaController.obtenerVentas
);

router.post(
    '/',
    verificarToken,
    permitirRoles('admin', 'vendedor'),
    validarVenta,
    ventaController.crearVenta
);

module.exports = router;