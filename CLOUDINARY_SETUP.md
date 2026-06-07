# Configuración de Cloudinary para ScentVault

## Paso 1: Crear cuenta en Cloudinary

1. Ve a [https://cloudinary.com/](https://cloudinary.com/)
2. Haz clic en "Sign Up for Free"
3. Completa el registro con email y contraseña
4. Verifica tu email

## Paso 2: Obtener credenciales

1. Una vez registrado, ve al Dashboard de Cloudinary
2. En la sección "Account Details" encontrarás:
   - **Cloud Name**: Tu nombre único en Cloudinary
   - **API Key**: Tu clave API pública
   - **API Secret**: Tu clave secreta (⚠️ NUNCA expongas esto en el frontend)

## Paso 3: Configurar variables de entorno

1. Abre `backend/.env`
2. Agrega las siguientes variables:

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
CLOUDINARY_API_KEY=tu_api_key_aqui
CLOUDINARY_API_SECRET=tu_api_secret_aqui
```

**Importante:** 
- NUNCA commits el archivo `.env` a GitHub
- NUNCA expongas `CLOUDINARY_API_SECRET` en el frontend
- El servidor usará estas variables de forma segura

## Paso 4: Verificar instalación

Las dependencias ya están instaladas:
- `cloudinary`
- `multer`
- `multer-storage-cloudinary`

## Paso 5: Usar la funcionalidad

- Abre el módulo "Perfumes" en ScentVault
- En el formulario, selecciona un archivo de imagen (JPG, PNG, WebP)
- Las imágenes se subirán a Cloudinary automáticamente
- Solo la URL segura se guardará en la base de datos

## Estructura de carpetas en Cloudinary

Las imágenes se organizarán así:
```
scentvault/
└── perfumes/
    ├── perfume_1234567890_abc123xyz.jpg
    ├── perfume_1234567891_def456uvw.png
    └── ...
```

## Límites de subida

- **Tamaño máximo**: 5MB
- **Formatos permitidos**: JPG, JPEG, PNG, WebP
- **Validación**: En frontend y backend

## En caso de error

Si recibes errores al subir:

1. Verifica que `.env` tenga las variables correctas
2. Comprueba tu plan en Cloudinary (hay límite de requests en plan gratuito)
3. Revisa que el archivo sea una imagen válida
4. Consulta logs del servidor: `npm run dev` en backend
