const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Storage Cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: 'scentvault/perfumes',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        public_id: `perfume_${Date.now()}`,
        transformation: [
            {
                width: 800,
                height: 800,
                crop: 'limit',
                quality: 'auto'
            }
        ]
    })
});

// Validación de tipos de archivo
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes JPG, JPEG, PNG y WEBP'));
    }
};

// Configuración multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

module.exports = upload;