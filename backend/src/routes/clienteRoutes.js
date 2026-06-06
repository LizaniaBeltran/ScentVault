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

module.exports = router;