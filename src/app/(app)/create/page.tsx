import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateForm } from "@/components/create-form";

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <CreateForm />
    </div>
  );
}
