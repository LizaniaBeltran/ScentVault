const Perfume = require('../models/perfumeModel');
const Cliente = require('../models/clienteModel');
const Venta = require('../models/ventaModel');
const mongoose = require('mongoose');

const obtenerResumenDashboard = async (req, res) => {
    try {
        const ahora = new Date();
        const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const esVendedor = req.usuario?.rol === 'vendedor';
        const vendedorId = esVendedor ? new mongoose.Types.ObjectId(req.usuario.id) : null;
        const filtroVentasRol = esVendedor ? { vendedor: vendedorId } : {};

        const [totalPerfumes, perfumesDisponibles, totalClientes, totalVentas, perfumes, ventasDia, ventasMes, clientesAtendidos, ultimosClientes, ultimasVentas, ultimosPerfumes] = await Promise.all([
            Perfume.countDocuments({ activo: true }),
            Perfume.countDocuments({ activo: true, stock: { $gt: 0 } }),
            Cliente.countDocuments({ activo: true }),
            Venta.countDocuments(filtroVentasRol),
            Perfume.find({ activo: true }).select('precio stock'),
            Venta.aggregate([{ $match: { ...filtroVentasRol, fecha_venta: { $gte: inicioHoy, $lte: ahora } } }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
            Venta.aggregate([{ $match: { ...filtroVentasRol, fecha_venta: { $gte: inicioMes, $lte: ahora } } }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
            Venta.distinct('cliente', { ...filtroVentasRol, cliente: { $ne: null }, fecha_venta: { $gte: inicioMes, $lte: ahora } }),
            Cliente.find({ activo: true }).sort({ createdAt: -1 }).limit(5).select('nombre correo createdAt'),
            Venta.find(filtroVentasRol).sort({ fecha_venta: -1 }).limit(5).populate('cliente', 'nombre').select('total metodo_pago fecha_venta productos cliente vendedor'),
            Perfume.find({ activo: true }).sort({ createdAt: -1 }).limit(5).select('nombre marca precio imagen_url stock')
        ]);

        const valorInventario = perfumes.reduce((t, p) => t + (p.precio * p.stock), 0);
        const totalVentasDia = ventasDia.length > 0 ? ventasDia[0].total : 0;
        const totalVentasMes = ventasMes.length > 0 ? ventasMes[0].total : 0;
        const productosAgotados = perfumes.filter(p => p.stock === 0).length;
        const productosBajoStock = perfumes.filter(p => p.stock > 0 && p.stock <= 5).length;

        res.json({
            ok: true,
            data: {
                perfumes: esVendedor ? perfumesDisponibles : totalPerfumes,
                clientes: esVendedor ? clientesAtendidos.filter(Boolean).length : totalClientes,
                ventas: totalVentas,
                ventas_dia: totalVentasDia,
                ventas_mes: totalVentasMes,
                valor_inventario: esVendedor ? undefined : valorInventario,
                agotados: esVendedor ? undefined : productosAgotados,
                bajo_stock: esVendedor ? undefined : productosBajoStock,
                ultimos_clientes: ultimosClientes,
                ultimas_ventas: ultimasVentas,
                ultimos_perfumes: ultimosPerfumes
            }
        });
    } catch (error) {
        console.error('Error en dashboard:', error);
        res.status(500).json({ ok: false, error: 'Error al obtener resumen del dashboard' });
    }
};

module.exports = {
    obtenerResumenDashboard
};
