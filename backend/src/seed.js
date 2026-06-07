require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Role = require('./models/roleModel');
const User = require('./models/userModel');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('✓ Conectado a MongoDB para seed');

        await Role.deleteMany({});
        await User.deleteMany({});

        const rolAdmin = await Role.create({ nombre: 'admin' });
        await Role.create({ nombre: 'vendedor' });

        console.log('✓ Roles creados');

        const hash = await bcrypt.hash('Admin12345', 10);

        const usuarioAdmin = new User({
            nombre: 'Administrador',
            correo: 'admin@scentvault.com',
            password_hash: hash,
            rol: rolAdmin._id,
            activo: true
        });

        await usuarioAdmin.save();
        console.log('✓ Usuario admin creado');

        console.log('\n✅ Seed completado exitosamente');
        console.log('\nCredenciales de acceso:');
        console.log('  Email: admin@scentvault.com');
        console.log('  Contraseña: Admin12345');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en seed:', error.message);
        process.exit(1);
    }
};

seedDatabase();
