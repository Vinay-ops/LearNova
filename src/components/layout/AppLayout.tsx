import { AppTopNav } from "./AppTopNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppTopNav />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
