"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import Link from "next/link";
import React from "react";
import SignUpWrapper from "@/components/Auth/SignUpWrapper";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Gift, Star, Truck } from "lucide-react";

const Signup = () => {
  return (
    <>
      <Breadcrumb title={"Registrarse"} pages={["Registrarse"]} />
      <section className="overflow-hidden py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Benefits */}
            <div className="hidden lg:block">
              <Card className="p-8 border-0 shadow-2 bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">Únete a Pinteya</h3>
                    <Badge variant="default" size="sm">Beneficios exclusivos</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-success" />
                    <span className="text-gray-700">Descuentos exclusivos para miembros</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-warning" />
                    <span className="text-gray-700">Programa de puntos y recompensas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-info" />
                    <span className="text-gray-700">Envío gratis en tu primera compra</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full">
              <Card className="max-w-[570px] w-full mx-auto border-0 shadow-2 p-4 sm:p-7.5 xl:p-11">
                <div className="text-center mb-8">
                  <h1 className="font-bold text-2xl sm:text-3xl xl:text-4xl text-gray-900 mb-3">
                    Crear Cuenta
                  </h1>
                  <p className="text-gray-600">Únete a nuestra comunidad de pintores</p>
                </div>

                {/* Componente de Clerk para registro */}
                <div className="flex justify-center">
                  <SignUpWrapper redirectUrl="/shop" />
                </div>

                <div className="text-center mt-6">
                  <p className="text-gray-600">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/signin" className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200">
                      Inicia sesión aquí
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

export default Signup;
