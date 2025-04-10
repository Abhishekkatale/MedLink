import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Activity = {
  id: number;
  title: string;
  icon: string;
  colorClass: string;
};

const RecentActivities = () => {
  const [activities] = useState<Activity[]>([
    {
      id: 1,
      title: "Mpox Surveillance Intensified",
      icon: "code",
      colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    },
    {
      id: 2,
      title: "Medical Innovations & Research",
      icon: "science",
      colorClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
    },
    {
      id: 3,
      title: "Advisory for Safe Work Environments in Medical Institutions",
      icon: "data_object",
      colorClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
    },
    {
      id : 4,
      title: "AI Course for Medical Professionals",
      icon: "data_object",
      colorClass: "bg-red-100 text-purple-700 dark:bg-red-900/30 dark:text-purple-300"
    },
    {
      id: 5,
      title: "Technology Investor Club: Healthcare",
      icon: "monitoring",
      colorClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
    },
    {
      id: 6,
      title: "Medical Education Forum",
      icon: "school",
      colorClass: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
    }
  ]);

  const [showMore, setShowMore] = useState(false);
  const displayActivities = showMore ? activities : activities.slice(0, 3);

  return (
    <Card className="shadow-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border dark:border-slate-700">
        <CardTitle className="text-lg">Recent</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border dark:divide-slate-700">
          {displayActivities.map((activity) => (
            <li key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${activity.colorClass}`}>
                  <span className="material-icons text-lg">{activity.icon}</span>
                </div>
                <p className="font-medium text-sm dark:text-white">{activity.title}</p>
              </div>
            </li>
          ))}
        </ul>
        {activities.length > 3 && (
          <div className="p-3 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMore(!showMore)}
              className="text-sm text-primary dark:text-primary-300 font-medium w-full justify-center"
            >
              {showMore ? "Show less" : "Show more"} 
              <span className="material-icons text-sm ml-1">{showMore ? "expand_less" : "expand_more"}</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivities;