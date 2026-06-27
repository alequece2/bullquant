import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, LineChart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  const t = await getTranslations("portfolio");

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-32 px-4 text-center mt-12">
      <div className="bg-primary/10 text-primary p-3 rounded-2xl mb-8">
        <LineChart className="w-12 h-12" strokeWidth={2.5} />
      </div>
      
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-7xl mb-6 max-w-4xl mx-auto">
        {t('landing.title')}
      </h1>
      
      <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 mb-10 mx-auto">
        {t('landing.description')}
      </p>
      
      <div className="flex gap-4">
        <Link href="/stock/AAPL" className={buttonVariants({ size: "lg", variant: "outline" })}>
          {t('landing.testExample')} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <Link href="/register" className={buttonVariants({ size: "lg" })}>
          {t('landing.createAccount')}
        </Link>
      </div>
    </div>
  );
}
