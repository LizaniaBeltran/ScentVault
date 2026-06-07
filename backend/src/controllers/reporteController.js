const Venta = require('../models/ventaModel');
const Perfume = require('../models/perfumeModel');
const Cliente = require('../models/clienteModel');

function getDateRange(query) {
    const ahora = new Date();
    const defaultStart = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
    const inicio = query.fecha_inicio ? new Date(`${query.fecha_inicio}T00:00:00`) : defaultStart;
    const fin = query.fecha_fin ? new Date(`${query.fecha_fin}T23:59:59.999`) : ahora;
    return {
        inicio: Number.isNaN(inicio.getTime()) ? defaultStart : inicio,
        fin: Number.isNaN(fin.getTime()) ? ahora : fin
    };
}

const obtenerReportes = async (req, res) => {
    try {
        const ahora = new Date();
        const { inicio, fin } = getDateRange(req.query);
        const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const rangoVentas = { fecha_venta: { $gte: inicio, $lte: fin } };

        // Ventas del día
        const ventasDia = await Venta.aggregate([
            { $match: { fecha_venta: { $gte: inicioDia, $lte: ahora } } },
            { $group: { _id: null, total: { $sum: '$total' }, cantidad: { $sum: 1 } } }
        ]);

        // Ventas del mes
        const ventasMes = await Venta.aggregate([
            { $match: { fecha_venta: { $gte: inicioMes, $lte: ahora } } },
            { $group: { _id: null, total: { $sum: '$total' }, cantidad: { $sum: 1 } } }
        ]);

        // Perfumes más vendidos
        const masVendidos = await Venta.aggregate([
            { $match: rangoVentas },
            { $unwind: '$productos' },
            { $group: { _id: '$productos.nombre', cantidad: { $sum: '$productos.cantidad' }, total: { $sum: '$productos.subtotal' } } },
            { $sort: { cantidad: -1 } },
            { $limit: 10 }
        ]);

        // Clientes frecuentes
        const clientesFrecuentes = await Venta.aggregate([
            { $match: { cliente: { $ne: null }, ...rangoVentas } },
            { $group: { _id: '$cliente', total_compras: { $sum: 1 }, total_gastado: { $sum: '$total' } } },
            { $sort: { total_compras: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'clientes', localField: '_id', foreignField: '_id', as: 'cliente' } },
            { $unwind: { path: '$cliente', preserveNullAndEmptyArrays: true } },
            { $project: { nombre: '$cliente.nombre', correo: '$cliente.correo', total_compras: 1, total_gastado: 1 } }
        ]);

        // Ventas por día (últimos 30 días)
        const ventasPorDia = await Venta.aggregate([
            { $match: rangoVentas },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$fecha_venta' } }, total: { $sum: '$total' }, cantidad: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Bajo stock
        const bajoStock = await Perfume.find({ activo: true, stock: { $gt: 0, $lte: 5 } }).sort({ stock: 1 });

        // Agotados
        const agotados = await Perfume.find({ activo: true, stock: 0 });

        // Valor inventario
        const perfumesActivos = await Perfume.find({ activo: true });
        const valorInventario = perfumesActivos.reduce((t, p) => t + (p.precio * p.stock), 0);

        // Ventas totales
        const totalVendido = await Venta.aggregate([
            { $match: rangoVentas },
            { $group: { _id: null, total: { $sum: '$total' }, cantidad: { $sum: 1 } } }
        ]);

        res.json({
            ok: true,
            data: {
                ventas_dia: ventasDia[0] || { total: 0, cantidad: 0 },
                ventas_mes: ventasMes[0] || { total: 0, cantidad: 0 },
                total_vendido: totalVendido[0] || { total: 0, cantidad: 0 },
                mas_vendidos: masVendidos,
                clientes_frecuentes: clientesFrecuentes,
                ventas_por_dia: ventasPorDia,
                bajo_stock: bajoStock,
                agotados: agotados,
                valor_inventario: valorInventario
                , fecha_inicio: inicio,
                fecha_fin: fin
            }
        });
    } catch (error) {
        console.error('Error al obtener reportes:', error);
        res.status(500).json({ ok: false, error: 'Error al obtener reportes' });
    }
};

module.exports = { obtenerReportes };
