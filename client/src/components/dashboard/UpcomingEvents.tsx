import { useQuery } from "@tanstack/react-query";
import { UpcomingEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";

const UpcomingEvents = () => {
  const { data: events, isLoading } = useQuery<UpcomingEvent[]>({
    queryKey: ["/api/events/upcoming"],
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-card animate-pulse">
        <div className="px-6 py-4 border-b border-border dark:border-slate-700">
          <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
        <div className="p-6 space-y-5">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start">
              <div className="w-12 h-12 rounded bg-gray-200 dark:bg-slate-700"></div>
              <div className="ml-3 flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-card">
      <div className="px-6 py-4 border-b border-border dark:border-slate-700">
        <h2 className="text-lg font-semibold dark:text-white">Upcoming Events</h2>
      </div>
      
      <div className="p-6">
        {events && events.length > 0 ? (
          <>
            {events.map((event, index) => (
              <div 
                key={event.id} 
                className={index < events.length - 1 ? "mb-5 pb-5 border-b border-border dark:border-slate-700" : "mb-5"}
              >
                <div className="flex items-start">
                  <div className={`w-12 h-12 rounded bg-${event.eventType.color}/10 dark:bg-${event.eventType.color}/20 flex flex-col items-center justify-center text-${event.eventType.color} dark:text-${event.eventType.color}-300 flex-shrink-0`}>
                    <span className="text-xs font-medium">{event.dateFormatted.month}</span>
                    <span className="text-lg font-semibold">{event.dateFormatted.day}</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold mb-1 dark:text-white">{event.title}</h3>
                    <p className="text-xs text-text-secondary dark:text-slate-300 mb-2">{event.location} · {event.time}</p>
                    <div className="flex items-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${event.eventType.color}/10 text-${event.eventType.color} dark:bg-${event.eventType.color}/20 dark:text-${event.eventType.color}-300`}>
                        {event.eventType.name}
                      </span>
                      <span className="ml-2 text-xs text-text-muted dark:text-slate-400">{event.attendeeCount} attending</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-6">
            <span className="material-icons text-4xl text-gray-300 dark:text-slate-600 mb-2">event</span>
            <p className="text-lg font-medium text-gray-500 dark:text-slate-400">No upcoming events</p>
            <p className="text-sm text-gray-400 dark:text-slate-500">Check back later for new events</p>
          </div>
        )}
        
        <Button
          variant="outline"
          className="w-full py-2.5 text-sm text-primary dark:text-primary-300 font-medium border border-primary/20 dark:border-primary/30 rounded-md hover:bg-primary/5 dark:hover:bg-primary/10"
        >
          View All Events
        </Button>
      </div>
    </div>
  );
};

export default UpcomingEvents;
