import type { Metadata } from "next";
import { ComingSoon, comingSoonItem } from "../_components/coming-soon";

const item = comingSoonItem("/settings");

export const metadata: Metadata = { title: item.label, description: item.summary };

export default function SettingsPage() {
  return <ComingSoon item={item} />;
}
