import { redirect } from "next/navigation";

// The Figma Make has no separate profile page: the company name opens Settings, starting on Profile.
export default function ProfilePage() {
  redirect("/settings?section=profile");
}
