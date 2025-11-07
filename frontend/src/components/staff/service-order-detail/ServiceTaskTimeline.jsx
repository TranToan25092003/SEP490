import { formatDateTime } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

const ServiceTaskTimeline = ({ timeline, onEditEntry }) => {
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

            <Button type="ghost" onClick={() => typeof onEditEntry === "function" && onEditEntry(entry)}>
              <Pencil className="mr-2 h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceTaskTimeline;
