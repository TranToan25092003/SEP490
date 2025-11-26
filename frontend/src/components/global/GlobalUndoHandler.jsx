import { useEffect } from "react";
import { undoLastAction } from "../../api/undo";
import { toast } from "sonner";

export const GlobalUndoHandler = ({ children }) => {
  useEffect(() => {
    const handleKeyDown = async (event) => {
      const isUndo =
        (event.ctrlKey || event.metaKey) &&
        event.key === "z" &&
        !event.shiftKey;

      if (isUndo) {
        event.preventDefault();

        const confirmed = window.confirm(
          "Bạn có chắc chắn muốn hoàn tác hành động cuối cùng?"
        );

        if (confirmed) {
          const promise = undoLastAction();

          toast.promise(promise, {
            loading: "Đang hoàn tác...",
            success: (message) => {
              setTimeout(() => { window.location.reload(); }, 1000);
              return message;
            },
            error: "Hoàn tác thất bại",
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return children;
};
