const pool = require('../config/db');

const obtenerVentas = async () => {
    const query = `
        SELECT 
            v.id,
            v.fecha_venta,
            v.metodo_pago,
            v.total,
            c.nombre AS cliente,
            u.nombre AS vendedor
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        INNER JOIN usuarios u ON v.usuario_id = u.id
        ORDER BY v.id DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
};

const crearVenta = async (venta, usuarioId) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { cliente_id, metodo_pago, productos } = venta;

        let totalVenta = 0;

        const ventaResult = await client.query(
            `INSERT INTO ventas (cliente_id, usuario_id, metodo_pago, total)
             VALUES ($1, $2, $3, $4)
             RETURNING *;`,
            [cliente_id, usuarioId, metodo_pago, 0]
        );

        const ventaCreada = ventaResult.rows[0];

        for (const item of productos) {
            const perfumeResult = await client.query(
                `SELECT id, nombre, precio, stock
                 FROM perfumes
                 WHERE id = $1 AND activo = true
                 FOR UPDATE;`,
                [item.perfume_id]
            );

            if (perfumeResult.rows.length === 0) {
                throw new Error(`El perfume con ID ${item.perfume_id} no existe`);
            }

            const perfume = perfumeResult.rows[0];

            if (perfume.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para ${perfume.nombre}`);
            }

            const precioUnitario = Number(perfume.precio);
            const subtotal = precioUnitario * item.cantidad;
            totalVenta += subtotal;

            await client.query(
                `INSERT INTO detalle_ventas (
                    venta_id,
                    perfume_id,
                    cantidad,
                    precio_unitario,
                    subtotal
                )
                VALUES ($1, $2, $3, $4, $5);`,
                [
                    ventaCreada.id,
                    item.perfume_id,
                    item.cantidad,
                    precioUnitario,
                    subtotal
                ]
            );

            await client.query(
                `UPDATE perfumes
                 SET stock = stock - $1
                 WHERE id = $2;`,
                [item.cantidad, item.perfume_id]
            );
        }

        const ventaFinal = await client.query(
            `UPDATE ventas
             SET total = $1
             WHERE id = $2
             RETURNING *;`,
            [totalVenta, ventaCreada.id]
        );

        await client.query('COMMIT');

        return ventaFinal.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    obtenerVentas,
    crearVenta
};