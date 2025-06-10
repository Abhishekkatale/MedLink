import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PostWithAuthor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth to get token

type CategoryOption = {
  value: string;
  label: string;
  color: string;
};

const KnowledgeHub = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth(); // Get token from AuthContext
  const [activeTab, setActiveTab] = useState("all");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts", activeTab, searchTerm],
  });

  const { data: categories } = useQuery<CategoryOption[]>({
    queryKey: ["/api/categories"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (newPost: { title: string; content: string; categoryId: string }) => {
      // Use apiRequest which handles token
      const response = await apiRequest("POST", "/api/posts", newPost, token);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setOpenCreateDialog(false);
      setTitle("");
      setContent("");
      setCategory("");
    },
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content || !category) {
      // Show validation error
      alert("Please fill in all required fields");
      return;
    }
    
    createPostMutation.mutate({
      title,
      content,
      categoryId: category,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search will be triggered by setting the state, which will cause the query to refetch
  };

  const handleSavePost = async (postId: number, isSaved: boolean) => {
    try {
      // Use apiRequest which handles token
      await apiRequest("POST", `/api/posts/${postId}/save`, { saved: !isSaved }, token);
      
      // Refetch the posts
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    } catch (error) {
      // Errors (including auth) should be caught by react-query's global handler or useMutation's onError
      console.error("Error saving post:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Knowledge Hub</h1>
          <p className="text-gray-600 dark:text-slate-400">Share and discover medical knowledge</p>
        </div>
        
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 bg-primary text-white hover:bg-primary/90">
              <span className="material-icons mr-2 text-sm">add</span>
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create a New Post</DialogTitle>
              <DialogDescription>
                Share your insights, research, or case studies with the medical community.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePost}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right dark:text-slate-300">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right dark:text-slate-300">
                    Category
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="content" className="text-right pt-2 dark:text-slate-300">
                    Content
                  </Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="col-span-3 min-h-[150px]"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="bg-primary text-white hover:bg-primary/90"
                  disabled={createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? "Creating..." : "Create Post"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-card p-4 mb-6">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-gray-400 dark:text-slate-500 text-lg">search</span>
                </span>
                <Input 
                  type="text" 
                  placeholder="Search posts..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-card">
            <div className="p-4 border-b border-border dark:border-slate-700">
              <h2 className="font-semibold dark:text-white">Filters</h2>
            </div>
            <div className="p-4">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="all">All Posts</TabsTrigger>
                  <TabsTrigger value="saved">Saved</TabsTrigger>
                </TabsList>
                
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Categories</h3>
                  {categories?.map((cat) => (
                    <div key={cat.value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`cat-${cat.value}`}
                        className="rounded text-primary mr-2"
                        checked={activeTab === cat.value}
                        onChange={() => setActiveTab(cat.value === activeTab ? "all" : cat.value)}
                      />
                      <label htmlFor={`cat-${cat.value}`} className="text-sm dark:text-slate-300">
                        {cat.label}
                      </label>
                    </div>
                  ))}
                </div>
              </Tabs>
            </div>
          </div>
        </aside>
        
        <div className="flex-1">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${post.category?.color || 'primary'}/10 text-${post.category?.color || 'primary'} dark:bg-${post.category?.color || 'primary'}/20 dark:text-${post.category?.color || 'primary'}-300`}>
                        {post.category?.name || 'General'}
                      </span>
                      <span className="text-xs text-text-muted dark:text-slate-400">{post.timeAgo}</span>
                    </div>
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <CardDescription className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary dark:text-primary-300 text-xs font-medium mr-2">
                        {post.author?.initials || "??"}
                      </div>
                      <span>{post.author?.name || "Unknown Author"}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-slate-300">{post.content}</p>
                  </CardContent>
                  <CardFooter className="flex items-center border-t dark:border-slate-700 pt-4">
                    <div className="flex -space-x-2">
                      {post.participants?.map((participant) => (
                        <div
                          key={participant.id}
                          className={`w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 ${participant.colorClass} flex items-center justify-center`}
                        >
                          <span className="text-xs font-medium">{participant.initials}</span>
                        </div>
                      )) || []}
                    </div>
                    <span className="ml-3 text-xs text-text-muted dark:text-slate-400">
                      {post.discussCount || 0} physicians discussed this
                    </span>
                    <div className="ml-auto flex space-x-2">
                      <button 
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() => handleSavePost(post.id, post.saved)}
                      >
                        <span className={`material-icons ${post.saved ? 'text-primary dark:text-primary-300' : 'text-text-muted dark:text-slate-400'} text-sm`}>
                          {post.saved ? 'bookmark' : 'bookmark_border'}
                        </span>
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
                        <span className="material-icons text-text-muted dark:text-slate-400 text-sm">share</span>
                      </button>
                      <Button variant="outline" size="sm" className="ml-2">
                        <span className="material-icons text-primary dark:text-primary-300 text-sm mr-1">comment</span>
                        Discuss
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <span className="material-icons text-4xl text-gray-300 dark:text-slate-600 mb-4">article</span>
                <h3 className="text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">No posts found</h3>
                <p className="text-gray-500 dark:text-slate-400 mb-6">
                  {activeTab === "saved" 
                    ? "You haven't saved any posts yet" 
                    : searchTerm 
                      ? `No results found for "${searchTerm}"`
                      : "No posts available in this category"}
                </p>
                {activeTab !== "saved" && (
                  <Button 
                    onClick={() => setOpenCreateDialog(true)}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    Be the first to post
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeHub;
