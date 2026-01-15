"use client";

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { FormSectionHeader } from "@/components/form3/form-section/FormSectionHeader";
import { PhoneInput } from "@/components/form3/form-section/PhoneInput";

import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";

/**
 * Gelişmiş Telefon Validasyonu
 * - Tüm ülkeler için çalışır
 * - Otomatik format kontrolü
 * - Ülkeye özel karakter sayısı kontrolü
 */
export const phoneSchema = z
  .string()
  .min(1, "Telefon numarası zorunludur.")
  .refine(
    (value) => {
      // Boş değer kontrolü
      if (!value) return false;
      // react-phone-number-input'un kendi validasyonu
      return isValidPhoneNumber(value);
    },
    {
      message: "Geçerli bir telefon numarası giriniz.",
    }
  );

export const ContactFormSection = ({ form }: { form: any }) => {
  return (
    <div className="space-y-6">
      <FormSectionHeader
        title="İletişim Bilgileri"
        description="Size ulaşabilmemiz için lütfen iletişim bilgilerinizi eksiksiz doldurunuz."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Firma Adı */}
        <Controller
          name="firmaAdi"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
              <FieldLabel>Firma Adı</FieldLabel>
              <Input {...field} placeholder="Firma Adı" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Ad */}
        <Controller
          name="ad"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
              <FieldLabel>Ad</FieldLabel>
              <Input {...field} placeholder="Adınız" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Soyad */}
        <Controller
          name="soyad"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
              <FieldLabel>Soyad</FieldLabel>
              <Input {...field} placeholder="Soyadınız" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Email */}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
              <FieldLabel>E-posta</FieldLabel>
              <Input {...field} type="email" placeholder="foo@bar.com" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Telefon */}
        <Controller
          name="telefon"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
              <FieldLabel>Telefon</FieldLabel>

              <PhoneInput
                value={field.value}
                onChange={field.onChange}
                defaultCountry="TR"
                placeholder="555 555 55 55"
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      {/* Adres */}
      <Controller
        name="adres"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="space-y-1">
            <FieldLabel>Adres</FieldLabel>
            <Textarea
              {...field}
              placeholder="Şirket adresiniz..."
              className="min-h-[100px]"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );
};
