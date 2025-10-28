import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * ServiceOrderComment Component
 * Displays the comment section tied to the service order form.
 */
const ServiceOrderComment = ({ className, ...props }) => {
  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle>Ghi Chú</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comment">Nhập lời nhắn...</Label>
          <Textarea
            id="comment"
            placeholder="Nhập lời nhắn..."
            value={"Placeholder commentc"}
            className="min-h-[100px]"
            readOnly
          />
        </div>
      </CardContent>
    </Card>
  );
};

ServiceOrderComment.displayName = "ServiceOrderComment";

export default ServiceOrderComment;
