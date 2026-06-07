const express = require('express');
const router = express.Router();
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');
const { obtenerInventario } = require('../controllers/inventarioController');

router.get('/', verificarToken, permitirRoles('admin'), obtenerInventario);

module.exports = router;
