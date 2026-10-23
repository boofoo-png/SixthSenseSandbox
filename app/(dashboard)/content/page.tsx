import type { Metadata } from "next";
import { ComingSoon, comingSoonItem } from "../_components/coming-soon";

const item = comingSoonItem("/content");

export const metadata: Metadata = { title: item.label, description: item.summary };

export default function ContentPage() {
  return <ComingSoon item={item} />;
}
