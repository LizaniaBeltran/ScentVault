const Perfume = require('../models/perfumeModel');
const Cliente = require('../models/clienteModel');
const Venta = require('../models/ventaModel');

const obtenerResumenDashboard = async (req, res) => {
    try {
        // Total de perfumes
        const totalPerfumes = await Perfume.countDocuments({ activo: true });

        // Total de clientes
        const totalClientes = await Cliente.countDocuments();

        // Total de ventas
        const totalVentas = await Venta.countDocuments();

        // Valor total del inventario
        const perfumes = await Perfume.find({ activo: true });
        const valorInventario = perfumes.reduce((total, perfume) => {
            return total + (perfume.precio * perfume.stock);
        }, 0);

        // Ventas del mes actual
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const ventasMes = await Venta.aggregate([
            {
                $match: {
                    fecha_venta: {
                        $gte: inicioMes,
                        $lte: ahora
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalVentas: { $sum: '$total' },
                    cantidadVentas: { $sum: 1 }
                }
            }
        ]);

        const totalVentasMes = ventasMes.length > 0 ? ventasMes[0].totalVentas : 0;
        const cantidadVentasMes = ventasMes.length > 0 ? ventasMes[0].cantidadVentas : 0;

        res.json({
            ok: true,
            data: {
                perfumes: totalPerfumes,
                total_perfumes: totalPerfumes,
                totalPerfumes,
                clientes: totalClientes,
                total_clientes: totalClientes,
                totalClientes,
                ventas: totalVentas,
                total_ventas: totalVentas,
                totalVentas,
                ingresos: totalVentasMes,
                total_ingresos: totalVentasMes,
                totalVentasMes,
                valor_inventario: valorInventario,
                valorInventario
            }
        });
    } catch (error) {
        console.error('Error al obtener resumen dashboard:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al obtener resumen del dashboard'
        });
    }
};

module.exports = {
    obtenerResumenDashboard
};
