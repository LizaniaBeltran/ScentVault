const express = require('express');
const router = express.Router();
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');
const { obtenerReportes } = require('../controllers/reporteController');

router.get('/', verificarToken, permitirRoles('admin'), obtenerReportes);

module.exports = router;
