import { Link } from "wouter";
import { BookOpen } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background" dir="rtl">
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <BookOpen size={24} />
            </div>
            <span className="font-bold text-xl text-primary tracking-tight">مكتبتي</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t bg-card py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>مكتبتي © {new Date().getFullYear()} - المنهج المدرسي اليمني</p>
        </div>
      </footer>
    </div>
  );
}
