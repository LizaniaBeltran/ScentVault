const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('./models/roleModel');
require('./models/userModel');
require('./models/perfumeModel');
require('./models/clienteModel');
require('./models/ventaModel');

const perfumeRoutes = require('./routes/perfumeRoutes');
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();

app.use(helmet());

app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ]
}));

app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(limiter);

app.get('/', (req, res) => {
    res.json({
        ok: true,
        proyecto: 'ScentVault',
        version: '1.0'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/perfumes', perfumeRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/export', exportRoutes);

app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            ok: false,
            error: 'La imagen supera el límite de 5 MB'
        });
    }

    if (err.message && err.message.includes('Solo se permiten')) {
        return res.status(400).json({
            ok: false,
            error: err.message
        });
    }

    res.status(err.status || 500).json({
        ok: false,
        error: err.message || 'Error interno del servidor'
    });
});

module.exports = app;
