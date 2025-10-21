import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** @typedef {import("./index").BookingCommentProps} BookingCommentProps */

/**
 * Displays the comment section tied to the booking form.
 * @param {BookingCommentProps} props
 */
const BookingComment = ({ className, ...props }) => {
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

BookingComment.displayName = "BookingComment";

export default BookingComment;
