"use client";

import { Controller } from "react-hook-form";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

import { Field, FieldError } from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CheckCircle2 } from "lucide-react";

import { FormSectionStickyWrapper } from "@/components/form3/form-section/FormSectionStickyWrapper";
import { getSectorImage } from "@/constants/sectors";
import { useMultiStepViewer } from "@/hooks/use-multi-step-viewer";

interface SectorFormSectionProps {
  form: any;
  sectors: { _id: string; name: string; image: string; imageUrl?: string }[];
}

export const SectorFormSection = ({
  form,
  sectors,
}: SectorFormSectionProps) => {
  const { nextStep } = useMultiStepViewer();
  const sectionRef = useRef<HTMLDivElement>(null);

  // Normalize sectors
  const sectorData = sectors
    .map((s) => ({
      id: s._id,
      name: s.name,
      // Prioritize DB image (imageUrl), then hardcoded fallback
      image:
        s.imageUrl ||
        sectors.find((x) => x.name === s.name)?.image ||
        getSectorImage(s.name),
    }))
    .filter((x) => !!x.image);

  const selectedSector = form.watch("sektor");

  // Scroll down when a sector is selected
  useEffect(() => {
    if (!selectedSector || !sectionRef.current) return;

    const el = sectionRef.current;

    setTimeout(() => {
      const r = el.getBoundingClientRect();
      const offset = r.bottom - window.innerHeight + 200;

      window.scrollTo({
        top: window.scrollY + Math.max(offset, 400),
        behavior: "smooth",
      });
    }, 300);
  }, [selectedSector]);

  return (
    <FormSectionStickyWrapper
      title="Sektör Seçimi"
      description="Lütfen ilgilendiğiniz sektörü seçiniz."
    >
      <div ref={sectionRef}>
        <Controller
          name="sektor"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-4">
              {/* SEKTÖRLER GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sectorData.map((sector, index) => {
                  const isSelected = field.value === sector.id;

                  return (
                    <SectorCard
                      key={sector.id}
                      sector={sector}
                      isSelected={isSelected}
                      onClick={() => {
                        field.onChange(sector.id);
                        // Auto-advance after selection
                        setTimeout(() => nextStep(), 150);
                      }}
                      index={index}
                    />
                  );
                })}

                {/* DİĞERLERİ */}
                <OtherSectorCard
                  isSelected={field.value === "others"}
                  onClick={() => {
                    field.onChange("others");
                    // Auto-advance after selection
                    setTimeout(() => nextStep(), 150);
                  }}
                  index={sectorData.length}
                />
              </div>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </FormSectionStickyWrapper>
  );
};

/* -------------------------------------------------------------------------- */
/*                           SUB COMPONENTS                                   */
/* -------------------------------------------------------------------------- */

import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";

function SectorCard({
  sector,
  isSelected,
  onClick,
  index,
}: {
  sector: any;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all h-full",
          "hover:shadow-md hover:border-primary/50",
          isSelected
            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
            : ""
        )}
        onClick={onClick}
      >
        <CardHeader className="p-4">
          <AspectRatio
            ratio={1 / 1}
            className="relative rounded-md overflow-hidden mb-2 bg-muted/20"
          >
            <ImageWithSkeleton
              src={sector.image}
              alt={sector.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {isSelected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-primary/20 flex items-center justify-center"
              >
                <CheckCircle2 className="text-white w-12 h-12 drop-shadow-md" />
              </motion.div>
            )}
          </AspectRatio>

          <CardTitle className="flex justify-between items-center text-lg">
            {sector.name}
            {isSelected && (
              <Badge variant="secondary" className="ml-2">
                Seçildi
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <CardDescription>
            {sector.name} sektörü için numune talep edin.
          </CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function OtherSectorCard({
  isSelected,
  onClick,
  index,
}: {
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card
        className={cn(
          "cursor-pointer border-dashed border-2 transition-all h-full",
          "hover:shadow-md hover:border-primary/50",
          isSelected
            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
            : ""
        )}
        onClick={onClick}
      >
        <CardHeader className="p-4">
          <AspectRatio
            ratio={1 / 1}
            className="relative rounded-md overflow-hidden mb-2 bg-muted/20"
          >
            <ImageWithSkeleton
              src="/others.jpg"
              alt="Diğerleri"
              fill
              className="object-cover opacity-80"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </AspectRatio>
          <CardTitle className="text-lg">Diğerleri</CardTitle>
        </CardHeader>

        <CardContent>
          <CardDescription>Listede yer almayan sektörler</CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ImageWithSkeleton({ src, alt, className, ...props }: any) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      {!isLoaded && <Skeleton className="w-full h-full absolute inset-0" />}
      <Image
        src={src}
        alt={alt}
        className={cn(
          className,
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </>
  );
}

export function SectorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="h-full">
            <CardHeader className="p-4">
              <AspectRatio ratio={1 / 1} className="mb-2">
                <Skeleton className="w-full h-full rounded-md" />
              </AspectRatio>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
