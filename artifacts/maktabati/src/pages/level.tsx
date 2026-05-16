import { useParams, Link } from "wouter";
import { useGetLevels, useGetGradesByLevel } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, GraduationCap } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function LevelPage() {
  const params = useParams();
  const levelId = Number(params.id);
  
  const { data: levels, isLoading: levelsLoading } = useGetLevels();
  const { data: grades, isLoading: gradesLoading } = useGetGradesByLevel(levelId);
  
  const level = levels?.find(l => l.id === levelId);

  return (
    <div className="space-y-8">
      <Breadcrumb dir="rtl">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">الرئيسية</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronLeft className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            {levelsLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <BreadcrumbPage>{level?.nameAr}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        {levelsLoading ? (
          <Skeleton className="h-10 w-48 mb-2" />
        ) : (
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span style={{ color: level?.color || "var(--primary)" }}>{level?.icon}</span>
            <span>{level?.nameAr}</span>
          </h1>
        )}
        <p className="text-muted-foreground mt-2">
          {levelsLoading ? <Skeleton className="h-4 w-64" /> : level?.description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {gradesLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))
        ) : grades && grades.length > 0 ? (
          grades.map(grade => (
            <Link key={grade.id} href={`/grade/${grade.id}/books`}>
              <div className="bg-card hover:bg-accent/50 border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group cursor-pointer h-full">
                <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{grade.nameAr}</h3>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card border rounded-2xl border-dashed">
            لا توجد صفوف مضافة لهذه المرحلة بعد
          </div>
        )}
      </div>
    </div>
  );
}
