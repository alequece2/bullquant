"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, CalendarDays, Calculator, Sparkles, LayoutDashboard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';
import { Logo } from '@/components/brand/Logo';
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
    <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col h-full hidden md:flex shrink-0">
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border/60 shrink-0">
        <Logo href="/dashboard" size="md" />
      </div>

      <TooltipProvider delay={200}>
        <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
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
                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {/* Active gold rail */}
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary transition-opacity",
                          isActive ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={2} />
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

      {/* Footer — parent brand */}
      <div className="px-5 py-4 border-t border-sidebar-border/60 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
          <span className="h-1 w-1 rounded-full bg-primary/70" />
          by {BRAND.parent}
        </div>
      </div>
    </aside>
  );
}
