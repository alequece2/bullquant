import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCategoryCompanies } from "@/lib/finance/screener";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "S&P 500";
  
  // Tabs disponíveis
  const tabs = [
    "S&P 500",
    "Most Trending",
    "Growth",
    "Dividend Growth",
    "Buyback Machines",
    "Artificial Intelligence"
  ];

  // Se a tab não for válida, fallback para a primeira
  const activeTab = tabs.includes(currentTab) ? currentTab : tabs[0];

  // Buscar empresas do backend (Prisma)
  const companies = await getCategoryCompanies(activeTab, 24);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <DashboardClient 
        tabs={tabs} 
        activeTab={activeTab} 
        companies={companies} 
      />
    </div>
  );
}
