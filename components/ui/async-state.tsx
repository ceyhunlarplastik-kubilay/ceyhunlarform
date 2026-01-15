import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

interface AsyncStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingMessage?: string;
}

export function AsyncState({
  isLoading,
  isError,
  error,
  children,
  loadingMessage = "Yükleniyor...",
  loadingFallback,
}: AsyncStateProps & { loadingFallback?: React.ReactNode }) {
  if (isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[200px]">
        <Spinner size={32} />
        <p className="text-sm text-muted-foreground animate-pulse">
          {loadingMessage}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>
          {error?.message ||
            "Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz."}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
