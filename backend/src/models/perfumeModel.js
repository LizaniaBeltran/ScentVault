const pool = require('../config/db');

const obtenerPerfumes = async () => {
    const query = 'SELECT * FROM perfumes WHERE activo = true ORDER BY id DESC';
    const result = await pool.query(query);
    return result.rows;
};

const crearPerfume = async (perfume) => {
    const query = `
        INSERT INTO perfumes (
            nombre, marca, familia_olfativa, notas_salida, notas_medias,
            notas_fondo, temporada, duracion_horas, precio, stock, imagen_url, descripcion
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING *;
    `;

    const values = [
        perfume.nombre,
        perfume.marca,
        perfume.familia_olfativa,
        perfume.notas_salida,
        perfume.notas_medias,
        perfume.notas_fondo,
        perfume.temporada,
        perfume.duracion_horas,
        perfume.precio,
        perfume.stock,
        perfume.imagen_url,
        perfume.descripcion
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
};

const actualizarPerfume = async (id, perfume) => {
    const query = `
        UPDATE perfumes
        SET 
            nombre = $1,
            marca = $2,
            familia_olfativa = $3,
            notas_salida = $4,
            notas_medias = $5,
            notas_fondo = $6,
            temporada = $7,
            duracion_horas = $8,
            precio = $9,
            stock = $10,
            imagen_url = $11,
            descripcion = $12
        WHERE id = $13 AND activo = true
        RETURNING *;
    `;

    const values = [
        perfume.nombre,
        perfume.marca,
        perfume.familia_olfativa,
        perfume.notas_salida,
        perfume.notas_medias,
        perfume.notas_fondo,
        perfume.temporada,
        perfume.duracion_horas,
        perfume.precio,
        perfume.stock,
        perfume.imagen_url,
        perfume.descripcion,
        id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
};

module.exports = {
    obtenerPerfumes,
    crearPerfume,
    actualizarPerfume
};