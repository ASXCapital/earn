import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import styles from "./Layout.module.css"; // Assuming this path is correct

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className={styles.layoutContainer}>
      {" "}
      {/* Adjusted to use CSS Modules */}
      <Header />
      <main className={styles.mainContent}>{children}</main>{" "}
      {/* Adjusted to use CSS Modules */}
      <Footer />
    </div>
  );
};

export default Layout;
