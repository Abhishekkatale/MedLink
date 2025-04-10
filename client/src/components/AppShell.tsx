import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useLocation } from "wouter";

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [pageTitle, setPageTitle] = useState("Dashboard");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Set page title based on current route
    switch (location) {
      case "/":
        setPageTitle("Dashboard");
        break;
      case "/knowledge-hub":
        setPageTitle("Knowledge Hub");
        break;
      case "/documents":
        setPageTitle("Documents");
        break;
      case "/directory":
        setPageTitle("Directory");
        break;
      default:
        setPageTitle("Dashboard");
    }
    
    // Close mobile menu when navigating
    setMobileMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu toggle */}
      <div 
        className="fixed z-40 p-3 rounded-full bg-primary shadow-md cursor-pointer md:hidden"
        style={{ bottom: "24px", right: "24px" }}
        onClick={toggleMobileMenu}
      >
        <span className="material-icons text-white">
          {mobileMenuOpen ? "close" : "menu"}
        </span>
      </div>
      
      {/* Sidebar */}
      <Sidebar isOpen={mobileMenuOpen} />
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background dark:bg-slate-950">
        <Header title={pageTitle} />
        <div className="dark:text-black">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
