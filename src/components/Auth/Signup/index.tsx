"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import Link from "next/link";
import React from "react";
import SignUpWrapper from "@/components/Auth/SignUpWrapper";

const Signup = () => {
  return (
    <>
      <Breadcrumb title={"Registrarse"} pages={["Registrarse"]} />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
            <div className="text-center mb-8">
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
                Crear Cuenta en Pinteya
              </h2>
              <p className="text-gray-600">Únete a nuestra comunidad</p>
            </div>

            {/* Componente de Clerk para registro */}
            <div className="flex justify-center">
              <SignUpWrapper redirectUrl="/shop" />
            </div>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <Link href="/signin" className="text-blue hover:text-blue-dark font-medium">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>


          </div>
        </div>
      </section>
    </>
  );
};

export default Signup;
