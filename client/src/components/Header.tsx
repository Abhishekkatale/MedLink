import { useState } from "react";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth
import { Link, useLocation } from "wouter"; // Import Link and useLocation for navigation
import { User } from "@shared/schema"; // Keep User type if needed elsewhere, or remove if only from useAuth
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  title: string;
}

const Header = ({ title }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated, user, logout, isLoading } = useAuth(); // Use useAuth hook
  const [, navigate] = useLocation(); // For programmatic navigation after logout

  const handleLogout = () => {
    logout();
    navigate("/login"); // Redirect to login after logout
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary dark:text-white">{title}</h1>
          {isAuthenticated && user && (
            <p className="text-sm text-text-secondary dark:text-slate-300">
              Welcome back, {user.name?.split(' ')[0]}
            </p>
          )}
        </div>
        
        {/* Search and actions */}
        <div className="flex items-center space-x-4">
          {!isLoading && ( // Only show auth buttons when not loading auth state
            <>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link href="/login">
                    <a className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md">
                      Login
                    </a>
                  </Link>
                  <Link href="/signup">
                    <a className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md">
                      Signup
                    </a>
                  </Link>
                </>
              )}
            </>
          )}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="material-icons text-text-muted dark:text-slate-400 text-lg">search</span>
            </span>
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 w-64 rounded-md border border-border dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          
          <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <span className="material-icons text-text-secondary dark:text-slate-300">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"></span>
          </button>
          
          <button 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 md:hidden"
            onClick={() => {
              // Implement mobile search
              const searchInput = prompt("Search for:");
              if (searchInput) {
                setSearchQuery(searchInput);
                // Execute search
                console.log("Mobile searching for:", searchInput);
              }
            }}
          >
            <span className="material-icons text-text-secondary dark:text-slate-300">search</span>
          </button>
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
