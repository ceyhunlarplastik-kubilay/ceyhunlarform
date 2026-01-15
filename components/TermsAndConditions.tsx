import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface TermsAndConditionsProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
}

export function TermsAndConditions({
  checked,
  onCheckedChange,
  error,
}: TermsAndConditionsProps) {
  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg">
      <Checkbox
        id="acceptTerms"
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1"
      />
      <div className="grid gap-2 flex-1">
        <Label htmlFor="acceptTerms" className="text-base font-medium">
          Kullanım Şartlarını Kabul Ediyorum *
        </Label>
        <p className="text-muted-foreground text-sm">
          Plastik bağlantı numunelerinin gönderilmesi ve kullanımı ile ilgili{" "}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="link"
                className="h-auto p-0 text-primary hover:text-primary/80"
                type="button"
              >
                kullanım şartlarını
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Kullanım Şartları ve Gizlilik Politikası
                </DialogTitle>
                <DialogDescription>
                  Lütfen aşağıdaki şartları dikkatlice okuyunuz.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <section>
                  <h3 className="font-semibold text-lg mb-2">
                    1. Numune Gönderim Şartları
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Talep edilen numuneler sadece test ve değerlendirme
                      amaçlıdır.
                    </li>
                    <li>Numuneler ticari kullanım için uygun değildir.</li>
                    <li>
                      Gönderilen numunelerin tüm maliyetleri firmamız tarafından
                      karşılanmaktadır.
                    </li>
                    <li>
                      Numune gönderimi sadece Türkiye içi adreslere
                      yapılmaktadır.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">
                    2. Veri Kullanımı ve Gizlilik
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Sağladığınız iletişim bilgileri sadece numune gönderimi ve
                      takibi için kullanılacaktır.
                    </li>
                    <li>Kişisel verileriniz KVKK kapsamında korunmaktadır.</li>
                    <li>Bilgileriniz üçüncü şahıslarla paylaşılmayacaktır.</li>
                    <li>
                      İletişim bilgileriniz reklam veya pazarlama amaçlı
                      kullanılmayacaktır.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">
                    3. Sorumluluklar
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Numuneler test amaçlıdır, üretimde kullanım için teknik
                      desteğe ihtiyaç duyabilirsiniz.
                    </li>
                    <li>
                      Numunelerin uygunsuz kullanımından kaynaklanan sorunlardan
                      firmamız sorumlu değildir.
                    </li>
                    <li>
                      Numunelerin teknik özellikleri değişiklik gösterebilir.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">
                    4. Teslimat ve Takip
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Numuneler talep tarihinden itibaren 3-5 iş günü içinde
                      gönderilir.
                    </li>
                    <li>
                      Kargo takip numarası email adresinize iletilecektir.
                    </li>
                    <li>
                      Gümrük ve yerel vergiler alıcıya aittir (uluslararası
                      gönderimlerde).
                    </li>
                  </ul>
                </section>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Önemli:</strong> Bu formu doldurarak yukarıdaki tüm
                    şartları kabul etmiş sayılırsınız. Numune talebiniz
                    onaylandıktan sonra tarafınıza gönderim yapılacaktır.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Kapat</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    type="button"
                    onClick={() => {
                      onCheckedChange(true);
                    }}
                  >
                    Şartları Kabul Et ve Kapat
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>{" "}
          okudum ve kabul ediyorum.
        </p>
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
