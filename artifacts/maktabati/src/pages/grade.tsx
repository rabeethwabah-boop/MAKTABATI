import { useParams, Link } from "wouter";
import { useGetGrade, useGetLevels, useGetSubjectsByGrade } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, BookMarked, ArrowLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export default function GradePage() {
  const params = useParams();
  const gradeId = Number(params.id);
  
  const { data: grade, isLoading: gradeLoading } = useGetGrade(gradeId);
  const { data: levels, isLoading: levelsLoading } = useGetLevels();
  const { data: subjects, isLoading: subjectsLoading } = useGetSubjectsByGrade(gradeId);
  
  const level = levels?.find(l => l.id === grade?.levelId);

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
            {levelsLoading || gradeLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <BreadcrumbLink asChild>
                <Link href={`/level/${level?.id}`}>{level?.nameAr}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronLeft className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            {gradeLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <BreadcrumbPage>{grade?.nameAr}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {gradeLoading ? (
            <Skeleton className="h-10 w-48 mb-2" />
          ) : (
            <h1 className="text-3xl font-bold">{grade?.nameAr}</h1>
          )}
          <p className="text-muted-foreground mt-1">
            {levelsLoading || gradeLoading ? <Skeleton className="h-4 w-64" /> : `المواد الدراسية والمقررات ل${grade?.nameAr}`}
          </p>
        </div>
        
        {!gradeLoading && (
          <Link href={`/grade/${gradeId}/books`}>
            <Button className="gap-2 shrink-0 rounded-xl" size="lg">
              <BookMarked size={20} />
              <span>تصفح جميع كتب الصف</span>
              <ArrowLeft size={16} className="mr-2" />
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {subjectsLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))
        ) : subjects && subjects.length > 0 ? (
          subjects.map(subject => (
            <Link key={subject.id} href={`/subject/${subject.id}`}>
              <div 
                className="bg-card hover:bg-accent/30 border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group cursor-pointer h-full"
                style={{ borderBottomWidth: '4px', borderBottomColor: subject.color || "var(--primary)" }}
              >
                <div className="text-4xl group-hover:scale-110 transition-transform" style={{ color: subject.color || "var(--primary)" }}>
                  {subject.icon}
                </div>
                <h3 className="font-bold text-sm leading-tight">{subject.nameAr}</h3>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card border rounded-2xl border-dashed">
            لا توجد مواد مضافة لهذا الصف بعد
          </div>
        )}
      </div>
    </div>
  );
}
