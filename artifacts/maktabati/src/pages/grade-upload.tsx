import { useState, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetGrade, useGetSubjectsByGrade, useGetLevels } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronLeft, Upload, CheckCircle, AlertCircle, FileText, ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BookType = "book" | "summary" | "exam";

interface UploadedFile {
  objectPath: string;
  name: string;
}

export default function GradeUploadPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const gradeId = Number(params.id);
  const { toast } = useToast();

  const { data: grade, isLoading: gradeLoading } = useGetGrade(gradeId);
  const { data: levels } = useGetLevels();
  const { data: subjects, isLoading: subjectsLoading } = useGetSubjectsByGrade(gradeId);

  const level = levels?.find((l) => l.id === grade?.levelId);

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [bookType, setBookType] = useState<BookType>("book");
  const [pdfFile, setPdfFile] = useState<UploadedFile | null>(null);
  const [coverFile, setCoverFile] = useState<UploadedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile: uploadPdf, isUploading: pdfUploading, progress: pdfProgress } = useUpload({
    onSuccess: (res) => setPdfFile({ objectPath: res.objectPath, name: res.metadata.name }),
    onError: () => toast({ title: "فشل رفع الملف", description: "تحقق من الاتصال وحاول مجدداً", variant: "destructive" }),
  });

  const { uploadFile: uploadCover, isUploading: coverUploading, progress: coverProgress } = useUpload({
    onSuccess: (res) => setCoverFile({ objectPath: res.objectPath, name: res.metadata.name }),
    onError: () => toast({ title: "فشل رفع الصورة", variant: "destructive" }),
  });

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "الملف يجب أن يكون PDF", variant: "destructive" });
      return;
    }
    if (!title) setTitle(file.name.replace(/\.pdf$/i, "").replace(/_/g, " "));
    await uploadPdf(file);
    e.target.value = "";
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadCover(file);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !subjectId || !title.trim()) {
      toast({ title: "يرجى تعبئة جميع الحقول ورفع ملف PDF", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/books/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          gradeId,
          subjectId: Number(subjectId),
          levelId: grade?.levelId,
          type: bookType,
          objectPath: pdfFile.objectPath,
          coverImagePath: coverFile?.objectPath ?? null,
          coverColor: null,
          description: null,
        }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      setSuccess(true);
      toast({ title: "✅ تمت إضافة الكتاب بنجاح!" });
      setTimeout(() => {
        setTitle(""); setSubjectId(""); setPdfFile(null); setCoverFile(null);
        setBookType("book"); setSuccess(false);
      }, 2000);
    } catch {
      toast({ title: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabel: Record<BookType, string> = { book: "كتاب المنهج", summary: "ملخص / مذكرة", exam: "نموذج اختبار" };
  const typeColor: Record<BookType, string> = { book: "#3b82f6", summary: "#22c55e", exam: "#f97316" };

  return (
    <div className="space-y-8 max-w-2xl mx-auto" dir="rtl">
      <Breadcrumb dir="rtl">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/">الرئيسية</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator><ChevronLeft className="h-4 w-4" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            {level ? <BreadcrumbLink asChild><Link href={`/level/${level.id}`}>{level.nameAr}</Link></BreadcrumbLink> : <Skeleton className="h-4 w-20" />}
          </BreadcrumbItem>
          <BreadcrumbSeparator><ChevronLeft className="h-4 w-4" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            {grade ? <BreadcrumbLink asChild><Link href={`/grade/${gradeId}/books`}>{grade.nameAr}</Link></BreadcrumbLink> : <Skeleton className="h-4 w-20" />}
          </BreadcrumbItem>
          <BreadcrumbSeparator><ChevronLeft className="h-4 w-4" /></BreadcrumbSeparator>
          <BreadcrumbItem><BreadcrumbPage>رفع كتاب</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Upload className="text-primary" />
          <span>رفع كتاب لـ {gradeLoading ? "..." : grade?.nameAr}</span>
        </h1>
        <p className="text-muted-foreground mt-1">ارفع ملف PDF وسيُضاف الكتاب مباشرة للتطبيق</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-2xl p-6 shadow-sm">
        {/* PDF Upload */}
        <div className="space-y-2">
          <Label className="text-base font-bold">ملف PDF <span className="text-destructive">*</span></Label>
          <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handlePdfChange} disabled={pdfUploading} />
          {!pdfFile ? (
            <button type="button" onClick={() => pdfInputRef.current?.click()} disabled={pdfUploading}
              className="w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50">
              {pdfUploading ? (
                <>
                  <Loader2 className="animate-spin text-primary" size={36} />
                  <p className="font-medium text-primary">جارٍ الرفع... {pdfProgress}%</p>
                  <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pdfProgress}%` }} /></div>
                </>
              ) : (
                <>
                  <FileText size={36} className="text-muted-foreground" />
                  <p className="font-medium">اضغط لاختيار ملف PDF</p>
                  <p className="text-sm text-muted-foreground">يقبل ملفات PDF فقط</p>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="text-green-600 shrink-0" size={24} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-800 truncate">{pdfFile.name}</p>
                <p className="text-sm text-green-600">تم الرفع بنجاح</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPdfFile(null)}>تغيير</Button>
            </div>
          )}
        </div>

        {/* Cover Image Upload */}
        <div className="space-y-2">
          <Label className="text-base font-bold">صورة الغلاف <span className="text-muted-foreground font-normal text-sm">(اختياري)</span></Label>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} disabled={coverUploading} />
          {!coverFile ? (
            <button type="button" onClick={() => coverInputRef.current?.click()} disabled={coverUploading}
              className="w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50">
              {coverUploading ? (
                <>
                  <Loader2 className="animate-spin text-primary" size={28} />
                  <p className="text-sm font-medium text-primary">جارٍ الرفع... {coverProgress}%</p>
                </>
              ) : (
                <>
                  <ImageIcon size={28} className="text-muted-foreground" />
                  <p className="text-sm font-medium">اضغط لرفع صورة الغلاف</p>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="text-green-600 shrink-0" size={20} />
              <p className="flex-1 text-sm font-medium text-green-800 truncate">{coverFile.name}</p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCoverFile(null)}>تغيير</Button>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-bold">عنوان الكتاب <span className="text-destructive">*</span></Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: كتاب الرياضيات الجزء الأول" className="text-right h-11" required />
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label className="text-base font-bold">المادة الدراسية <span className="text-destructive">*</span></Label>
          {subjectsLoading ? <Skeleton className="h-11 w-full" /> : (
            <Select value={subjectId} onValueChange={setSubjectId} dir="rtl">
              <SelectTrigger className="h-11">
                <SelectValue placeholder="اختر المادة الدراسية" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.nameAr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label className="text-base font-bold">نوع الملف</Label>
          <div className="grid grid-cols-3 gap-3">
            {(["book", "summary", "exam"] as BookType[]).map((t) => (
              <button key={t} type="button" onClick={() => setBookType(t)}
                className="p-3 border-2 rounded-xl text-sm font-medium transition-all"
                style={bookType === t ? { borderColor: typeColor[t], backgroundColor: typeColor[t] + "18", color: typeColor[t] } : {}}>
                {typeLabel[t]}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl" disabled={submitting || pdfUploading || !pdfFile}>
          {submitting ? (<><Loader2 className="animate-spin ml-2" size={18} /> جارٍ الحفظ...</>) :
            success ? (<><CheckCircle className="ml-2" size={18} /> تمت الإضافة!</>) :
            (<><Upload className="ml-2" size={18} /> إضافة الكتاب</>)}
        </Button>
      </form>

      <div className="text-center">
        <Link href={`/grade/${gradeId}/books`}>
          <Button variant="outline" className="rounded-xl">العودة لقائمة الكتب</Button>
        </Link>
      </div>
    </div>
  );
}
