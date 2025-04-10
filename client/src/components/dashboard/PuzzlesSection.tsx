import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Puzzle = {
  id: number;
  title: string;
  icon: string;
  color: string;
  connections: number;
};

const PuzzlesSection = () => {
  const [puzzles] = useState<Puzzle[]>([
    {
      id: 1,
      title: "Medical Acronyms",
      icon: "lightbulb",
      color: "text-amber-500 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300",
      connections: 11
    },
    {
      id: 2,
      title: "Anatomy Challenge",
      icon: "biotech",
      color: "text-teal-500 bg-teal-100 dark:bg-teal-900/20 dark:text-teal-300",
      connections: 7
    },
    {
      id: 3,
      title: "Medical Breakthroughs",
      icon: "psychology",
      color: "text-purple-500 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300",
      connections: 7
    }
  ]);

  const [showMore, setShowMore] = useState(false);

  return (
    <Card className="shadow-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border dark:border-slate-700">
        <CardTitle className="text-lg">Today's puzzles</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border dark:divide-slate-700">
          {puzzles.map((puzzle) => (
            <li key={puzzle.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${puzzle.color}`}>
                      <span className="material-icons text-lg">{puzzle.icon}</span>
                    </div>
                    <p className="font-medium text-sm dark:text-white">{puzzle.title}</p>
                  </div>
                  <span className="material-icons text-text-secondary dark:text-slate-400">chevron_right</span>
                </div>
                <p className="mt-1 text-xs text-text-secondary dark:text-slate-400 ml-11">
                  {puzzle.connections} connections played
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="p-3 text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowMore(!showMore)}
            className="text-sm text-primary dark:text-primary-300 font-medium w-full justify-center"
          >
            Show more
            <span className="material-icons text-sm ml-1">expand_more</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PuzzlesSection;