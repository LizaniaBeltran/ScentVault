const express = require('express');
const router = express.Router();

const clienteController = require('../controllers/clienteController');

const {
    verificarToken,
    permitirRoles
} = require('../middlewares/authMiddleware');

const {
    validarCliente
} = require('../middlewares/clienteValidator');

router.get(
    '/',
    verificarToken,
    clienteController.obtenerClientes
);

router.get(
    '/inactivos',
    verificarToken,
    permitirRoles('admin'),
    clienteController.obtenerClientesInactivos
);

router.get(
    '/:id/historial',
    verificarToken,
    clienteController.obtenerHistorialCompras
);

router.post(
    '/',
    verificarToken,
    permitirRoles('admin', 'vendedor'),
    validarCliente,
    clienteController.crearCliente
);

router.put(
    '/:id',
    verificarToken,
    permitirRoles('admin', 'vendedor'),
    validarCliente,
    clienteController.actualizarCliente
);

router.patch(
    '/:id/baja',
    verificarToken,
    permitirRoles('admin'),
    clienteController.darBajaCliente
);

router.patch(
    '/:id/reactivar',
    verificarToken,
    permitirRoles('admin'),
    clienteController.reactivarCliente
);

module.exports = router;
