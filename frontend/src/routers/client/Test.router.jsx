import Test from "@/pages/Test";
import { authenTicationLoader } from "@/utils/authentication.loader";


// this router is for testing
export const testRouter = {
  path: "/test",
  element: <Test></Test>,
  errorElement: <h1>error</h1>,
  loader: authenTicationLoader,
};

