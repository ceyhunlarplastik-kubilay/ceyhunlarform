"use client";

import { Suspense } from "react";
import CustomersPageClient from "./CustomersPageClient";
import { CustomersTableSkeleton } from "@/components/customers/CustomersTableSkeleton";

export default function Page() {
  return (
    <Suspense fallback={<CustomersTableSkeleton />}>
      <CustomersPageClient />
    </Suspense>
  );
}
