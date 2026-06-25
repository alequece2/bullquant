import Link from 'next/link'
import { updatePassword } from '../actions'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { Input } from '@/components/ui/input'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const resolvedParams = await searchParams

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-20 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-3xl font-extrabold tracking-tight text-foreground">
          Nova Password
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Escolhe a tua nova password.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" action={updatePassword}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-foreground mb-2">
              Nova Password
            </label>
            <div className="mt-2">
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="******"
                minLength={6}
              />
            </div>
          </div>

          {resolvedParams.error && (
            <div className="text-sm text-center text-destructive p-3 bg-destructive/10 rounded-md font-medium">
              {resolvedParams.error}
            </div>
          )}

          {resolvedParams.message && (
            <div className="text-sm text-center text-emerald-400 p-3 bg-emerald-400/10 rounded-md font-medium">
              {resolvedParams.message}
            </div>
          )}

          <div>
            <SubmitButton 
              label="Atualizar Password" 
              loadingLabel="A atualizar..." 
              className="w-full text-md h-11 font-bold" 
            />
          </div>
        </form>
      </div>
    </div>
  )
}
