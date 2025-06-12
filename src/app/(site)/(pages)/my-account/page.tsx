"use client";

import MyAccount from "@/components/MyAccount/MyAccount";
import Breadcrumb from "@/components/Common/Breadcrumb";
import React from "react";

const MyAccountPage = () => {
  return (
    <main>
      <Breadcrumb title={"Mi Cuenta"} pages={["Mi Cuenta"]} />
      <MyAccount />
    </main>
  );
};

export default MyAccountPage;
