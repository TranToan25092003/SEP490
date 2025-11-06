import { formatDateTime } from "@/lib/utils";

const ServiceTaskTimeline = ({ timeline }) => {
  return (
    <div className="relative">
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-6">
        {timeline.map((entry) => (
          <div key={entry.id} className="relative pl-8">
            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-background" />

            <div className="bg-muted/50 rounded-lg px-2 pt-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h5 className="font-medium text-sm">{entry.title}</h5>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(entry.timestamp)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{entry.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceTaskTimeline;
