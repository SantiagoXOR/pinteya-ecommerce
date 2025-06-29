import { Metadata } from "next";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Home, 
  ShoppingBag, 
  Package, 
  Calculator, 
  User, 
  Heart,
  ShoppingCart,
  Phone,
  Info,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";

export const metadata: Metadata = {
  title: "Menú Principal | Pinteya E-commerce",
  description: "Accede a todas las secciones de Pinteya E-commerce desde el menú principal.",
};

const menuSections = [
  {
    title: "Navegación Principal",
    items: [
      { icon: Home, label: "Inicio", href: "/", description: "Página principal" },
      { icon: ShoppingBag, label: "Tienda", href: "/shop", description: "Todos los productos" },
      { icon: Calculator, label: "Cotizador", href: "/calculator", description: "Calcula tu presupuesto" },
      { icon: Package, label: "Demos", href: "/demo", description: "Funcionalidades y ejemplos" },
    ]
  },
  {
    title: "Mi Cuenta",
    items: [
      { icon: User, label: "Mi Perfil", href: "/my-account", description: "Datos personales" },
      { icon: Package, label: "Mis Pedidos", href: "/my-account", description: "Historial de compras" },
      { icon: Heart, label: "Favoritos", href: "/wishlist", description: "Productos guardados" },
      { icon: ShoppingCart, label: "Carrito", href: "/cart", description: "Productos seleccionados" },
    ]
  },
  {
    title: "Información",
    items: [
      { icon: Info, label: "Acerca de", href: "/about", description: "Conoce Pinteya" },
      { icon: Phone, label: "Contacto", href: "/contact", description: "Comunícate con nosotros" },
      { icon: HelpCircle, label: "Ayuda", href: "/help", description: "Preguntas frecuentes" },
    ]
  },
  {
    title: "Desarrollo y Testing",
    items: [
      { icon: Settings, label: "Diagnósticos", href: "/diagnostics", description: "Herramientas de diagnóstico" },
      { icon: Settings, label: "Test Auth", href: "/test-auth", description: "Pruebas de autenticación" },
      { icon: Settings, label: "Test Checkout", href: "/test-checkout", description: "Pruebas de checkout" },
      { icon: Settings, label: "Admin Panel", href: "/admin", description: "Panel de administración" },
    ]
  },
  {
    title: "Configuración",
    items: [
      { icon: Settings, label: "Configuración", href: "/settings", description: "Preferencias de la app" },
      { icon: LogOut, label: "Cerrar Sesión", href: "/signout", description: "Salir de la cuenta" },
    ]
  }
];

export default function MenuPage() {
  return (
    <>
      <Breadcrumb title="Menú Principal" />
      
      <section className="pb-20 pt-10">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Menú Principal
            </h1>
            <p className="text-lg text-gray-600">
              Accede rápidamente a todas las secciones de Pinteya
            </p>
          </div>

          {/* Menu Sections */}
          <div className="space-y-8">
            {menuSections.map((section, sectionIndex) => (
              <Card key={sectionIndex}>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.items.map((item, itemIndex) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={itemIndex}
                          href={item.href}
                          className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                        >
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <IconComponent className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                              {item.label}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {item.description}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link href="/shop">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="text-sm">Ver Tienda</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link href="/calculator">
                  <Calculator className="w-6 h-6" />
                  <span className="text-sm">Cotizar</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link href="/cart">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="text-sm">Mi Carrito</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link href="/contact">
                  <Phone className="w-6 h-6" />
                  <span className="text-sm">Contacto</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* App Info */}
          <div className="mt-12 text-center">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Pinteya E-commerce
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Tu tienda especializada en productos de pinturería, ferretería y corralón
                </p>
                <div className="flex justify-center gap-4">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/about">
                      Acerca de Nosotros
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/contact">
                      Contacto
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
