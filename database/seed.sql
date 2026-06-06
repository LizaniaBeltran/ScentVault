INSERT INTO roles (nombre, descripcion)
VALUES 
('admin', 'Usuario administrador del sistema'),
('vendedor', 'Usuario encargado de registrar ventas');

INSERT INTO perfumes (
    nombre, marca, familia_olfativa, notas_salida, notas_medias,
    notas_fondo, temporada, duracion_horas, precio, stock, imagen_url, descripcion
)
VALUES
(
    'Vanilla Bloom',
    'ScentVault',
    'Dulce',
    'Vainilla, pera',
    'Jazmín, caramelo',
    'Ámbar, almizcle',
    'Otoño / Invierno',
    8,
    899.00,
    12,
    '',
    'Perfume cálido y dulce ideal para uso nocturno.'
),
(
    'Citrus Aura',
    'ScentVault',
    'Cítrica',
    'Limón, bergamota',
    'Té verde, neroli',
    'Cedro, almizcle blanco',
    'Primavera / Verano',
    6,
    749.00,
    15,
    '',
    'Fragancia fresca y elegante para uso diario.'
);