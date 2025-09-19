'use client';

import { UseFormReturn, FieldErrors } from 'react-hook-form';
import { AdminCard } from '../ui/AdminCard';
import { Search, Globe, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/core/utils';

interface ProductSeoProps {
  form: UseFormReturn<any>;
  errors: FieldErrors<any>;
  productName?: string;
  className?: string;
}

export function ProductSeo({ form, errors, productName = '', className }: ProductSeoProps) {
  const { register, watch, setValue } = form;
  const watchedData = watch();

  const seoTitle = watchedData.seo_title || '';
  const seoDescription = watchedData.seo_description || '';
  const slug = watchedData.slug || '';

  // Generate slug from product name
  const generateSlug = () => {
    if (!productName) {return;}
    
    const generatedSlug = productName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    setValue('slug', generatedSlug);
  };

  // Auto-generate SEO title
  const generateSeoTitle = () => {
    if (!productName) {return;}
    
    const title = `${productName} - Pinteya E-commerce`;
    setValue('seo_title', title.slice(0, 60));
  };

  // Auto-generate SEO description
  const generateSeoDescription = () => {
    if (!productName) {return;}
    
    const description = `Compra ${productName} en Pinteya E-commerce. Productos de calidad para pinturería, ferretería y corralón. Envío rápido y seguro.`;
    setValue('seo_description', description.slice(0, 160));
  };

  // SEO Score calculation
  const calculateSeoScore = () => {
    let score = 0;
    const checks = [];

    // Title checks
    if (seoTitle.length > 0) {
      score += 20;
      checks.push({ text: 'Título SEO configurado', status: 'good' });
      
      if (seoTitle.length >= 30 && seoTitle.length <= 60) {
        score += 10;
        checks.push({ text: 'Longitud de título óptima (30-60 caracteres)', status: 'good' });
      } else {
        checks.push({ text: 'Longitud de título no óptima', status: 'warning' });
      }
    } else {
      checks.push({ text: 'Título SEO faltante', status: 'error' });
    }

    // Description checks
    if (seoDescription.length > 0) {
      score += 20;
      checks.push({ text: 'Descripción SEO configurada', status: 'good' });
      
      if (seoDescription.length >= 120 && seoDescription.length <= 160) {
        score += 10;
        checks.push({ text: 'Longitud de descripción óptima (120-160 caracteres)', status: 'good' });
      } else {
        checks.push({ text: 'Longitud de descripción no óptima', status: 'warning' });
      }
    } else {
      checks.push({ text: 'Descripción SEO faltante', status: 'error' });
    }

    // Slug checks
    if (slug.length > 0) {
      score += 15;
      checks.push({ text: 'URL amigable configurada', status: 'good' });
      
      if (slug.length <= 50) {
        score += 10;
        checks.push({ text: 'URL concisa (≤50 caracteres)', status: 'good' });
      } else {
        checks.push({ text: 'URL muy larga', status: 'warning' });
      }
    } else {
      checks.push({ text: 'URL amigable faltante', status: 'error' });
    }

    // Keyword presence (basic check)
    if (productName && seoTitle.toLowerCase().includes(productName.toLowerCase())) {
      score += 15;
      checks.push({ text: 'Palabra clave en título', status: 'good' });
    } else {
      checks.push({ text: 'Palabra clave no encontrada en título', status: 'warning' });
    }

    return { score, checks };
  };

  const seoAnalysis = calculateSeoScore();

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SEO Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="Configuración SEO" className="p-6">
            <div className="space-y-6">
              {/* SEO Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Título SEO
                  </label>
                  <button
                    type="button"
                    onClick={generateSeoTitle}
                    className="text-xs text-blaze-orange-600 hover:text-blaze-orange-700"
                  >
                    Auto-generar
                  </button>
                </div>
                <input
                  type="text"
                  {...register('seo_title')}
                  maxLength={60}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                  placeholder="Título que aparecerá en los resultados de búsqueda"
                />
                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-gray-500">
                    Recomendado: 30-60 caracteres
                  </div>
                  <div className={cn(
                    "text-xs",
                    seoTitle.length > 60 ? "text-red-600" : 
                    seoTitle.length >= 30 ? "text-green-600" : "text-yellow-600"
                  )}>
                    {seoTitle.length}/60
                  </div>
                </div>
                {errors.seo_title && (
                  <p className="text-red-600 text-sm mt-1">{errors.seo_title.message}</p>
                )}
              </div>

              {/* SEO Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción SEO
                  </label>
                  <button
                    type="button"
                    onClick={generateSeoDescription}
                    className="text-xs text-blaze-orange-600 hover:text-blaze-orange-700"
                  >
                    Auto-generar
                  </button>
                </div>
                <textarea
                  {...register('seo_description')}
                  maxLength={160}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                  placeholder="Descripción que aparecerá en los resultados de búsqueda"
                />
                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-gray-500">
                    Recomendado: 120-160 caracteres
                  </div>
                  <div className={cn(
                    "text-xs",
                    seoDescription.length > 160 ? "text-red-600" : 
                    seoDescription.length >= 120 ? "text-green-600" : "text-yellow-600"
                  )}>
                    {seoDescription.length}/160
                  </div>
                </div>
                {errors.seo_description && (
                  <p className="text-red-600 text-sm mt-1">{errors.seo_description.message}</p>
                )}
              </div>

              {/* URL Slug */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    URL del Producto
                  </label>
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="text-xs text-blaze-orange-600 hover:text-blaze-orange-700"
                  >
                    Auto-generar
                  </button>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 bg-gray-50 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg">
                    pinteya.com/productos/
                  </span>
                  <input
                    type="text"
                    {...register('slug')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                    placeholder="url-amigable-del-producto"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Solo letras minúsculas, números y guiones. Máximo 50 caracteres.
                </div>
                {errors.slug && (
                  <p className="text-red-600 text-sm mt-1">{errors.slug.message}</p>
                )}
              </div>

              {/* Meta Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Palabras Clave Meta
                </label>
                <input
                  type="text"
                  {...register('meta_keywords')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                  placeholder="palabra1, palabra2, palabra3"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Separar con comas. Máximo 10 palabras clave para SEO.
                </div>
                {errors.meta_keywords && (
                  <p className="text-red-600 text-sm mt-1">{errors.meta_keywords.message}</p>
                )}
              </div>
            </div>
          </AdminCard>

          {/* Preview */}
          <AdminCard title="Vista Previa en Google" className="p-6">
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="space-y-2">
                <div className="text-xs text-green-700">
                  pinteya.com › productos › {slug || 'url-del-producto'}
                </div>
                <div className="text-lg text-blue-600 hover:underline cursor-pointer">
                  {seoTitle || productName || 'Título del producto'}
                </div>
                <div className="text-sm text-gray-600">
                  {seoDescription || 'Descripción del producto que aparecerá en los resultados de búsqueda...'}
                </div>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* SEO Analysis */}
        <div className="space-y-6">
          {/* SEO Score */}
          <AdminCard title="Puntuación SEO" className="p-6">
            <div className="text-center mb-4">
              <div className={cn(
                "text-4xl font-bold mb-2",
                seoAnalysis.score >= 80 ? "text-green-600" :
                seoAnalysis.score >= 60 ? "text-yellow-600" : "text-red-600"
              )}>
                {seoAnalysis.score}
              </div>
              <div className="text-sm text-gray-600">de 100 puntos</div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all",
                    seoAnalysis.score >= 80 ? "bg-green-500" :
                    seoAnalysis.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${seoAnalysis.score}%` }}
                ></div>
              </div>
            </div>

            {/* SEO Checks */}
            <div className="space-y-2">
              {seoAnalysis.checks.map((check, index) => (
                <div key={index} className="flex items-start space-x-2">
                  {check.status === 'good' && (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  )}
                  {check.status === 'warning' && (
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  )}
                  {check.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  )}
                  <span className={cn(
                    "text-xs",
                    check.status === 'good' && "text-green-700",
                    check.status === 'warning' && "text-yellow-700",
                    check.status === 'error' && "text-red-700"
                  )}>
                    {check.text}
                  </span>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* SEO Tips */}
          <AdminCard title="Consejos SEO" className="p-6">
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex items-start space-x-2">
                <Search className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Palabras Clave</p>
                  <p>Incluye palabras que tus clientes buscarían</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">URL Amigable</p>
                  <p>Usa URLs cortas y descriptivas</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Eye className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Descripción Atractiva</p>
                  <p>Escribe descripciones que inviten a hacer clic</p>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}









