const pool = require('../config/db');

const obtenerClientes = async () => {
    const result = await pool.query(
        'SELECT * FROM clientes ORDER BY id DESC'
    );

    return result.rows;
};

const crearCliente = async (cliente) => {

    const query = `
        INSERT INTO clientes (
            nombre,
            telefono,
            correo,
            preferencia_olfativa
        )
        VALUES ($1,$2,$3,$4)
        RETURNING *;
    `;

    const values = [
        cliente.nombre,
        cliente.telefono,
        cliente.correo,
        cliente.preferencia_olfativa
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const actualizarCliente = async (id, cliente) => {

    const query = `
        UPDATE clientes
        SET
            nombre = $1,
            telefono = $2,
            correo = $3,
            preferencia_olfativa = $4
        WHERE id = $5
        RETURNING *;
    `;

    const values = [
        cliente.nombre,
        cliente.telefono,
        cliente.correo,
        cliente.preferencia_olfativa,
        id
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

module.exports = {
    obtenerClientes,
    crearCliente,
    actualizarCliente
};