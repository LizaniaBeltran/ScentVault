const express = require('express');
const router = express.Router();
const { exportPDF, exportExcel } = require('../controllers/exportController');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.get('/pdf', verificarToken, permitirRoles('admin'), exportPDF);
router.get('/excel', verificarToken, permitirRoles('admin'), exportExcel);

module.exports = router;