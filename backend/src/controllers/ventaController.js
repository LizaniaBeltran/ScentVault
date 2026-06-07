const Venta = require('../models/ventaModel');
const Perfume = require('../models/perfumeModel');

const transformarVenta = (venta) => ({
    id: venta._id,
    fecha_venta: venta.fecha_venta,
    metodo_pago: venta.metodo_pago,
    total: venta.total,
    subtotal: venta.subtotal,
    iva: venta.iva,
    cliente: venta.cliente ? venta.cliente.nombre || 'Cliente mostrador' : 'Cliente mostrador',
    cliente_id: venta.cliente ? venta.cliente._id || null : null,
    vendedor: venta.vendedor ? venta.vendedor.nombre || '' : '',
    vendedor_id: venta.vendedor ? venta.vendedor._id || null : null,
    productos: venta.productos || []
});

const obtenerVentas = async (req, res) => {
    try {
        const filtro = req.usuario?.rol === 'vendedor' ? { vendedor: req.usuario.id } : {};
        const ventas = await Venta.find(filtro)
            .populate('cliente', 'nombre')
            .populate('vendedor', 'nombre')
            .sort({ fecha_venta: -1 });

        const ventasTransformadas = ventas.map(transformarVenta);

        res.json({
            ok: true,
            data: ventasTransformadas
        });
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al obtener ventas'
        });
    }
};

const obtenerVentaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const filtro = req.usuario?.rol === 'vendedor' ? { _id: id, vendedor: req.usuario.id } : { _id: id };
        const venta = await Venta.findOne(filtro)
            .populate('cliente', 'nombre telefono correo')
            .populate('vendedor', 'nombre correo')
            .populate('productos.perfume', 'nombre marca imagen_url');

        if (!venta) {
            return res.status(404).json({
                ok: false,
                error: 'Venta no encontrada'
            });
        }

        res.json({
            ok: true,
            data: transformarVenta(venta)
        });
    } catch (error) {
        console.error('Error al obtener venta:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al obtener venta'
        });
    }
};

const crearVenta = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { cliente, metodo_pago, productos } = req.body;

        let subtotal = 0;
        const productosVenta = [];

        for (const item of productos) {
            const perfume = await Perfume.findById(item.perfume);

            if (!perfume) {
                return res.status(404).json({
                    ok: false,
                    error: `El perfume con ID ${item.perfume} no existe`
                });
            }

            if (!perfume.activo) {
                return res.status(400).json({
                    ok: false,
                    error: `${perfume.nombre} está inactivo y no puede venderse`
                });
            }

            if (perfume.stock < item.cantidad) {
                return res.status(400).json({
                    ok: false,
                    error: `Stock insuficiente para ${perfume.nombre}. Disponible: ${perfume.stock}`
                });
            }

            const precioUnitario = Number(perfume.precio);
            const itemSubtotal = precioUnitario * item.cantidad;
            subtotal += itemSubtotal;

            productosVenta.push({
                perfume: perfume._id,
                nombre: perfume.nombre,
                imagen_url: perfume.imagen_url || null,
                cantidad: item.cantidad,
                precio_unitario: precioUnitario,
                subtotal: itemSubtotal
            });

            perfume.stock -= item.cantidad;
            await perfume.save();
        }

        const iva = subtotal * 0.16;
        const total = subtotal + iva;

        const nuevaVenta = new Venta({
            cliente: cliente || null,
            vendedor: usuarioId,
            productos: productosVenta,
            subtotal,
            iva,
            total,
            metodo_pago,
            fecha_venta: new Date()
        });

        await nuevaVenta.save();

        const ventaGuardada = await Venta.findById(nuevaVenta._id)
            .populate('cliente', 'nombre')
            .populate('vendedor', 'nombre')
            .populate('productos.perfume', 'nombre imagen_url');

        res.status(201).json({
            ok: true,
            message: 'Venta registrada correctamente',
            data: transformarVenta(ventaGuardada)
        });

    } catch (error) {
        console.error('Error al crear venta:', error);
        res.status(400).json({
            ok: false,
            error: error.message || 'Error al registrar venta'
        });
    }
};

const buscarPerfumesVenta = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 1) {
            return res.json({ ok: true, data: [] });
        }

        const perfumes = await Perfume.find({
            activo: true,
            stock: { $gt: 0 },
            $or: [
                { nombre: { $regex: q, $options: 'i' } },
                { marca: { $regex: q, $options: 'i' } }
            ]
        }).limit(10);

        res.json({ ok: true, data: perfumes });
    } catch (error) {
        console.error('Error al buscar perfumes:', error);
        res.status(500).json({ ok: false, error: 'Error al buscar perfumes' });
    }
};

module.exports = {
    obtenerVentas,
    obtenerVentaPorId,
    crearVenta,
    buscarPerfumesVenta
};
