import '@/styles/globals.scss'
import type {AppProps} from 'next/app'
import Head from "next/head";
import {User} from "@/User";
import React from "react";
import NavBar from "@/components/navbar/NavBar";
import {AuthProvider} from "@/context/auth";

export default function App({Component, pageProps: {...pageProps}}: AppProps) {
    return (
        <>
            <Head>
                <title>Min side</title>
            </Head>
            <AuthProvider>
                <NavBar logout={""}/>
                <Component {...pageProps} />
            </AuthProvider>
        </>
    )

    function logout() {
        setUser(new User())
        setIsAuthenticated(false);
        localStorage.removeItem("user_token");
    }
}
