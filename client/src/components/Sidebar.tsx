import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { SidebarLink, ColleagueDisplay } from "@/lib/types";
import { User } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const [location] = useLocation();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
  });

  const { data: colleagues } = useQuery<ColleagueDisplay[]>({
    queryKey: ["/api/users/colleagues"],
  });

  const navLinks: SidebarLink[] = [
    { href: "/", label: "Dashboard", icon: "dashboard", active: location === "/" },
    { href: "/knowledge-hub", label: "Knowledge Hub", icon: "forum", active: location === "/knowledge-hub" },
    { href: "/documents", label: "Documents", icon: "folder_shared", active: location === "/documents" },
    { href: "/directory", label: "Directory", icon: "people", active: location === "/directory" },
  ];

  return (
    <aside className={`w-64 bg-white dark:bg-slate-900 shadow-md z-30 flex-shrink-0 md:relative md:translate-x-0 fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-200 ease-in-out`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-6 flex items-center border-b border-border dark:border-slate-700">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center mr-3">
            <span className="material-icons text-white text-sm">medical_services</span>
          </div>
          <span className="text-xl font-semibold text-primary">MedConnect</span>
        </div>
        
        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => (
            <div key={link.href} className="w-full">
              <Link href={link.href}>
                <div className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md cursor-pointer ${link.active ? 'bg-primary/10 text-primary dark:text-primary-300' : 'text-text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                  <span className={`material-icons ${link.active ? 'text-primary dark:text-primary-300' : 'text-text-secondary dark:text-slate-400'} mr-3 text-xl`}>
                    {link.icon}
                  </span>
                  {link.label}
                </div>
              </Link>
            </div>
          ))}
          
          {colleagues && colleagues.length > 0 && (
            <div className="pt-5">
              <div className="px-3 mb-2 text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">
                My Network
              </div>
              {colleagues.map((colleague) => (
                <div key={colleague.id} className="w-full">
                  <Link href={`/directory/${colleague.id}`}>
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer">
                      <div className={`w-6 h-6 rounded-full ${colleague.colorClass} flex items-center justify-center mr-3`}>
                        <span className="text-xs font-medium">{colleague.initials}</span>
                      </div>
                      <span>{colleague.name}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </nav>
        
        {/* User profile */}
        <div className="px-4 py-4 border-t border-border dark:border-slate-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
              <span>{currentUser?.initials || "..."}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium dark:text-white">{currentUser?.name || "Loading..."}</p>
              <p className="text-xs text-text-secondary dark:text-slate-400">{currentUser?.title || "..."}</p>
            </div>
            <Link href="/settings">
              <div className="ml-auto p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer">
                <span className="material-icons text-text-secondary dark:text-slate-400 text-xl">settings</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
