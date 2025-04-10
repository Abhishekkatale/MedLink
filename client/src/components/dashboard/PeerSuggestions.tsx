import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PeerSuggestion } from "@/lib/types";
import { Button } from "@/components/ui/button";

const PeerSuggestions = () => {
  const queryClient = useQueryClient();
  
  const { data: peers, isLoading } = useQuery<PeerSuggestion[]>({
    queryKey: ["/api/users/suggestions"],
  });

  const connectMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/connections/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error("Connection failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggestions"] });
    },
  });

  const handleConnect = (userId: number) => {
    connectMutation.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-card animate-pulse">
        <div className="px-6 py-4 border-b border-border dark:border-slate-700">
          <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
        <div className="p-6 space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700"></div>
              <div className="ml-3 flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-card">
      <div className="px-6 py-4 border-b border-border dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold dark:text-white">Connect with Peers</h2>
        <Button
          variant="link"
          className="text-sm text-primary dark:text-primary-300 font-medium"
        >
          View All
        </Button>
      </div>
      
      <div className="p-6">
        {peers && peers.length > 0 ? (
          peers.map((peer) => (
            <div key={peer.id} className="mb-5 pb-5 border-b border-border dark:border-slate-700 last:border-0 last:pb-0 last:mb-0">
              <div className="flex items-start">
                <div className={`w-10 h-10 rounded-full ${peer.colorClass} flex-shrink-0 flex items-center justify-center font-medium`}>
                  {peer.initials}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium dark:text-white">{peer.name}</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary font-medium hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-300 dark:hover:bg-primary/30"
                      onClick={() => handleConnect(peer.id)}
                      disabled={connectMutation.isPending}
                    >
                      Connect
                    </Button>
                  </div>
                  <p className="text-xs text-text-secondary dark:text-slate-300 mb-1">{peer.specialty} · {peer.organization}</p>
                  <p className="text-xs text-text-muted dark:text-slate-400">{peer.mutualConnections} mutual connections</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <span className="material-icons text-4xl text-gray-300 dark:text-slate-600 mb-2">people</span>
            <p className="text-lg font-medium text-gray-500 dark:text-slate-400">No suggestions available</p>
            <p className="text-sm text-gray-400 dark:text-slate-500">Check back later for new connections</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerSuggestions;
