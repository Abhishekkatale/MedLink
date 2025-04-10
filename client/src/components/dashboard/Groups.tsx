import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Group = {
  id: number;
  title: string;
  icon: string;
  colorClass: string;
};

const Groups = () => {
  const [groups] = useState<Group[]>([
    {
      id: 1,
      title: "Cardiology Research Network",
      icon: "favorite",
      colorClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    },
    {
      id: 2,
      title: "Medical Imaging Specialists",
      icon: "image",
      colorClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
    },
    {
      id: 3,
      title: "Healthcare Technology Forum",
      icon: "biotech",
      colorClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
    },
    {
      id: 4,
      title: "Physician Leadership Guild",
      icon: "group",
      colorClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
    },
    {
      id: 5,
      title: "Medical Ethics Committee",
      icon: "balance",
      colorClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
    }
  ]);

  const [showMore, setShowMore] = useState(false);
  const displayGroups = showMore ? groups : groups.slice(0, 3);

  return (
    <Card className="shadow-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border dark:border-slate-700 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Groups</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full h-8 w-8 text-text-secondary dark:text-slate-400"
        >
          <span className="material-icons text-lg">add</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border dark:divide-slate-700">
          {displayGroups.map((group) => (
            <li key={group.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${group.colorClass}`}>
                  <span className="material-icons text-lg">{group.icon}</span>
                </div>
                <p className="font-medium text-sm dark:text-white">{group.title}</p>
              </div>
            </li>
          ))}
        </ul>
        {groups.length > 3 && (
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

export default Groups;