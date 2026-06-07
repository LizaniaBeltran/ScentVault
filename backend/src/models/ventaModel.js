const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente'
    },
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productos: [{
        perfume: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Perfume',
            required: true
        },
        nombre: String,
        cantidad: {
            type: Number,
            required: true
        },
        precio_unitario: {
            type: Number,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        default: 0
    },
    iva: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    metodo_pago: {
        type: String,
        required: true
    },
    fecha_venta: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Venta', ventaSchema);
