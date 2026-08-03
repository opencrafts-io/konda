import style from "./index.module.css";
import Header from "../Components/Header/index.jsx";
import React, { useState, useContext, useEffect } from "react";
import { LoginContext } from "../loginContext";
import { PosthData } from "../Components/titan.js"

const Layout = ({ children }) => {
  const { setToken, form, errorToken, token } = useContext(LoginContext);

  useEffect(() => {
    if (!errorToken) return;

    async function refreshToken() {
      try {
        const data = await PosthData(
          null,
          "accounts/login/",
          form
        );
        setToken(data.access_token);
      } catch (err) {
        throw err;
      }
    }

    refreshToken();
  }, [errorToken]);

  return (
    <div className={style.layout}>
      <Header />
      <div className={style.container}>
        <div className={style.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;