import Link from 'next/link';
import { SearchBar } from '@/components/search/SearchBar';
import { LineChart, LogOut } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/(auth)/actions';

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 md:px-8 mx-auto">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg font-bold">
            <LineChart className="h-5 w-5" strokeWidth={3} />
          </div>
          <span className="font-extrabold sm:inline-block text-xl tracking-tight">
            BullQuant
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-4 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <SearchBar />
          </div>

          <nav className="flex items-center space-x-2">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
                  {user.email}
                </span>
                <form action={logout}>
                  <Button variant="ghost" size="icon" title="Logout">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                  Login
                </Link>
                <Link href="/register" className={buttonVariants()}>
                  Registar
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
