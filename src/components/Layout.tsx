// src/components/Layout.tsx
import Header from './Header';
import Footer from './Footer';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="layout-container">
            <Header />
            <main className="main-content">{children}</main> {/* Removed inline style for padding-top */}
            <Footer />
        </div>
    );
};

export default Layout;
