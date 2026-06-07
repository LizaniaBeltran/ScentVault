const express = require('express');
const router = express.Router();

const perfumeController = require('../controllers/perfumeController');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');
const { validarPerfume } = require('../middlewares/perfumeValidator');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', verificarToken, perfumeController.obtenerPerfumes);

router.post(
    '/',
    verificarToken,
    permitirRoles('admin', 'vendedor'),
    upload.single('imagen'),
    validarPerfume,
    perfumeController.crearPerfume
);

router.put(
    '/:id',
    verificarToken,
    permitirRoles('admin', 'vendedor'),
    upload.single('imagen'),
    validarPerfume,
    perfumeController.actualizarPerfume
);

module.exports = router;