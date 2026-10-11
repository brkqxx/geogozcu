-- guncelleme15: güvenlik sıkılaştırma (sürüm 45)
-- ban_lookup giriş ekranından oturumsuz çağrılır; e-posta taraması yapılamasın diye
-- sunucu tarafında IP başına 10 dakikada en çok 10 sorgu sınırı.
create table if not exists public.rpc_throttle (
  id bigint generated always as identity primary key,
  ip text not null,
  fn text not null,
  created_at timestamptz not null default now()
);
create index if not exists rpc_throttle_ip_fn_at on public.rpc_throttle (ip, fn, created_at desc);
alter table public.rpc_throttle enable row level security;
revoke all on public.rpc_throttle from anon, authenticated;

create or replace function public.ban_lookup(p_email text)
returns json language plpgsql volatile security definer set search_path = public as $$
declare v_ip text := coalesce(public.req_ip(), 'bilinmiyor'); r json;
begin
  delete from public.rpc_throttle where created_at < now() - interval '1 day';
  if (select count(*) from public.rpc_throttle where ip = v_ip and fn = 'ban_lookup'
      and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'Çok fazla deneme. Birkaç dakika sonra tekrar dene.' using errcode = 'P0001';
  end if;
  insert into public.rpc_throttle (ip, fn) values (v_ip, 'ban_lookup');
  select json_build_object('reason', b.reason, 'expires_at', b.expires_at, 'by', 'hesap') into r
  from public.bans b join auth.users u on u.id = b.user_id
  where lower(u.email) = lower(trim(p_email)) and public.ban_active(b)
  order by b.expires_at desc nulls first limit 1;
  return r;
end; $$;
