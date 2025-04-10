import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostWithAuthor } from "@/lib/types";
import { Button } from "@/components/ui/button";

type FilterType = "latest" | "popular" | "saved";

const MedicalInsights = () => {
  const [filter, setFilter] = useState<FilterType>("latest");
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts", filter],
  });

  const handleSavePost = async (postId: number, isSaved: boolean) => {
    try {
      await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ saved: !isSaved }),
      });
      
      // Refetch the posts
      queryClient.invalidateQueries({ queryKey: ["/api/posts", filter] });
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const handleSharePost = (postId: number) => {
    // In a real app, this would open a sharing dialog
    console.log("Sharing post:", postId);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-card mb-6">
      <div className="px-6 py-4 border-b border-border dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold dark:text-white">Medical Insights</h2>
        <div className="flex space-x-2">
          <Button
            variant={filter === "latest" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("latest")}
            className={filter === "latest" ? "bg-primary/10 text-primary hover:bg-primary/20 dark:text-primary-300 dark:bg-primary/20 dark:hover:bg-primary/30" : "dark:text-slate-300"}
          >
            Latest
          </Button>
          <Button
            variant={filter === "popular" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("popular")}
            className={filter === "popular" ? "bg-primary/10 text-primary hover:bg-primary/20 dark:text-primary-300 dark:bg-primary/20 dark:hover:bg-primary/30" : "dark:text-slate-300"}
          >
            Popular
          </Button>
          <Button
            variant={filter === "saved" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("saved")}
            className={filter === "saved" ? "bg-primary/10 text-primary hover:bg-primary/20 dark:text-primary-300 dark:bg-primary/20 dark:hover:bg-primary/30" : "dark:text-slate-300"}
          >
            Saved
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <div
                key={post.id}
                className="mb-6 pb-6 border-b border-border dark:border-slate-700 last:border-0 last:mb-0 last:pb-0"
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${post.category.color}/10 text-${post.category.color} dark:bg-${post.category.color}/20 dark:text-${post.category.color}-300`}>
                        {post.category.name}
                      </span>
                      <span className="ml-3 text-xs text-text-muted dark:text-slate-400">{post.timeAgo}</span>
                    </div>
                    <h3 className="text-base font-semibold mb-2 dark:text-white">{post.title}</h3>
                    <p className="text-sm text-text-secondary dark:text-slate-300 mb-3">{post.content}</p>
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {post.participants.map((participant) => (
                          <div
                            key={participant.id}
                            className={`w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 ${participant.colorClass} flex items-center justify-center`}
                          >
                            <span className="text-xs font-medium">{participant.initials}</span>
                          </div>
                        ))}
                      </div>
                      <span className="ml-3 text-xs text-text-muted dark:text-slate-400">
                        {post.discussCount} physicians discussed this
                      </span>
                      <div className="ml-auto flex space-x-2">
                        <button 
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                          onClick={() => handleSavePost(post.id, post.saved)}
                        >
                          <span className={`material-icons text-${post.saved ? 'primary dark:text-primary-300' : 'text-muted dark:text-slate-400'} text-sm`}>
                            {post.saved ? 'bookmark' : 'bookmark_border'}
                          </span>
                        </button>
                        <button 
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                          onClick={() => handleSharePost(post.id)}
                        >
                          <span className="material-icons text-text-muted dark:text-slate-400 text-sm">share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8">
            <span className="material-icons text-4xl text-gray-300 dark:text-slate-600 mb-2">article</span>
            <p className="text-lg font-medium text-gray-500 dark:text-slate-400">No articles found</p>
            <p className="text-sm text-gray-400 dark:text-slate-500">
              {filter === "saved" 
                ? "You haven't saved any articles yet" 
                : "No articles available in this category"}
            </p>
          </div>
        )}
        
        <Button
          variant="outline"
          className="w-full py-3 mt-4 text-sm text-primary dark:text-primary-300 font-medium border border-primary/20 dark:border-primary/30 rounded-md hover:bg-primary/5 dark:hover:bg-primary/10"
        >
          View All Medical Insights
        </Button>
      </div>
    </div>
  );
};

export default MedicalInsights;
