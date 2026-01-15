"use client";

import * as React from "react";
import PhoneNumberInput, { type Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import flags from "react-phone-number-input/flags";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Custom InputComponent using Shadcn UI Input
const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  return <Input {...props} ref={ref} className={cn("w-full", className)} />;
});
InputComponent.displayName = "PhoneInput.Input";

export type PhoneInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: Country;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      onChange,
      defaultCountry = "TR",
      id,
      name,
      placeholder = "Telefon numarası",
      disabled,
      className,
    },
    ref
  ) => {
    return (
      <PhoneNumberInput
        international
        withCountryCallingCode
        defaultCountry={defaultCountry}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        id={id}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("phone-input-container", className)}
        countrySelectProps={{ flags }}
        inputComponent={InputComponent}
        limitMaxLength={true} // ✅ Uzunluk sınırı getirildi
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
