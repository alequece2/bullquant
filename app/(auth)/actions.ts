"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Função auxiliar para traduzir erros do Supabase para Português
function translateError(error: any): string {
  const msg = error.message?.toLowerCase() || '';
  if (msg.includes('invalid login credentials')) return 'Email ou password incorretos.';
  if (msg.includes('user already registered')) return 'Este email já se encontra registado.';
  if (msg.includes('password should be at least')) return 'A password deve ter pelo menos 6 caracteres.';
  if (msg.includes('rate limit')) return 'Muitas tentativas. Por favor, aguarda um pouco e tenta novamente.';
  if (msg.includes('email link is invalid or has expired')) return 'O link expirou ou é inválido. Pede um novo link.';
  return 'Ocorreu um erro inesperado. Tenta novamente.';
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)
  if (error) {
    redirect(`/login?error=${encodeURIComponent(translateError(error))}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: { data: { name: formData.get('name') as string } }
  }

  const { error } = await supabase.auth.signUp(data)
  if (error) {
    redirect(`/register?error=${encodeURIComponent(translateError(error))}`)
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Conta criada com sucesso! Podes fazer login agora.')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(translateError(error))}`)
  }
  redirect('/forgot-password?message=Verifica o teu email para redefinir a password.')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(translateError(error))}`)
  }
  redirect('/login?message=Password atualizada com sucesso! Faz login.')
}
