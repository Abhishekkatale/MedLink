import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentWithSharing } from "@/lib/types";
import { Button } from "@/components/ui/button";

const RecentDocuments = () => {
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery<DocumentWithSharing[]>({
    queryKey: ["/api/documents/recent"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/recent"] });
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

  const handleDownload = (documentId: number) => {
    window.open(`/api/documents/${documentId}/download`, "_blank");
  };

  const handleShare = (documentId: number) => {
    // In a real app, this would open a sharing dialog
    console.log("Sharing document:", documentId);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-card">
      <div className="px-6 py-4 border-b border-border dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold dark:text-white">Recent Documents</h2>
        <Button 
          variant="link" 
          className="text-sm text-primary dark:text-primary-300 font-medium"
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? "Uploading..." : "Upload New"}
        </Button>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary dark:text-slate-400 uppercase tracking-wider">Shared With</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary dark:text-slate-400 uppercase tracking-wider">Updated</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-slate-700">
                {documents && documents.length > 0 ? (
                  documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`material-icons text-${doc.typeLabel.color} dark:text-${doc.typeLabel.color}-300 mr-2`}>{doc.icon}</span>
                          <span className="text-sm font-medium text-text-primary dark:text-white">{doc.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full bg-${doc.typeLabel.color}/10 text-${doc.typeLabel.color} dark:bg-${doc.typeLabel.color}/20 dark:text-${doc.typeLabel.color}-300`}>
                          {doc.typeLabel.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex -space-x-2">
                          {doc.sharedWith.map((user) => (
                            <div 
                              key={user.id} 
                              className={`w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 ${user.colorClass} flex items-center justify-center`}
                            >
                              <span className="text-xs font-medium">{user.initials}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary dark:text-slate-400">
                        {doc.timeAgo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button 
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                          onClick={() => handleDownload(doc.id)}
                        >
                          <span className="material-icons text-text-secondary dark:text-slate-400 text-sm">download</span>
                        </button>
                        <button 
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                          onClick={() => handleShare(doc.id)}
                        >
                          <span className="material-icons text-text-secondary dark:text-slate-400 text-sm">share</span>
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
                          <span className="material-icons text-text-secondary dark:text-slate-400 text-sm">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <span className="material-icons text-4xl text-gray-300 dark:text-slate-600 mb-2">description</span>
                      <p className="text-lg font-medium text-gray-500 dark:text-slate-400">No documents found</p>
                      <p className="text-sm text-gray-400 dark:text-slate-500">Upload a document to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <Button
          variant="outline"
          className="w-full py-3 mt-4 text-sm text-primary dark:text-primary-300 font-medium border border-primary/20 dark:border-primary/30 rounded-md hover:bg-primary/5 dark:hover:bg-primary/10"
        >
          View All Documents
        </Button>
      </div>
    </div>
  );
};

export default RecentDocuments;
