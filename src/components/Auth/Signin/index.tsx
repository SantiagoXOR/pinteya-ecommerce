"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import Link from "next/link";
import React from "react";
import SignInWrapper from "@/components/Auth/SignInWrapper";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, Shield, Users } from "lucide-react";

const Signin = () => {
  return (
    <>
      <Breadcrumb title={"Iniciar Sesión"} pages={["Iniciar Sesión"]} />
      <section className="overflow-hidden py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Benefits */}
            <div className="hidden lg:block">
              <Card className="p-8 border-0 shadow-2 bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">Bienvenido de vuelta</h3>
                    <Badge variant="default" size="sm">Pinteya E-commerce</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-success" />
                    <span className="text-gray-700">Acceso seguro a tu cuenta</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-info" />
                    <span className="text-gray-700">Historial de compras y favoritos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <LogIn className="w-5 h-5 text-warning" />
                    <span className="text-gray-700">Checkout rápido y personalizado</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full">
              <Card className="max-w-[570px] w-full mx-auto border-0 shadow-2 p-4 sm:p-7.5 xl:p-11">
                <div className="text-center mb-8">
                  <h1 className="font-bold text-2xl sm:text-3xl xl:text-4xl text-gray-900 mb-3">
                    Iniciar Sesión
                  </h1>
                  <p className="text-gray-600">Accede a tu cuenta para continuar comprando</p>
                </div>

                {/* Componente de Clerk para iniciar sesión */}
                <div className="flex justify-center">
                  <SignInWrapper redirectUrl="/shop" />
                </div>

                <div className="text-center mt-6">
                  <p className="text-gray-600">
                    ¿No tienes cuenta?{" "}
                    <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200">
                      Regístrate aquí
                    </Link>
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Signin;
