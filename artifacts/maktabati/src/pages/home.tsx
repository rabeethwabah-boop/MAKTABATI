import { useGetStats, useGetLevels } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Book, FileText, FileSpreadsheet, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: levels, isLoading: levelsLoading } = useGetLevels();

  return (
    <div className="space-y-12">
      <section className="text-center py-12 md:py-20 rounded-3xl bg-primary/5 border border-primary/10">
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6">
          مرحباً بك في <span className="text-primary">مكتبتي</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
          المنصة الرقمية الشاملة للمنهج المدرسي اليمني. تصفح وحمل الكتب، الملخصات، ونماذج الاختبارات بسهولة لجميع المراحل الدراسية.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <GraduationCap className="text-primary" /> 
          <span>المراحل الدراسية</span>
        </h2>
        
        {levelsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {levels?.map((level) => (
              <Link key={level.id} href={`/level/${level.id}`}>
                <div 
                  className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer flex flex-col h-full"
                  style={{ borderTopWidth: '4px', borderTopColor: level.color || "var(--primary)" }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl" style={{ color: level.color || "var(--primary)" }}>
                      {level.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{level.nameAr}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{level.gradeRange}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mt-auto leading-relaxed">
                    {level.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<Book size={24} />} 
            title="الكتب المدرسية" 
            value={stats?.totalBooks} 
            loading={statsLoading} 
            color="text-blue-500" 
            bg="bg-blue-50"
          />
          <StatCard 
            icon={<FileText size={24} />} 
            title="الملخصات" 
            value={stats?.totalSummaries} 
            loading={statsLoading}
            color="text-emerald-500" 
            bg="bg-emerald-50"
          />
          <StatCard 
            icon={<FileSpreadsheet size={24} />} 
            title="نماذج اختبارات" 
            value={stats?.totalExams} 
            loading={statsLoading}
            color="text-orange-500" 
            bg="bg-orange-50"
          />
          <StatCard 
            icon={<GraduationCap size={24} />} 
            title="الصفوف" 
            value={stats?.totalGrades} 
            loading={statsLoading}
            color="text-purple-500" 
            bg="bg-purple-50"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, title, value, loading, color, bg }: { icon: React.ReactNode, title: string, value?: number, loading: boolean, color: string, bg: string }) {
  return (
    <div className="bg-card rounded-2xl p-6 border shadow-sm flex flex-col items-center justify-center text-center gap-3">
      <div className={`p-3 rounded-full ${bg} ${color}`}>
        {icon}
      </div>
      <h3 className="font-medium text-muted-foreground text-sm">{title}</h3>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className="text-3xl font-black">{value || 0}</p>
      )}
    </div>
  );
}
