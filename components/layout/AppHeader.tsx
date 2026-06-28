import { SearchBar } from '@/components/search/SearchBar';
import { UserCircle, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/(auth)/actions';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function AppHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations('header');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        {/* Mobile Menu Button - Optional, just for layout placeholder */}
        <Button variant="ghost" size="icon" className="md:hidden shrink-0">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Global Search Bar */}
        <div className="w-full max-w-xl">
          <SearchBar />
        </div>

        {/* User Actions — empurrados para a margem direita */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {user && (
            <div className="flex items-center gap-2">
              <Link 
                href="/settings" 
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted"
                title={t('settingsTitle')}
              >
                <UserCircle className="h-5 w-5" />
                <span className="hidden md:inline-block">
                  {user.user_metadata?.name || user.email?.split('@')[0]}
                </span>
              </Link>
              <form action={logout}>
                <Button type="submit" variant="ghost" size="icon" title={t('logoutTitle')}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
