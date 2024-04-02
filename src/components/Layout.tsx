// src/components/Layout.tsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (

            <div className="layout-container">
                <Header />
                <main className="main-content">{children}</main>
                <Footer />
            </div>

    );
};

export default Layout;
