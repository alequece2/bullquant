-- Copia e cola este código no "SQL Editor" do teu painel do Supabase
-- para garantir que quem se regista entra na base de dados (tabela users).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 1. Inserir na tabela de utilizadores
  insert into public.users (id, email, name, plan, "updatedAt")
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    'FREE',
    now()
  );

  -- 2. Inserir portfólio vazio associado ao novo utilizador
  insert into public.portfolios (id, "userId", name, "updatedAt")
  values (
    gen_random_uuid()::text,
    new.id,
    'O Meu Portfólio',
    now()
  );

  return new;
end;
$$;

-- O trigger dispara quando um registo é feito na auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
