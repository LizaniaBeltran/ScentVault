const express = require('express');
const router = express.Router();

const perfumeController = require('../controllers/perfumeController');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');
const { validarPerfume } = require('../middlewares/perfumeValidator');

router.get('/', verificarToken, perfumeController.obtenerPerfumes);

router.post(
    '/',
    verificarToken,
    permitirRoles('admin', 'vendedor'),
    validarPerfume,
    perfumeController.crearPerfume
);

router.put(
    '/:id',
    verificarToken,
    permitirRoles('admin', 'vendedor'),
    validarPerfume,
    perfumeController.actualizarPerfume
);

module.exports = router;