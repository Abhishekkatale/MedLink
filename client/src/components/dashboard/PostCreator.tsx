import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";

type User = {
  id: number;
  name: string;
  initials: string;
  username: string;
};

type CategoryOption = {
  value: string;
  label: string;
};


const PostCreator = () => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
  });

  const { data: categoriesData } = useQuery<CategoryOption[]>({
    queryKey: ["/api/categories"],
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    // This would be handled by a mutation in a real implementation
    console.log({ title, content, category });
    setOpenCreateDialog(false);
    setTitle("");
    setContent("");
    setCategory("");
  }; 


  return (
    <>
      <Card className="shadow-card mb-6 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 dark:bg-primary-800/30 text-primary dark:text-primary-300 rounded-full flex items-center justify-center font-medium">
              {currentUser?.initials || "MD"}
            </div>
            <Button 
              variant="outline" 
              className="flex-1 justify-start text-left font-normal text-text-secondary dark:text-slate-400 h-10"
              onClick={() => setOpenCreateDialog(true)}
            >
              Start a post
            </Button>
          </div>
          <div className="grid grid-cols-3 mt-3">
            <Button variant="ghost" className="flex items-center justify-center gap-2 text-sm font-medium">
              <span className="material-icons text-blue-600 dark:text-blue-400 text-[20px]">image</span>
              <span>Media</span>
            </Button>
            <Button variant="ghost" className="flex items-center justify-center gap-2 text-sm font-medium">
              <span className="material-icons text-amber-600 dark:text-amber-400 text-[20px]">lightbulb</span>
              <span>Contribute expertise</span>
            </Button>
            <Button variant="ghost" className="flex items-center justify-center gap-2 text-sm font-medium">
              <span className="material-icons text-purple-600 dark:text-purple-400 text-[20px]">edit_note</span>
              <span>Write article</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create a New Post</DialogTitle>
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
                    {categoriesData?.map((cat) => (
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
              >
                Post
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostCreator;