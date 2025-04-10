import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  title: string;
}

const Header = ({ title }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
  });

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
          <p className="text-sm text-text-secondary dark:text-slate-300">
            Welcome back, {currentUser?.name?.split(' ')[0] || '...'}
          </p>
        </div>
        
        {/* Search and actions */}
        <div className="flex items-center space-x-4">
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
