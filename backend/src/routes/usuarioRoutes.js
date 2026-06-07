const express = require('express');
const router = express.Router();
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');
const {
    obtenerUsuarios, crearUsuario, actualizarUsuario,
    darBajaUsuario, reactivarUsuario
} = require('../controllers/usuarioController');

router.get('/', verificarToken, permitirRoles('admin'), obtenerUsuarios);
router.post('/', verificarToken, permitirRoles('admin'), crearUsuario);
router.put('/:id', verificarToken, permitirRoles('admin'), actualizarUsuario);
router.patch('/:id/baja', verificarToken, permitirRoles('admin'), darBajaUsuario);
router.patch('/:id/reactivar', verificarToken, permitirRoles('admin'), reactivarUsuario);

module.exports = router;
