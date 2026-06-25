import Link from 'next/link'
import { login } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const resolvedParams = await searchParams

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-20 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-3xl font-extrabold tracking-tight text-foreground">
          Entrar no BullQuant
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Acede ao teu portfólio e análises.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" action={login}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground mb-2">
              Email
            </label>
            <div className="mt-2">
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="nome@email.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-foreground">
                Password
              </label>
            </div>
            <div className="mt-2">
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
          </div>

          {resolvedParams.message && (
            <div className="text-sm text-center text-emerald-400 p-3 bg-emerald-400/10 rounded-md font-medium">
              {resolvedParams.message}
            </div>
          )}

          <div>
            <Button type="submit" className="w-full text-md h-11 font-bold">
              Entrar
            </Button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Não tens conta?{' '}
          <Link href="/register" className="font-semibold leading-6 text-primary hover:text-primary/80">
            Regista-te grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
