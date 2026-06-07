# 🎭 ScentVault - Sistema de Gestión de Perfumería de Lujo

## Resumen de Implementación Completada

### ✅ **Integración de Cloudinary para Subida de Imágenes**

Se ha implementado un sistema seguro y profesional para subir imágenes de perfumes directamente desde el panel de administración.

## 🔐 Seguridad

### Backend (Protegido)
- ✅ Credenciales en `backend/.env` (nunca en repositorio)
- ✅ Variables de entorno: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- ✅ Middleware de validación: solo JPG, JPEG, PNG, WebP
- ✅ Límite de tamaño: 5MB máximo
- ✅ JWT requerido para todas las rutas

### Frontend (Expuesto de forma segura)
- ✅ Validación de tipo de archivo
- ✅ Preview de imagen antes de guardar
- ✅ FormData para enviar archivos binarios
- ✅ Sin exponer credenciales de Cloudinary

## 📋 Flujo de Subida

1. Usuario selecciona imagen en el formulario de perfumes
2. JavaScript muestra preview en tiempo real
3. Al guardar, se envía `FormData` al backend (no JSON)
4. Backend valida tipo y tamaño
5. Cloudinary recibe y procesa la imagen
6. Se obtiene `secure_url` de Cloudinary
7. Solo la URL se guarda en PostgreSQL (`imagen_url`)
8. Frontend actualiza listado con la nueva imagen

## 🚀 Cómo usar

### Para el usuario (Administrador/Vendedor)

1. Ve al módulo **Perfumes**
2. En el formulario, haz clic en "Imagen"
3. Selecciona una foto de tu computadora
4. Verás un preview de la imagen
5. Completa los otros datos del perfume
6. Haz clic en **Guardar perfume**
7. La imagen se subirá a Cloudinary automáticamente

### Para editar un perfume

1. Abre un perfume existente (click en "Editar")
2. Opción A: No cambiar imagen → Solo editar otros campos
3. Opción B: Cambiar imagen → Selecciona nueva imagen y guarda
4. La imagen anterior se reemplaza automáticamente

## 📁 Estructura de carpetas en Cloudinary

```
scentvault/
└── perfumes/
    ├── perfume_1234567890_abc123xyz.jpg
    ├── perfume_1234567891_def456uvw.png
    └── ...
```

Las imágenes se organizan por fecha y con IDs únicos para evitar conflictos.

## 🛠️ Configuración técnica

### Backend
- **Dependencias instaladas:**
  ```
  cloudinary
  multer
  multer-storage-cloudinary
  ```

- **Archivos creados:**
  - `backend/src/config/cloudinary.js` - Configuración
  - `backend/src/middlewares/uploadMiddleware.js` - Validación

- **Rutas actualizadas:**
  - `POST /api/perfumes` - Crear perfume con imagen
  - `PUT /api/perfumes/:id` - Editar perfume con imagen

### Frontend
- **Input file** en formulario de perfumes
- **Preview en tiempo real** con FileReader API
- **FormData** para envío de archivos
- **Validación** de tipo y tamaño

## 📝 Variables de entorno requeridas

```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

Ver `CLOUDINARY_SETUP.md` para obtener estas credenciales.

## ⚠️ Limitaciones y validaciones

| Aspecto | Límite |
|--------|--------|
| Tamaño máximo | 5 MB |
| Formatos | JPG, JPEG, PNG, WebP |
| Resolución | Sin límite (recomienda <6000px) |
| Plan Cloudinary | Gratuito (50 GB/mes) |

## 🐛 Solución de problemas

### "Error al subir imagen"
- Verifica que `.env` tenga variables correctas
- Comprueba que el archivo sea JPG, PNG o WebP
- Verifica el tamaño (máximo 5MB)

### "Cloudinary no responde"
- Verifica conexión a internet
- Comprueba credenciales en Dashboard de Cloudinary
- Verifica límite de requests en tu plan

### "No puedo ver la imagen cargada"
- Espera a que Cloudinary procese (2-5 segundos)
- Actualiza la página
- Revisa la consola del navegador (F12)

## 📊 Base de datos

La tabla `perfumes` tiene la columna `imagen_url` que almacena:
```sql
ejemplo: https://res.cloudinary.com/scenic/image/upload/v1234567890/scentvault/perfumes/perfume_123_abc.jpg
```

## 🔄 Próximos pasos (Opcionales)

- [ ] Agregar compresión de imágenes en Cloudinary
- [ ] Crear galería de imágenes por perfume
- [ ] Agregar transformaciones (filtros, recortes)
- [ ] Implementar caché de imágenes
- [ ] Agregar borrado de imágenes antiguas

## 📚 Documentación adicional

- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Multer Docs](https://github.com/expressjs/multer)
- [JWT en Express](https://jwt.io/)

---

**Implementado por:** OpenCode AI
**Fecha:** 2025
**Estado:** Producción lista
