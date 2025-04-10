import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { UserProfile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProfileDetails = () => {
  // This would normally use the user ID from the route
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users/profile"],
  });

  // This would come from the API in a real implementation
  const skills = [
    { id: 1, name: "Cardiology", level: "Advanced" },
    { id: 2, name: "Patient Care", level: "Expert" },
    { id: 3, name: "Medical Research", level: "Intermediate" },
    { id: 4, name: "Surgery", level: "Advanced" },
    { id: 5, name: "Emergency Medicine", level: "Expert" },
  ];

  const experience = [
    { 
      id: 1, 
      role: "Senior Cardiologist", 
      organization: "Memorial Hospital", 
      location: "Boston, MA",
      startDate: "Jan 2020", 
      endDate: "Present",
      description: "Leading cardiology team specializing in coronary interventions and heart failure management."
    },
    { 
      id: 2, 
      role: "Cardiologist", 
      organization: "City Medical Center", 
      location: "New York, NY",
      startDate: "Mar 2015", 
      endDate: "Dec 2019",
      description: "Specialized in non-invasive cardiac imaging and preventive cardiology."
    },
    { 
      id: 3, 
      role: "Resident Physician", 
      organization: "University Hospital", 
      location: "Chicago, IL",
      startDate: "Jul 2012", 
      endDate: "Feb 2015",
      description: "Completed residency in internal medicine with focus on cardiovascular health."
    }
  ];

  const education = [
    {
      id: 1,
      degree: "MD, Cardiovascular Medicine",
      institution: "Harvard Medical School",
      location: "Boston, MA",
      startDate: "2008",
      endDate: "2012",
      description: "Graduated with honors, specialized in cardiovascular medicine."
    },
    {
      id: 2,
      degree: "BS, Human Biology",
      institution: "Stanford University",
      location: "Palo Alto, CA",
      startDate: "2004",
      endDate: "2008",
      description: "Summa cum laude, pre-med track with research focus on cardiovascular health."
    }
  ];

  const certifications = [
    { id: 1, name: "American Board of Internal Medicine", year: "2015" },
    { id: 2, name: "National Board of Echocardiography", year: "2016" },
    { id: 3, name: "Board Certified in Cardiovascular Disease", year: "2018" }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="h-60 bg-gray-200 dark:bg-slate-700 rounded-lg mb-6"></div>
              <div className="h-80 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Profile Header */}
      <Card className="bg-white dark:bg-slate-800 mb-6 overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
        <CardContent className="p-6 relative">
          <div className="flex flex-col lg:flex-row">
            <div className="flex items-center lg:items-start flex-col lg:flex-row">
              {/* Profile picture */}
              <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-semibold border-4 border-white dark:border-slate-800 -mt-16 lg:-mt-20 z-10">
                {profile?.initials || "MD"}
              </div>
              
              <div className="mt-4 lg:mt-0 lg:ml-6 text-center lg:text-left">
                <h1 className="text-2xl font-bold dark:text-white mb-1">{profile?.name || "Dr. John Wilson"}</h1>
                <p className="text-gray-600 dark:text-slate-400 mb-2">{profile?.title || "Cardiologist"} · {profile?.organization || "Memorial Hospital"}</p>
                <p className="text-gray-600 dark:text-slate-400 mb-4">Boston, Massachusetts · 500+ connections</p>
                
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <Button variant="default" size="sm" className="bg-primary text-white hover:bg-primary/90">
                    <span className="material-icons text-sm mr-1">person_add</span>
                    Connect
                  </Button>
                  <Button variant="outline" size="sm">
                    <span className="material-icons text-sm mr-1">mail</span>
                    Message
                  </Button>
                  <Button variant="outline" size="sm">
                    <span className="material-icons text-sm mr-1">more_horiz</span>
                    More
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0 lg:ml-auto">
              <div className="flex flex-col items-center lg:items-end">
                <div className="bg-white dark:bg-slate-700 shadow-sm rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center">
                      <span className="material-icons">psychology</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium dark:text-white">Profile views</h3>
                      <p className="text-gray-600 dark:text-slate-400">148 views this week</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-700 shadow-sm rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center">
                      <span className="material-icons">trending_up</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium dark:text-white">Publication impact</h3>
                      <p className="text-gray-600 dark:text-slate-400">+28% from last month</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white dark:bg-slate-800 overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border dark:border-slate-700">
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 dark:text-slate-400 mb-6">
                Experienced Cardiologist with over 10 years of practice. Specialized in advanced cardiac imaging and interventional procedures. Published researcher with focus on preventive cardiology and heart failure management.
              </p>
              
              <div className="space-y-4">
                <div className="flex">
                  <span className="material-icons text-text-muted dark:text-slate-400 mr-3">business</span>
                  <div>
                    <p className="font-medium dark:text-white">Memorial Hospital</p>
                    <p className="text-xs text-text-muted dark:text-slate-400">Current workplace</p>
                  </div>
                </div>
                
                <div className="flex">
                  <span className="material-icons text-text-muted dark:text-slate-400 mr-3">school</span>
                  <div>
                    <p className="font-medium dark:text-white">Harvard Medical School</p>
                    <p className="text-xs text-text-muted dark:text-slate-400">Education</p>
                  </div>
                </div>
                
                <div className="flex">
                  <span className="material-icons text-text-muted dark:text-slate-400 mr-3">home_work</span>
                  <div>
                    <p className="font-medium dark:text-white">Boston, Massachusetts</p>
                    <p className="text-xs text-text-muted dark:text-slate-400">Location</p>
                  </div>
                </div>
                
                <div className="flex">
                  <span className="material-icons text-text-muted dark:text-slate-400 mr-3">language</span>
                  <div>
                    <p className="font-medium dark:text-white">Website</p>
                    <a href="#" className="text-xs text-primary dark:text-primary-300">drjohnwilson.med</a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-slate-800 overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border dark:border-slate-700">
              <CardTitle className="text-lg">Skills & Endorsements</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {skills.map(skill => (
                  <div key={skill.id} className="pb-4 border-b dark:border-slate-700 last:border-0 last:pb-0">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-medium dark:text-white">{skill.name}</h3>
                      <Badge variant="outline" className="text-xs">{skill.level}</Badge>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="flex -space-x-2 mr-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-2 border-white dark:border-slate-800 flex items-center justify-center overflow-hidden">
                            <span className="text-xs font-medium">{String.fromCharCode(64 + i)}</span>
                          </div>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-slate-400">
                        Endorsed by {3 + Math.floor(Math.random() * 20)} colleagues
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <Button variant="ghost" className="w-full text-primary dark:text-primary-300">
                  Show all {skills.length} skills
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="experience">
            <Card className="bg-white dark:bg-slate-800 overflow-hidden">
              <div className="px-6 py-2 border-b border-border dark:border-slate-700">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="certifications">Certifications</TabsTrigger>
                  <TabsTrigger value="publications">Publications</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="experience" className="p-0 m-0">
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {experience.map(job => (
                      <div key={job.id} className="flex">
                        <div className="mr-4 mt-1">
                          <div className="w-12 h-12 rounded bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                            <span className="material-icons text-primary dark:text-primary-300">business</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium dark:text-white">{job.role}</h3>
                          <p className="text-primary dark:text-primary-300">{job.organization} · {job.location}</p>
                          <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{job.startDate} - {job.endDate}</p>
                          <p className="text-gray-600 dark:text-slate-400">{job.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="education" className="p-0 m-0">
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {education.map(edu => (
                      <div key={edu.id} className="flex">
                        <div className="mr-4 mt-1">
                          <div className="w-12 h-12 rounded bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                            <span className="material-icons text-primary dark:text-primary-300">school</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium dark:text-white">{edu.institution}</h3>
                          <p className="text-primary dark:text-primary-300">{edu.degree} · {edu.location}</p>
                          <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{edu.startDate} - {edu.endDate}</p>
                          <p className="text-gray-600 dark:text-slate-400">{edu.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="certifications" className="p-0 m-0">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {certifications.map(cert => (
                      <div key={cert.id} className="flex">
                        <div className="mr-4 mt-1">
                          <div className="w-12 h-12 rounded bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                            <span className="material-icons text-primary dark:text-primary-300">verified</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium dark:text-white">{cert.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400">Issued: {cert.year}</p>
                          <p className="text-sm text-primary dark:text-primary-300 mt-1">View credential</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="publications" className="p-0 m-0">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-icons text-gray-400 dark:text-slate-500 text-2xl">article</span>
                    </div>
                    <h3 className="text-lg font-medium dark:text-white mb-2">No publications yet</h3>
                    <p className="text-gray-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                      Share your research and publications with the medical community
                    </p>
                    <Button className="bg-primary text-white hover:bg-primary/90">
                      <span className="material-icons text-sm mr-1">add</span>
                      Add Publication
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;