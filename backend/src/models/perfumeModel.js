const mongoose = require('mongoose');

const perfumeSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    marca: {
        type: String,
        required: true
    },
    familia_olfativa: {
        type: String
    },
    notas_salida: {
        type: String
    },
    notas_medias: {
        type: String
    },
    notas_fondo: {
        type: String
    },
    temporada: {
        type: String
    },
    duracion_horas: {
        type: Number
    },
    precio: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    imagen_url: {
        type: String
    },
    descripcion: {
        type: String
    },
    activo: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Perfume', perfumeSchema);
