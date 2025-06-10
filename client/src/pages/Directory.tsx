import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth

type SpecialtyFilter = "all" | string;

const Directory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<SpecialtyFilter>("all");
  const queryClient = useQueryClient();
  const { token } = useAuth(); // Get token

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/directory", searchTerm, specialtyFilter], // This query will use the updated getQueryFn
  });

  const { data: specialties } = useQuery<string[]>({
    queryKey: ["/api/specialties"],
  });

  const { data: connectionRequests } = useQuery<User[]>({
    queryKey: ["/api/users/connection-requests"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search will be triggered by setting the state
  };

  const handleConnectRequest = async (userId: number) => {
    try {
      // Use apiRequest which handles token
      await apiRequest("POST", "/api/connections/connect", { userId }, token);
      
      // Refetch users to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/users/directory"] });
      // Optionally, also refetch connection requests if that's a separate query and relevant here
      queryClient.invalidateQueries({ queryKey: ["/api/users/connection-requests"] });
    } catch (error) {
      // Errors (including auth) should be caught by react-query's global handler or useMutation's onError
      console.error("Error connecting with user:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Directory</h1>
          <p className="text-gray-600">Find and connect with healthcare professionals</p>
        </div>
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
                  placeholder="Search professionals..." 
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
              <Tabs defaultValue="all" value={specialtyFilter} onValueChange={(value) => setSpecialtyFilter(value as SpecialtyFilter)}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="connected">Connected</TabsTrigger>
                </TabsList>
                
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Specialty</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="spec-all"
                      className="rounded text-primary mr-2"
                      checked={specialtyFilter === "all"}
                      onChange={() => setSpecialtyFilter("all")}
                    />
                    <label htmlFor="spec-all" className="text-sm">All Specialties</label>
                  </div>
                  
                  {specialties?.map((specialty) => (
                    <div key={specialty} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`spec-${specialty}`}
                        className="rounded text-primary mr-2"
                        checked={specialtyFilter === specialty}
                        onChange={() => setSpecialtyFilter(specialtyFilter === specialty ? "all" : specialty)}
                      />
                      <label htmlFor={`spec-${specialty}`} className="text-sm">{specialty}</label>
                    </div>
                  ))}
                </div>
              </Tabs>
            </div>
          </div>
          
          {connectionRequests && connectionRequests.length > 0 && (
            <div className="bg-white rounded-lg shadow-card mt-6">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Connection Requests</h2>
              </div>
              <div className="p-4 space-y-4">
                {connectionRequests.map((request) => (
                  <div key={request.id} className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium flex-shrink-0">
                      {request.initials}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium">{request.name}</p>
                      <p className="text-xs text-gray-500">{request.title}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        Accept
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                      >
                        Ignore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
        
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      <div className="ml-3 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                        {user.initials}
                      </div>
                      <div className="ml-3">
                        <CardTitle className="text-base">{user.name}</CardTitle>
                        <p className="text-xs text-gray-500">{user.title}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2 mb-4">
                      <p className="flex items-center text-gray-600">
                        <span className="material-icons text-gray-400 text-sm mr-1">business</span>
                        {user.organization}
                      </p>
                      <p className="flex items-center text-gray-600">
                        <span className="material-icons text-gray-400 text-sm mr-1">location_on</span>
                        {user.location}
                      </p>
                    </div>
                    <Button 
                      variant={user.isConnected ? "outline" : "default"}
                      className={user.isConnected ? "w-full border-primary/20 text-primary" : "w-full bg-primary text-white"}
                      onClick={() => !user.isConnected && handleConnectRequest(user.id)}
                      disabled={user.isConnected}
                    >
                      {user.isConnected ? (
                        <>
                          <span className="material-icons text-primary text-sm mr-1">check</span>
                          Connected
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-white text-sm mr-1">person_add</span>
                          Connect
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <span className="material-icons text-4xl text-gray-300 mb-4">people</span>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No professionals found</h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? `No results found for "${searchTerm}"`
                    : "Try adjusting your filters to find more professionals"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Directory;
