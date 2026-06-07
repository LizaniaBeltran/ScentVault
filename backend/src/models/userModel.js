const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    correo: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password_hash: {
        type: String,
        required: true
    },
    rol: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    activo: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

userSchema.methods.comparePassword = async function(passwordIngresada) {
    return await bcrypt.compare(passwordIngresada, this.password_hash);
};

module.exports = mongoose.model('User', userSchema);
