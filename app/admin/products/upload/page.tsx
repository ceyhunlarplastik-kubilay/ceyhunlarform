"use client";

import { type PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function UploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !inputFileRef.current?.files ||
      inputFileRef.current.files.length === 0
    ) {
      toast.error("Dosya seçilmedi");
      return;
    }

    const file = inputFileRef.current.files[0];
    setUploading(true);

    try {
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/products/upload",
      });

      setBlob(newBlob);
      toast.success("Yükleme başarılı!");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Yükleme başarısız oldu");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (blob?.url) {
      navigator.clipboard.writeText(blob.url);
      setCopied(true);
      toast.success("URL kopyalandı");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ürün Görseli Yükle</CardTitle>
          <CardDescription>
            Manuel olarak görsel yükleyip URL almak için bu aracı
            kullanabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Görsel Seç</Label>
              <Input
                id="file"
                name="file"
                ref={inputFileRef}
                type="file"
                accept="image/*"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Yükle
                </>
              )}
            </Button>
          </form>

          {blob && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2 break-all">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Blob URL:
              </div>
              <div className="flex items-center gap-2 p-2 bg-background border rounded text-xs font-mono">
                <span className="flex-1 truncate">{blob.url}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>

              <div className="mt-2 aspect-video relative rounded-md overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blob.url}
                  alt="Uploaded"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
