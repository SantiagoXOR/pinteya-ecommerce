# Deploy de Storybook

Guía completa para configurar y desplegar Storybook automáticamente en Vercel.

## 🚀 Configuración Automática

### Setup Rápido

```bash
# Ejecutar script de configuración automática
npm run storybook:setup-deploy
```

Este script:
- ✅ Verifica que Storybook funcione correctamente
- ✅ Crea configuración de Vercel
- ✅ Configura .gitignore
- ✅ Valida GitHub Actions
- ✅ Muestra instrucciones paso a paso

## 📋 Configuración Manual

### 1. Preparar el Build

```bash
# Verificar que el build funcione
npm run build-storybook

# El output estará en storybook-static/
ls storybook-static/
```

### 2. Configurar Vercel

#### Opción A: Vercel Dashboard
1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa tu repositorio
3. Configura:
   - **Build Command**: `npm run build-storybook`
   - **Output Directory**: `storybook-static`
   - **Install Command**: `npm install`

#### Opción B: Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Configurar proyecto
vercel

# Deploy manual
npm run storybook:deploy
```

### 3. GitHub Actions (Automático)

El workflow `.github/workflows/storybook-deploy.yml` se ejecuta automáticamente cuando:
- 📝 Hay cambios en `src/components/**`
- 📝 Hay cambios en `src/stories/**`
- 📝 Hay cambios en `.storybook/**`
- 📝 Se actualiza `package.json`

#### Variables de Entorno Requeridas

En GitHub Settings > Secrets and variables > Actions:

```bash
VERCEL_TOKEN=tu_token_de_vercel
VERCEL_ORG_ID=tu_org_id
VERCEL_STORYBOOK_PROJECT_ID=tu_project_id
```

#### Obtener IDs de Vercel

```bash
# Vincular proyecto
vercel link

# Ver configuración
cat .vercel/project.json
```

## 🎨 Chromatic (Opcional)

Chromatic proporciona:
- 📸 Visual regression testing
- 🔍 Review de cambios visuales
- 📚 Documentación visual
- 🚀 Deploy automático

### Configuración

1. Ve a [chromatic.com](https://chromatic.com)
2. Conecta tu repositorio
3. Obtén el project token
4. Agrega a GitHub Secrets:
   ```bash
   CHROMATIC_PROJECT_TOKEN=tu_chromatic_token
   ```

### Uso

```bash
# Deploy manual a Chromatic
npx chromatic --project-token=tu_token

# El workflow automático se encarga del deploy
```

## 📊 Monitoreo y Mantenimiento

### URLs de Deploy

- **Producción**: `https://tu-proyecto-storybook.vercel.app`
- **Preview**: URLs generadas automáticamente en PRs
- **Chromatic**: `https://tu-proyecto.chromatic.com`

### Logs y Debugging

```bash
# Ver logs de build local
npm run build-storybook --verbose

# Ver logs de Vercel
vercel logs tu-deployment-url

# Verificar GitHub Actions
# Ve a: github.com/tu-usuario/tu-repo/actions
```

### Troubleshooting

#### Error: Build Failed

```bash
# Verificar dependencias
npm ci

# Limpiar cache
rm -rf node_modules/.cache
rm -rf storybook-static

# Rebuild
npm run build-storybook
```

#### Error: Vercel Deploy Failed

1. Verificar variables de entorno
2. Revisar permisos del token
3. Confirmar IDs de proyecto

#### Error: GitHub Actions Failed

1. Verificar secrets configurados
2. Revisar logs del workflow
3. Confirmar permisos del repositorio

## 🔧 Configuración Avanzada

### Custom Domain

```bash
# Configurar dominio personalizado
vercel domains add storybook.tu-dominio.com tu-proyecto-id
```

### Variables de Entorno

En `vercel-storybook.json`:

```json
{
  "env": {
    "NODE_ENV": "production",
    "STORYBOOK_API_URL": "https://api.tu-dominio.com"
  }
}
```

### Headers de Seguridad

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

## 📈 Performance

### Optimizaciones

- ✅ Tree shaking habilitado
- ✅ Compresión gzip automática
- ✅ CDN global de Vercel
- ✅ Cache de assets estáticos

### Métricas

```bash
# Analizar bundle size
npm run build-storybook -- --stats-json
npx webpack-bundle-analyzer storybook-static/
```

## 🔄 Workflow Completo

### Desarrollo

```bash
# 1. Desarrollar componentes
npm run storybook

# 2. Crear/actualizar stories
# Editar archivos en src/stories/

# 3. Verificar build
npm run build-storybook

# 4. Commit y push
git add .
git commit -m "feat: nuevo componente X"
git push origin main
```

### Deploy Automático

1. 🔄 GitHub Actions detecta cambios
2. 🔨 Build de Storybook
3. 🚀 Deploy a Vercel
4. 📸 Visual testing en Chromatic
5. 💬 Comentario en PR con URL

### Resultado

- 📚 Storybook actualizado en producción
- 🔗 URL compartible para el equipo
- 📱 Responsive y accesible
- 🎨 Design System documentado

## 📞 Soporte

### Recursos

- [Documentación Storybook](https://storybook.js.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Chromatic Docs](https://www.chromatic.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

### Contacto

- 🐛 Issues: GitHub Issues
- 💬 Discusiones: GitHub Discussions
- 📧 Email: dev@pinteya.com

---

✨ **¡Tu Design System está listo para el mundo!** 🌍
