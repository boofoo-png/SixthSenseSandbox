import type { Metadata } from "next";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/button";
import { ComingSoon, comingSoonItem } from "../_components/coming-soon";
import { cardClass, cardHeadingClass } from "../_components/styles";

const item = comingSoonItem("/settings");

export const metadata: Metadata = { title: item.label, description: item.summary };

// Sign out lives here, as on the Figma Make's Settings page (the sidebar only links to Settings).
export default function SettingsPage() {
  return (
    <ComingSoon item={item}>
      <section aria-labelledby="sign-out-heading" className={`mt-6 max-w-3xl ${cardClass}`}>
        <h2 id="sign-out-heading" className={cardHeadingClass}>
          Account
        </h2>
        <form action={signOut} className="mt-3">
          <Button type="submit" variant="outlined">
            Sign out
          </Button>
        </form>
      </section>
    </ComingSoon>
  );
}
