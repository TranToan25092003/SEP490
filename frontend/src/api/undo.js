import { customFetch } from "@/utils/customAxios";

export const undoLastAction = async () => {
  const response = await customFetch("/history/undo", {
    method: "POST",
  });

  return response.data.message;
}
