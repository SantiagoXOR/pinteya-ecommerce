"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import Link from "next/link";
import React from "react";
import SignInWrapper from "@/components/Auth/SignInWrapper";

const Signin = () => {
  return (
    <>
      <Breadcrumb title={"Iniciar Sesión"} pages={["Iniciar Sesión"]} />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
            <div className="text-center mb-8">
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
                Iniciar Sesión en Pinteya
              </h2>
              <p className="text-gray-600">Accede a tu cuenta para continuar</p>
            </div>

            {/* Componente de Clerk para iniciar sesión */}
            <div className="flex justify-center">
              <SignInWrapper redirectUrl="/shop" />
            </div>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                ¿No tienes cuenta?{" "}
                <Link href="/signup" className="text-blue hover:text-blue-dark font-medium">
                  Regístrate aquí
                </Link>
              </p>
            </div>


          </div>
        </div>
      </section>
    </>
  );
};

export default Signin;
