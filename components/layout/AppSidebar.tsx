"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LineChart, Briefcase, CalendarDays, Calculator, Sparkles, LayoutDashboard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('sidebar');

  const links = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), desc: t('desc.dashboard') },
    { href: '/portfolio', icon: Briefcase, label: t('portfolio'), desc: t('desc.portfolio') },
    { href: '/calendar', icon: CalendarDays, label: t('calendar'), desc: t('desc.calendar') },
    { href: '/dcf', icon: Calculator, label: t('dcf'), desc: t('desc.dcf') },
    { href: '/ai-insights', icon: Sparkles, label: t('aiInsights'), desc: t('desc.aiInsights') },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-full hidden md:flex shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-border/40 shrink-0">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg font-bold">
            <LineChart className="h-5 w-5" strokeWidth={3} />
          </div>
          <span className="font-extrabold sm:inline-block text-xl tracking-tight">
            BullQuant
          </span>
        </Link>
      </div>

      <TooltipProvider delay={200}>
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Tooltip key={link.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  }
                />
                <TooltipContent side="right" className="max-w-[220px]">
                  {link.desc}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>
    </aside>
  );
}
