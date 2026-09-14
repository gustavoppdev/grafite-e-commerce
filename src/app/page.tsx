import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <h1 className="text-sm tracking-[0.3em]">{siteConfig.name}</h1>
    </main>
  );
}
