import { redirect } from "next/navigation";

// Temporary until there is an app shell with an overview page: send
// visitors straight to the only section that exists so far.
export default function Home() {
  redirect("/analytics");
}
