import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentWithSharing } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth

const Documents = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth(); // Get token
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const { data: documents, isLoading } = useQuery<DocumentWithSharing[]>({
    queryKey: ["/api/documents", activeTab, searchTerm],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      // For FormData, fetch needs to set Content-Type to multipart/form-data automatically.
      // We only add Authorization header. apiRequest might try to set Content-Type if data is present.
      // So, we might need a direct fetch here or ensure apiRequest handles FormData correctly.
      // Let's try direct fetch for FormData upload.
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        headers, // Pass only Authorization, let browser set Content-Type for FormData
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(response.status + ": " + (errorData || "Upload failed"));
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async ({ documentId, userIds }: { documentId: number; userIds: number[] }) => {
      // Use apiRequest which handles token
      const response = await apiRequest("POST", `/api/documents/${documentId}/share`, { userIds }, token);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setOpenShareDialog(false);
      setSelectedDocument(null);
      setSelectedUsers([]);
    },
  });

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadMutation.mutate(file);
      }
    };
    input.click();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search will be triggered by setting the state, which will cause the query to refetch
  };

  const openShare = (documentId: number) => {
    setSelectedDocument(documentId);
    setOpenShareDialog(true);
  };

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDocument || selectedUsers.length === 0) {
      alert("Please select at least one user to share with");
      return;
    }
    
    shareMutation.mutate({
      documentId: selectedDocument,
      userIds: selectedUsers,
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Documents</h1>
          <p className="text-gray-600">Secure document sharing and management</p>
        </div>
        
        <Button 
          className="mt-4 sm:mt-0 bg-primary text-white hover:bg-primary/90"
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
        >
          <span className="material-icons mr-2 text-sm">
            cloud_upload
          </span>
          {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-card p-4 mb-6">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-gray-400 text-lg">search</span>
                </span>
                <Input 
                  type="text" 
                  placeholder="Search documents..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>
          </div>
          
          <div className="bg-white rounded-lg shadow-card">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Filters</h2>
            </div>
            <div className="p-4">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-1 mb-4">
                  <TabsTrigger value="all">All Documents</TabsTrigger>
                </TabsList>
                
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Document Type</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="type-pdf"
                      className="rounded text-primary mr-2"
                      checked={activeTab === "pdf"}
                      onChange={() => setActiveTab(activeTab === "pdf" ? "all" : "pdf")}
                    />
                    <label htmlFor="type-pdf" className="text-sm">PDF</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="type-excel"
                      className="rounded text-primary mr-2"
                      checked={activeTab === "excel"}
                      onChange={() => setActiveTab(activeTab === "excel" ? "all" : "excel")}
                    />
                    <label htmlFor="type-excel" className="text-sm">Excel</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="type-ppt"
                      className="rounded text-primary mr-2"
                      checked={activeTab === "ppt"}
                      onChange={() => setActiveTab(activeTab === "ppt" ? "all" : "ppt")}
                    />
                    <label htmlFor="type-ppt" className="text-sm">PowerPoint</label>
                  </div>
                </div>
                
                <div className="space-y-2 mt-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Sharing</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="shared-by-me"
                      className="rounded text-primary mr-2"
                      checked={activeTab === "shared-by-me"}
                      onChange={() => setActiveTab(activeTab === "shared-by-me" ? "all" : "shared-by-me")}
                    />
                    <label htmlFor="shared-by-me" className="text-sm">Shared by me</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="shared-with-me"
                      className="rounded text-primary mr-2"
                      checked={activeTab === "shared-with-me"}
                      onChange={() => setActiveTab(activeTab === "shared-with-me" ? "all" : "shared-with-me")}
                    />
                    <label htmlFor="shared-with-me" className="text-sm">Shared with me</label>
                  </div>
                </div>
              </Tabs>
            </div>
          </div>
        </aside>
        
        <div className="flex-1">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Your Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 animate-pulse">
                  <div className="h-10 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Shared With</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Updated</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`material-icons text-${doc.typeLabel.color} mr-2`}>{doc.icon}</span>
                              <span className="text-sm font-medium text-text-primary">{doc.filename}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full bg-${doc.typeLabel.color}/10 text-${doc.typeLabel.color}`}>
                              {doc.typeLabel.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {doc.sharedWith.length > 0 ? (
                              <div className="flex -space-x-2">
                                {doc.sharedWith.map((user) => (
                                  <div 
                                    key={user.id} 
                                    className={`w-6 h-6 rounded-full border-2 border-white ${user.colorClass} flex items-center justify-center`}
                                  >
                                    <span className="text-xs font-medium">{user.initials}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">Not shared</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                            {doc.timeAgo}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <a 
                              href={`/api/documents/${doc.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-gray-100 inline-block"
                            >
                              <span className="material-icons text-text-secondary text-sm">download</span>
                            </a>
                            <button 
                              className="p-1.5 rounded-md hover:bg-gray-100"
                              onClick={() => openShare(doc.id)}
                            >
                              <span className="material-icons text-text-secondary text-sm">share</span>
                            </button>
                            <button className="p-1.5 rounded-md hover:bg-gray-100">
                              <span className="material-icons text-text-secondary text-sm">more_vert</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <span className="material-icons text-4xl text-gray-300 mb-4">description</span>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No documents found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm 
                      ? `No results found for "${searchTerm}"`
                      : "Upload a document to get started"}
                  </p>
                  <Button 
                    onClick={handleUpload}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    Upload your first document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={openShareDialog} onOpenChange={setOpenShareDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Select users to share this document with
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShare}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="users">Share with:</Label>
                <Select 
                  onValueChange={(value) => setSelectedUsers([...selectedUsers, Number(value)])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select users" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedUsers.length > 0 && (
                  <div className="mt-4">
                    <Label>Selected users:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedUsers.map((userId) => {
                        const user = users?.find(u => u.id === userId);
                        return user ? (
                          <div key={userId} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                            <span className="text-sm">{user.name}</span>
                            <button 
                              type="button"
                              className="ml-2"
                              onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                            >
                              <span className="material-icons text-gray-500 text-sm">close</span>
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-primary text-white"
                disabled={shareMutation.isPending || selectedUsers.length === 0}
              >
                {shareMutation.isPending ? "Sharing..." : "Share Document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;
