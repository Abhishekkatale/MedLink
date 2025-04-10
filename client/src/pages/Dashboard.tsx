import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/StatsCard";
import MedicalInsights from "@/components/dashboard/MedicalInsights";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import ProfileCard from "@/components/dashboard/ProfileCard";
import PeerSuggestions from "@/components/dashboard/PeerSuggestions";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import TrendingNow from "@/components/dashboard/TrendingNow";
import RecentActivities from "@/components/dashboard/RecentActivities";
import Groups from "@/components/dashboard/Groups";
import PuzzlesSection from "@/components/dashboard/PuzzlesSection";
import PostCreator from "@/components/dashboard/PostCreator";
import { StatCard } from "@/lib/types";

const Dashboard = () => {
  const { data: stats, isLoading: isLoadingStats } = useQuery<StatCard[]>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="p-6">
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {isLoadingStats ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-card p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
                <div className="h-6 w-6 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          stats?.map((stat) => <StatsCard key={stat.title} stat={stat} />)
        )}
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left sidebar - profile info */}
        <div className="space-y-6 xl:col-span-1 order-2 xl:order-1">
          <ProfileCard />
          <RecentActivities />
          <Groups />
        </div>
        
        {/* Main content - center feed */}
        <div className="xl:col-span-2 space-y-6 order-1 xl:order-2">
          <PostCreator />
          <MedicalInsights />
          <RecentDocuments />
        </div>
        
        {/* Right sidebar - trending and events */}
        <div className="space-y-6 xl:col-span-1 order-3">
          <TrendingNow />
          <PuzzlesSection />
          <PeerSuggestions />
          <UpcomingEvents />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
