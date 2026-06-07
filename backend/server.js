require('dotenv').config();

const app = require('./src/app');
const connectMongo = require('./src/config/mongo');

const PORT = process.env.PORT || 3000;

connectMongo();

app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
});