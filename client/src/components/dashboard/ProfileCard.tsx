import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const ProfileCard = () => {
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users/profile"],
  });

  // Fallback profile data if API returns empty
  const profileData = profile || {
    name: "Dr. John Wilson",
    initials: "AJ",
    title: "Cardiologist",
    organization: "Memorial Hospital",
    profileCompletion: 65,
    remainingItems: 3,
    networkGrowth: 12,
    networkGrowthDays: 7
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-card animate-pulse">
        <div className="px-6 py-4 border-b border-border dark:border-slate-700">
          <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-700"></div>
            <div className="ml-4 space-y-2">
              <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-40"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-card">
      <div className="px-6 py-4 border-b border-border dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold dark:text-white">Your Profile</h2>
        <Link href="/profile">
          <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <span className="material-icons text-gray-500 dark:text-slate-400 text-lg">open_in_new</span>
          </button>
        </Link>
      </div>
      
      <div className="p-6">
        <Link href="/profile" className="block hover:opacity-90 transition-opacity">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-semibold">
              {profileData.initials}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold dark:text-white">{profileData.name}</h3>
              <p className="text-sm text-text-secondary dark:text-slate-300">{profileData.title} · {profileData.organization}</p>
            </div>
          </div>
        </Link>
            
        <div className="space-y-4 mb-6">
          <div>
            <h4 className="text-xs font-semibold text-text-muted dark:text-slate-400 uppercase mb-2">Profile Completion</h4>
            <Progress value={profileData.profileCompletion} className="h-2 bg-gray-200 dark:bg-slate-700" />
            <p className="text-xs text-text-muted dark:text-slate-400 mt-1">
              {profileData.profileCompletion}% complete · {profileData.remainingItems} items remaining
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold text-text-muted dark:text-slate-400 uppercase mb-2">Network Growth</h4>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <span className="material-icons text-primary dark:text-primary-300">trending_up</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium dark:text-white">+{profileData.networkGrowth} connections</p>
                <p className="text-xs text-text-muted dark:text-slate-400">in the last {profileData.networkGrowthDays} days</p>
              </div>
            </div>
          </div>
        </div>
        
        <Link href="/profile">
          <Button className="w-full py-2.5 rounded-md bg-primary text-white font-medium hover:bg-primary/90">
            View Full Profile
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ProfileCard;
