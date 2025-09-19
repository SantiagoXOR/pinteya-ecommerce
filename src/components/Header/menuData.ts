import { Menu } from "@/types/Menu";

// Menú actualizado con todas las páginas - Versión 2.0
export const menuData: Menu[] = [
  {
    id: 1,
    title: "Popular",
    newTab: false,
    path: "/",
  },
  {
    id: 2,
    title: "Tienda",
    newTab: false,
    path: "/shop",
  },
  {
    id: 3,
    title: "Contact",
    newTab: false,
    path: "/contact",
  },
  {
    id: 4,
    title: "Calculadora",
    newTab: false,
    path: "/calculator",
  },
  {
    id: 5,
    title: "Demos",
    newTab: false,
    path: "/demo",
    submenu: [
      {
        id: 50,
        title: "Ver Todos los Demos",
        newTab: false,
        path: "/demo",
      },
      {
        id: 51,
        title: "Funciones de Marcas",
        newTab: false,
        path: "/demo/brand-features",
      },
      {
        id: 52,
        title: "Componentes E-commerce",
        newTab: false,
        path: "/demo/ecommerce-components",
      },
      {
        id: 53,
        title: "ProductCard Mejorado",
        newTab: false,
        path: "/demo/enhanced-product-card",
      },
      {
        id: 54,
        title: "ProductCard Básico",
        newTab: false,
        path: "/demo/product-card",
      },
      {
        id: 55,
        title: "Sistema de Temas",
        newTab: false,
        path: "/demo/theme-system",
      },
    ],
  },
  {
    id: 6,
    title: "Pages",
    newTab: false,
    path: "/",
    submenu: [
      {
        id: 61,
        title: "Shop With Sidebar",
        newTab: false,
        path: "/shop-with-sidebar",
      },
      {
        id: 62,
        title: "Shop Without Sidebar",
        newTab: false,
        path: "/shop-without-sidebar",
      },
      {
        id: 63,
        title: "Shop Test",
        newTab: false,
        path: "/shop-test",
      },
      {
        id: 64,
        title: "Checkout",
        newTab: false,
        path: "/checkout",
      },
      {
        id: 641,
        title: "Checkout V2",
        newTab: false,
        path: "/checkout-v2",
      },
      {
        id: 642,
        title: "Checkout Comparison",
        newTab: false,
        path: "/checkout-comparison",
      },
      {
        id: 65,
        title: "Cart",
        newTab: false,
        path: "/cart",
      },
      {
        id: 66,
        title: "Wishlist",
        newTab: false,
        path: "/wishlist",
      },
      {
        id: 67,
        title: "Sign in",
        newTab: false,
        path: "/signin",
      },
      {
        id: 68,
        title: "Sign up",
        newTab: false,
        path: "/signup",
      },
      {
        id: 69,
        title: "Admin Panel",
        newTab: false,
        path: "/admin",
      },
      {
        id: 70,
        title: "Contact",
        newTab: false,
        path: "/contact",
      },
      {
        id: 71,
        title: "Error",
        newTab: false,
        path: "/error",
      },
      {
        id: 72,
        title: "Mail Success",
        newTab: false,
        path: "/mail-success",
      },
    ],
  },
  {
    id: 7,
    title: "Desarrollo",
    newTab: false,
    path: "/",
    submenu: [
      {
        id: 73,
        title: "Menú Principal",
        newTab: false,
        path: "/menu",
      },
      {
        id: 74,
        title: "Diagnósticos",
        newTab: false,
        path: "/diagnostics",
      },
      {
        id: 75,
        title: "Test Auth",
        newTab: false,
        path: "/test-auth",
      },
      {
        id: 76,
        title: "Test Checkout",
        newTab: false,
        path: "/test-checkout",
      },
      {
        id: 77,
        title: "Test Clerk",
        newTab: false,
        path: "/clerk-test",
      },
      {
        id: 78,
        title: "Debug Clerk",
        newTab: false,
        path: "/debug-clerk",
      },
      {
        id: 79,
        title: "Test Environment",
        newTab: false,
        path: "/test-env",
      },
      {
        id: 80,
        title: "Test Overflow",
        newTab: false,
        path: "/test-overflow",
      },
      {
        id: 81,
        title: "Admin Panel",
        newTab: false,
        path: "/admin",
      },
    ],
  },
  {
    id: 8,
    title: "Blogs",
    newTab: false,
    path: "/blogs",
    submenu: [
      {
        id: 82,
        title: "Todos los Blogs",
        newTab: false,
        path: "/blogs",
      },
    ],
  },
];









