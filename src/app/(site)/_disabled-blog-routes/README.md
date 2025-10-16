# Rutas de Blog Desactivadas

Estas rutas han sido desactivadas y movidas a esta carpeta para evitar que se rendericen en la aplicación.

## Rutas Desactivadas

- `/blogs` - Lista de blogs
- `/blogs/[slug]` - Artículo individual de blog

## Razón de Desactivación

Estas rutas no son necesarias para el funcionamiento actual de la aplicación y han sido desactivadas para:

1. Simplificar la navegación
2. Reducir la superficie de ataque
3. Mejorar el rendimiento
4. Enfocar la experiencia del usuario en las funcionalidades principales

## Reactivación

Si necesitas reactivar alguna de estas rutas en el futuro:

1. Mueve la carpeta correspondiente de vuelta a `src/app/(site)/`
2. Actualiza el middleware si es necesario
3. Verifica que no haya conflictos con otras rutas

## Fecha de Desactivación

Desactivadas el: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
