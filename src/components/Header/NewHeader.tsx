"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import TopBar from "./TopBar";
import EnhancedSearchBar from "./EnhancedSearchBar";
import ActionButtons from "./ActionButtons";
import { cn } from "@/lib/utils";

const NewHeader = () => {
  const [stickyMenu, setStickyMenu] = useState(false);

  // Sticky menu logic
  const handleStickyMenu = () => {
    if (window.scrollY >= 60) {
      setStickyMenu(true);
    } else {
      setStickyMenu(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleStickyMenu);
    return () => window.removeEventListener("scroll", handleStickyMenu);
  }, []);

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // Implementar lógica de búsqueda
  };

  return (
    <>
      {/* TopBar superior - Solo desktop */}
      <TopBar />

      {/* Header principal */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full bg-blaze-orange-600 border-b border-blaze-orange-700 transition-all duration-300",
          stickyMenu && "shadow-md"
        )}
      >
        <div className="max-w-[1170px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo - Sección izquierda */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/logo/LOGO POSITIVO.svg"
                  alt="Pinteya Logo"
                  width={200}
                  height={40}
                  className="h-10 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Buscador - Sección central */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <EnhancedSearchBar
                onSearch={handleSearch}
                size={stickyMenu ? "sm" : "md"}
                data-testid="desktop-search-input"
              />
            </div>

            {/* Acciones - Sección derecha */}
            <div className="flex items-center gap-4">
              {/* Botones de acción desktop */}
              <div className="hidden lg:block">
                <ActionButtons variant="header" />
              </div>

              {/* Botones móviles */}
              <div className="lg:hidden">
                <ActionButtons variant="mobile" />
              </div>
            </div>
          </div>

          {/* Buscador móvil */}
          <div className="lg:hidden pb-4">
            <EnhancedSearchBar
              onSearch={handleSearch}
              size="sm"
              data-testid="mobile-search-input"
            />
          </div>
        </div>
      </header>
    </>
  );
};

export default NewHeader;
