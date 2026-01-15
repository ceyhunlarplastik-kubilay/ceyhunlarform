"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zod-resolver";
import * as z from "zod";

import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

import { Form } from "@/components/ui/form";
import { AsyncState } from "@/components/ui/async-state";

import {
  FormHeader,
  FormFooter,
  StepFields,
  PreviousButton,
  NextButton,
  SubmitButton,
  MultiStepFormContent,
} from "@/components/multi-step-viewer";

import { MultiStepFormProvider } from "@/hooks/use-multi-step-viewer";

import { WelcomeSection } from "@/components/form3/WelcomeSection";
import {
  SectorFormSection,
  SectorSkeleton,
} from "@/components/form3/SectorFormSection";
import {
  ProductsFormSection,
  ProductsSkeleton,
} from "@/components/form3/ProductsFormSection";
import { ContactFormSection } from "@/components/form3/ContactFormSection";
import { PreviewFormSection } from "@/components/form3/PreviewFormSection";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*                                ZOD SCHEMA                                  */
/* -------------------------------------------------------------------------- */

const formSchema = z.object({
  /* sektor: z.string().min(1, "Lütfen bir sektör seçiniz"), */
  sektor: z.string().nullable().optional(),
  uretimGrubu: z.string().optional(),
  urunler: z
    .array(
      z.object({
        productId: z.string(),
        productionGroupId: z.string(),
      })
    )
    .min(1, "Lütfen en az bir ürün seçiniz"),
  firmaAdi: z.string().min(2, "Firma adı en az 2 karakter olmalıdır"),
  ad: z.string().optional(),
  soyad: z.string().optional(),
  email: z.email("Geçerli bir email adresi giriniz"),
  telefon: z
    .string()
    .min(1, "Telefon numarası zorunludur")
    .refine(
      (value) => {
        // E.164 formatını kontrol et (örn: +905551234567)
        return /^\+[1-9]\d{1,14}$/.test(value);
      },
      { message: "Geçerli bir telefon numarası giriniz" }
    ),
  adres: z.string().optional(),
});

type Schema = z.infer<typeof formSchema>;

/* -------------------------------------------------------------------------- */
/*                           REACT QUERY FETCHERS                              */
/* -------------------------------------------------------------------------- */

async function fetchSectors() {
  const res = await fetch("/api/catalog/sectors");
  if (!res.ok) throw new Error("Sektörler yüklenemedi");
  return res.json();
}

async function fetchGroups(sectorId: string) {
  // "others" = Diğerleri seçimi, API'ye "all" olarak gönder
  const queryId = sectorId === "others" ? "all" : sectorId;
  const res = await fetch(`/api/catalog/options?sectorId=${queryId}`);
  if (!res.ok) throw new Error("Üretim grupları yüklenemedi");
  return res.json();
}

/* async function submitRequest(payload: any) {
  const res = await fetch("/api/submit-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
} */
async function submitRequest(payload: any) {
  const res = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function RequestForm3() {
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<Schema>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      sektor: "",
      uretimGrubu: "",
      urunler: [],
      firmaAdi: "",
      telefon: "",
      adres: "",
      ad: "",
      soyad: "",
      email: "",
    },
  });

  const selectedSector = form.watch("sektor");

  /* -------------------------------------------------------------------------- */
  /*                           QUERY: SECTORS (STATIC)                           */
  /* -------------------------------------------------------------------------- */

  const sectorsQuery = useQuery({
    queryKey: ["sectors"],
    queryFn: fetchSectors,
    staleTime: Infinity, // sektörler değişmez
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const sectors = useMemo(
    () => (Array.isArray(sectorsQuery.data) ? sectorsQuery.data : []),
    [sectorsQuery.data]
  );

  /* -------------------------------------------------------------------------- */
  /*                           QUERY: GROUPS + PRODUCTS                          */
  /* -------------------------------------------------------------------------- */

  // selectedSector can be a sector ID, "others", or empty string
  // We need to fetch groups when there's any truthy value
  const shouldFetchGroups = !!selectedSector && selectedSector.length > 0;

  const groupsQuery = useQuery({
    queryKey: ["groups", selectedSector],
    queryFn: () => fetchGroups(selectedSector!),
    enabled: shouldFetchGroups,
    staleTime: 1000 * 60 * 10, // 10 dakika cache
    gcTime: 1000 * 60 * 30, // 30 dakika çöp toplama
  });

  const groups = groupsQuery.data?.groups || [];

  /* -------------------------------------------------------------------------- */
  /*                    RESET PRODUCTS WHEN SECTOR CHANGES                       */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    // Sektör değiştiğinde ürünleri ve üretim grubunu temizle
    if (selectedSector) {
      form.setValue("urunler", []);
      form.setValue("uretimGrubu", "");
    }
  }, [selectedSector, form]);

  /* -------------------------------------------------------------------------- */
  /*                           PREVIEW MAPPING (MEMO)                            */
  /* -------------------------------------------------------------------------- */

  const sectorOptions = useMemo(
    () =>
      sectors.map((s: any) => ({
        sectorId: s._id,
        name: s.name,
      })),
    [sectors]
  );

  const productOptions = useMemo(
    () =>
      groups.flatMap((g: any) =>
        g.products.map((p: any) => ({
          productId: p.productId,
          name: p.name,
        }))
      ),
    [groups]
  );

  /* -------------------------------------------------------------------------- */
  /*                              MUTATION: SUBMIT                               */
  /* -------------------------------------------------------------------------- */

  const submitMutation = useMutation({
    mutationFn: submitRequest,
    onSuccess: () => {
      toast.success("Talebiniz başarıyla alındı!");
      setIsSuccess(true);
    },
    onError: () => {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
    },
  });

  const onSubmit = (data: Schema) => {
    // "others" = Diğerleri, normal seçimler ise MongoDB ObjectId
    const sectorIdToSend = data.sektor === "others" ? null : data.sektor;

    // Tüm ürünleri topla
    const allProducts = groups.flatMap((g: any) => g.products);

    // Ürün ID'lerini isimlere dönüştür
    const productNames = data.urunler
      .map((pid) => {
        const product = allProducts.find((p: any) => p.productId === pid);
        return product?.name || null;
      })
      .filter(Boolean); // null değerleri filtrele

    // Üretim grubunu bul - eğer seçilmemişse, seçilen ürünlerden otomatik tespit et
    let groupName = groups.find(
      (g: any) => g.groupId === data.uretimGrubu
    )?.name;

    // Eğer üretim grubu seçilmemişse, seçilen ürünlerden otomatik tespit et
    if (!groupName && data.urunler.length > 0) {
      const firstProductId = data.urunler[0];
      const groupWithProduct = groups.find((g: any) =>
        g.products.some((p: any) => p.productId === firstProductId)
      );
      groupName = groupWithProduct?.name;
    }

    submitMutation.mutate({
      companyName: data.firmaAdi,
      firstName: data.ad,
      lastName: data.soyad,
      email: data.email,
      phone: data.telefon,
      address: data.adres,
      sectorId: sectorIdToSend,
      products: data.urunler,
    });
  };

  /* -------------------------------------------------------------------------- */
  /*                               SUCCESS SCREEN                                */
  /* -------------------------------------------------------------------------- */

  if (isSuccess) {
    return (
      <div className="p-5 w-full rounded-md border bg-white shadow-sm">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center text-center py-12"
        >
          <div className="mb-6 flex justify-center border-4 border-green-100 bg-green-50 rounded-full p-4">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Teşekkürler!</h2>
          <p className="text-muted-foreground max-w-md pb-4">
            Numune talebiniz başarıyla alınmıştır. En kısa sürede sizinle
            iletişime geçeceğiz.
          </p>
          <Button
            size="lg"
            variant="brand"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Yeniden Talep Oluştur
          </Button>
        </motion.div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                  FORM VIEW                                  */
  /* -------------------------------------------------------------------------- */

  const stepsFields = [
    { fields: [], component: <WelcomeSection /> },

    {
      fields: ["sektor"],
      component: (
        <AsyncState
          isLoading={sectorsQuery.isLoading}
          isError={sectorsQuery.isError}
          error={sectorsQuery.error}
          loadingMessage="Sektörler yükleniyor..."
          loadingFallback={<SectorSkeleton />}
        >
          <SectorFormSection form={form} sectors={sectors} />
        </AsyncState>
      ),
    },

    {
      fields: ["urunler"],
      component: (
        <AsyncState
          isLoading={groupsQuery.isLoading}
          isError={groupsQuery.isError}
          error={groupsQuery.error}
          loadingMessage="Ürünler yükleniyor..."
          loadingFallback={<ProductsSkeleton />}
        >
          <ProductsFormSection form={form} groups={groups} />
        </AsyncState>
      ),
    },

    {
      fields: ["firmaAdi", "ad", "soyad", "email", "telefon", "adres"],
      component: <ContactFormSection form={form} />,
    },

    {
      fields: [],
      component: (
        <PreviewFormSection
          form={form}
          sectors={sectorOptions}
          groups={groups}
          products={productOptions}
        />
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col py-6 px-2 sm:px-4 rounded-xl border bg-white shadow-sm min-h-[600px]"
        >
          <MultiStepFormProvider
            stepsFields={stepsFields}
            onStepValidation={async (step) => {
              if (step.fields.length === 0) return true;

              const isValid = await form.trigger(step.fields as any);

              if (step.fields.includes("urunler")) {
                const selectedProducts = form.getValues("urunler");
                if (!selectedProducts?.length) {
                  toast.warning("Lütfen en az bir ürün seçiniz.");
                  return false;
                }
              }

              return isValid;
            }}
          >
            <MultiStepFormContent className="h-full justify-between">
              <div className="space-y-6">
                <FormHeader />
                <StepFields />
              </div>

              <FormFooter>
                <PreviousButton className="w-full justify-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Geri
                </PreviousButton>

                <NextButton
                  hideOnSteps={[1]}
                  className="w-full justify-center gap-2"
                >
                  İleri
                  <ChevronRight className="w-4 h-4" />
                </NextButton>

                <SubmitButton
                  disabled={submitMutation.isPending}
                  className="w-full justify-center gap-2"
                >
                  {submitMutation.isPending
                    ? "Gönderiliyor..."
                    : "Talebi Gönder"}
                </SubmitButton>
              </FormFooter>
            </MultiStepFormContent>
          </MultiStepFormProvider>
        </form>
      </Form>
    </div>
  );
}
