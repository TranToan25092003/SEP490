import { Clerk } from "@clerk/clerk-js";

const clerk = new Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

await clerk.load();

export default clerk;
