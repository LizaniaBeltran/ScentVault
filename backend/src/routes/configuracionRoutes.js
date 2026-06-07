const express = require('express');
const router = express.Router();
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');
const { obtenerPerfil, actualizarPerfil, cambiarPassword } = require('../controllers/configuracionController');

router.get('/perfil', verificarToken, permitirRoles('admin'), obtenerPerfil);
router.put('/perfil', verificarToken, permitirRoles('admin'), actualizarPerfil);
router.put('/password', verificarToken, cambiarPassword);

module.exports = router;
