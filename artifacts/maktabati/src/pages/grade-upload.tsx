import { useState, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import {
  useGetGrade,
  useGetLevels,
  useGetSubjectsByGrade,
} from "@workspace/api-client-react";
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
import {
  ChevronLeft,
  Upload,
  CheckCircle,
  FileText,
  Loader2,
  Trash2,
  Plus,
  CloudUpload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type BookType = "book" | "summary" | "exam";

interface QueueItem {
  id: string;
  file: File;
  title: string;
  subjectId: string;
  bookType: BookType;
  state: "pending" | "uploading-file" | "saving" | "done" | "error";
  progress: number;
  objectPath?: string;
  errorMsg?: string;
}

const TYPE_LABEL: Record<BookType, string> = {
  book: "كتاب المنهج",
  summary: "ملخص / مذكرة",
  exam: "نموذج اختبار",
};
const TYPE_COLOR: Record<BookType, string> = {
  book: "bg-blue-100 text-blue-700 border-blue-200",
  summary: "bg-green-100 text-green-700 border-green-200",
  exam: "bg-orange-100 text-orange-700 border-orange-200",
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GradeUploadPage() {
  const params = useParams();
  const gradeId = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: grade, isLoading: gradeLoading } = useGetGrade(gradeId);
  const { data: levels } = useGetLevels();
  const { data: subjects, isLoading: subjectsLoading } = useGetSubjectsByGrade(gradeId);

  const level = levels?.find((l) => l.id === grade?.levelId);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: QueueItem[] = Array.from(files)
      .filter((f) => f.type === "application/pdf")
      .map((f) => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        title: f.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " "),
        subjectId: subjects?.[0] ? String(subjects[0].id) : "",
        bookType: "book",
        state: "pending",
        progress: 0,
      }));
    if (newItems.length < Array.from(files).length) {
      toast({ title: "بعض الملفات ليست PDF وتم تجاهلها", variant: "destructive" });
    }
    setQueue((q) => [...q, ...newItems]);
  }, [subjects, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const updateItem = (id: string, patch: Partial<QueueItem>) =>
    setQueue((q) => q.map((item) => item.id === id ? { ...item, ...patch } : item));

  const removeItem = (id: string) =>
    setQueue((q) => q.filter((item) => item.id !== id));

  const uploadOne = async (item: QueueItem): Promise<boolean> => {
    updateItem(item.id, { state: "uploading-file", progress: 5 });
    try {
      // Step 1: request presigned URL
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.file.name,
          size: item.file.size,
          contentType: "application/pdf",
        }),
      });
      if (!urlRes.ok) throw new Error("فشل الحصول على رابط الرفع");
      const { uploadURL, objectPath } = await urlRes.json();

      updateItem(item.id, { progress: 20 });

      // Step 2: upload to GCS with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = 20 + Math.round((e.loaded / e.total) * 60);
            updateItem(item.id, { progress: pct });
          }
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("فشل رفع الملف"));
        xhr.onerror = () => reject(new Error("خطأ في الشبكة"));
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", "application/pdf");
        xhr.send(item.file);
      });

      updateItem(item.id, { state: "saving", progress: 85, objectPath });

      // Step 3: save to DB
      const saveRes = await fetch("/api/books/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title.trim() || item.file.name,
          gradeId,
          subjectId: Number(item.subjectId),
          levelId: grade?.levelId,
          type: item.bookType,
          objectPath,
          coverImagePath: null,
          coverColor: null,
          description: null,
        }),
      });
      if (!saveRes.ok) throw new Error("فشل حفظ البيانات");

      updateItem(item.id, { state: "done", progress: 100 });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير معروف";
      updateItem(item.id, { state: "error", errorMsg: msg });
      return false;
    }
  };

  const handleUploadAll = async () => {
    const pending = queue.filter((q) => q.state === "pending" || q.state === "error");
    if (pending.length === 0) return;
    // validate
    const invalid = pending.find((q) => !q.subjectId || !q.title.trim());
    if (invalid) {
      toast({ title: "يرجى تعبئة العنوان والمادة لكل الملفات", variant: "destructive" });
      return;
    }
    let successCount = 0;
    for (const item of pending) {
      const ok = await uploadOne(item);
      if (ok) successCount++;
    }
    if (successCount > 0) {
      await queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: `✅ تم رفع ${successCount} ملف بنجاح!` });
    }
    if (successCount < pending.length) {
      toast({ title: `فشل رفع ${pending.length - successCount} ملف`, variant: "destructive" });
    }
  };

  const pendingCount = queue.filter((q) => q.state === "pending" || q.state === "error").length;
  const doneCount = queue.filter((q) => q.state === "done").length;
  const isUploading = queue.some((q) => q.state === "uploading-file" || q.state === "saving");

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <Breadcrumb dir="rtl">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/">الرئيسية</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator><ChevronLeft className="h-4 w-4" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            {level ? (
              <BreadcrumbLink asChild><Link href={`/level/${level.id}`}>{level.nameAr}</Link></BreadcrumbLink>
            ) : <Skeleton className="h-4 w-20 inline-block" />}
          </BreadcrumbItem>
          <BreadcrumbSeparator><ChevronLeft className="h-4 w-4" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            {grade ? (
              <BreadcrumbLink asChild><Link href={`/grade/${gradeId}/books`}>{grade.nameAr}</Link></BreadcrumbLink>
            ) : <Skeleton className="h-4 w-20 inline-block" />}
          </BreadcrumbItem>
          <BreadcrumbSeparator><ChevronLeft className="h-4 w-4" /></BreadcrumbSeparator>
          <BreadcrumbItem><BreadcrumbPage>رفع كتب</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CloudUpload className="text-primary" />
            رفع كتب لـ {gradeLoading ? "..." : grade?.nameAr}
          </h1>
          <p className="text-muted-foreground mt-1">
            ارفع ملفات PDF متعددة دفعة واحدة — لا يوجد حد للعدد أو الحجم
          </p>
        </div>
        {queue.length > 0 && (
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{doneCount}</span> / {queue.length} مكتمل
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl transition-all cursor-pointer select-none
          flex flex-col items-center justify-center gap-4 text-center p-16
          ${isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
        />
        <div className={`p-5 rounded-full transition-colors ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
          <CloudUpload size={48} className={isDragging ? "text-primary" : "text-muted-foreground"} />
        </div>
        <div>
          <p className="text-xl font-bold">
            {isDragging ? "أفلت الملفات هنا" : "اسحب ملفات PDF وأفلتها هنا"}
          </p>
          <p className="text-muted-foreground mt-1">أو اضغط لاختيار الملفات</p>
          <p className="text-sm text-muted-foreground mt-2">
            يمكنك رفع ملفات متعددة في نفس الوقت — بدون حد للحجم
          </p>
        </div>
        <Button variant="outline" className="rounded-xl gap-2 pointer-events-none">
          <Plus size={16} />
          اختيار ملفات PDF
        </Button>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">{queue.length} ملف في قائمة الرفع</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => setQueue((q) => q.filter((i) => i.state !== "done"))}>
              إزالة المكتملة
            </Button>
          </div>

          {queue.map((item) => (
            <div key={item.id}
              className={`bg-card border rounded-2xl p-4 shadow-sm transition-all
                ${item.state === "done" ? "opacity-70 border-green-200 bg-green-50/30" : ""}
                ${item.state === "error" ? "border-destructive/40 bg-destructive/5" : ""}
              `}>
              <div className="flex gap-3 items-start">
                {/* File icon */}
                <div className={`p-2 rounded-xl shrink-0 mt-1 ${
                  item.state === "done" ? "bg-green-100" :
                  item.state === "error" ? "bg-red-100" : "bg-muted"
                }`}>
                  {item.state === "done" ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : item.state === "error" ? (
                    <FileText size={20} className="text-red-500" />
                  ) : (
                    <FileText size={20} className="text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground truncate max-w-xs">{item.file.name}</span>
                    <span className="text-xs text-muted-foreground">({formatSize(item.file.size)})</span>
                    {item.state === "done" && (
                      <span className="text-xs text-green-600 font-medium">✓ تم الرفع</span>
                    )}
                    {item.state === "error" && (
                      <span className="text-xs text-red-500">{item.errorMsg}</span>
                    )}
                  </div>

                  {/* Fields — show even during upload (read-only) */}
                  {item.state !== "done" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1">
                        <Input
                          value={item.title}
                          onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          placeholder="عنوان الكتاب"
                          className="text-right h-9 text-sm"
                          disabled={item.state !== "pending" && item.state !== "error"}
                        />
                      </div>
                      <div>
                        {subjectsLoading ? <Skeleton className="h-9 w-full" /> : (
                          <Select
                            value={item.subjectId}
                            onValueChange={(v) => updateItem(item.id, { subjectId: v })}
                            dir="rtl"
                            disabled={item.state !== "pending" && item.state !== "error"}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="المادة" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects?.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>{s.nameAr}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div>
                        <Select
                          value={item.bookType}
                          onValueChange={(v) => updateItem(item.id, { bookType: v as BookType })}
                          dir="rtl"
                          disabled={item.state !== "pending" && item.state !== "error"}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(["book", "summary", "exam"] as BookType[]).map((t) => (
                              <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  {(item.state === "uploading-file" || item.state === "saving") && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Loader2 size={12} className="animate-spin" />
                        {item.state === "saving" ? "جارٍ الحفظ في قاعدة البيانات..." : `جارٍ الرفع... ${item.progress}%`}
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Remove btn */}
                {(item.state === "pending" || item.state === "error" || item.state === "done") && (
                  <Button
                    variant="ghost" size="icon"
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                    onClick={() => removeItem(item.id)}>
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && (
        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold rounded-2xl gap-3"
          onClick={handleUploadAll}
          disabled={isUploading}>
          {isUploading ? (
            <><Loader2 className="animate-spin" size={20} />جارٍ الرفع...</>
          ) : (
            <><Upload size={20} />رفع {pendingCount} {pendingCount === 1 ? "ملف" : "ملفات"}</>
          )}
        </Button>
      )}

      {/* Footer links */}
      <div className="flex justify-between items-center text-sm pt-2 flex-wrap gap-2">
        <Link href={`/grade/${gradeId}/books`}>
          <Button variant="outline" className="rounded-xl">العودة لقائمة الكتب</Button>
        </Link>
        <Link href="/admin">
          <Button variant="ghost" className="rounded-xl text-muted-foreground gap-1">
            <FileText size={15} />
            لوحة الإدارة
          </Button>
        </Link>
      </div>
    </div>
  );
}
