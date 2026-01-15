"use server";

import { checkRole } from "@/utils/roles";
import { clerkClient } from "@clerk/nextjs/server";

export async function setRole(formData: FormData): Promise<void> {
    const client = await clerkClient();

    // Check that the user trying to set the Role is an admin
    if (!(await checkRole("admin"))) {
        console.log("Not Authorized");
        return;
    }

    try {
        const res = await client.users.updateUserMetadata(
            formData.get("id") as string,
            {
                publicMetadata: { role: formData.get("role") },
            }
        );

        console.log("Role updated:", res.publicMetadata);
        // burada istersen revalidatePath("/admin") gibi bir şey de yapabilirsin
    } catch (err) {
        console.error("Error updating role:", err);
    }
}

export async function removeRole(formData: FormData): Promise<void> {
    const client = await clerkClient();

    try {
        const res = await client.users.updateUserMetadata(
            formData.get("id") as string,
            {
                publicMetadata: { role: null },
            }
        );

        console.log("Role removed:", res.publicMetadata);
    } catch (err) {
        console.error("Error removing role:", err);
    }
}
