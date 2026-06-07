const Perfume = require('../models/perfumeModel');

const obtenerInventario = async (req, res) => {
    try {
        const { estado, familia, orden } = req.query;
        let filtro = {};

        if (estado === 'disponible') filtro = { activo: true, stock: { $gt: 5 } };
        else if (estado === 'bajo') filtro = { activo: true, stock: { $gt: 0, $lte: 5 } };
        else if (estado === 'agotado') filtro = { activo: true, stock: 0 };
        else if (estado === 'inactivo') filtro = { activo: false };
        else filtro = {};

        if (familia) filtro.familia_olfativa = familia;

        let sortOption = { nombre: 1 };
        if (orden === 'stock_asc') sortOption = { stock: 1 };
        else if (orden === 'stock_desc') sortOption = { stock: -1 };
        else if (orden === 'precio_asc') sortOption = { precio: 1 };
        else if (orden === 'precio_desc') sortOption = { precio: -1 };

        const perfumes = await Perfume.find(filtro).sort(sortOption);

        const resumen = {
            total_activos: await Perfume.countDocuments({ activo: true }),
            stock_total: 0,
            agotados: 0,
            bajo_stock: 0,
            valor_inventario: 0,
            familias: await Perfume.distinct('familia_olfativa', { activo: true })
        };

        const activos = await Perfume.find({ activo: true });
        for (const p of activos) {
            resumen.stock_total += p.stock;
            resumen.valor_inventario += p.precio * p.stock;
            if (p.stock === 0) resumen.agotados++;
            else if (p.stock <= 5) resumen.bajo_stock++;
        }

        res.json({ ok: true, data: perfumes, resumen });
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ ok: false, error: 'Error al obtener inventario' });
    }
};

module.exports = { obtenerInventario };
