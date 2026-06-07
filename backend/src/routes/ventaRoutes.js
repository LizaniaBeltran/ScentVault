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

router.get(
    '/buscar-perfumes',
    verificarToken,
    ventaController.buscarPerfumesVenta
);

router.get(
    '/:id',
    verificarToken,
    ventaController.obtenerVentaPorId
);

router.post(
    '/',
    verificarToken,
    permitirRoles('admin', 'vendedor'),
    validarVenta,
    ventaController.crearVenta
);

module.exports = router;
