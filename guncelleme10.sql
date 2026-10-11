-- =====================================================================
-- GÜNCELLEME 10  —  Gerçek gözlemci adı ayrı (sadece yöneticinin okuduğu) tabloda
-- reports.observer_name artık maskeli ("B---r U---l") tutulur; böylece eski önbellekli
-- istemciler dahil hiçbir sürüm "permission denied" hatası almaz.
-- (Claude tarafından Supabase'e uygulandı; kayıt için duruyor.)
-- =====================================================================
create table if not exists public.report_private (
  report_id uuid primary key references public.reports(id) on delete cascade deferrable initially deferred,
  observer_name text not null
);
alter table public.report_private enable row level security;
drop policy if exists "gercek ad yonetici" on public.report_private;
create policy "gercek ad yonetici" on public.report_private for select to authenticated using (public.is_admin());
revoke all on public.report_private from anon;
grant select on public.report_private to authenticated;

insert into public.report_private (report_id, observer_name)
  select id, observer_name from public.reports on conflict (report_id) do nothing;
update public.reports set observer_name = public.mask_name(observer_name);

create or replace function public.reports_privacy() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.observer_name is distinct from old.observer_name then
    if new.observer_name is distinct from public.mask_name(new.observer_name) or tg_op = 'INSERT' then
      insert into public.report_private (report_id, observer_name) values (new.id, new.observer_name)
        on conflict (report_id) do update set observer_name = excluded.observer_name;
    end if;
    new.observer_name := public.mask_name(new.observer_name);
  end if;
  return new;
end; $$;
revoke execute on function public.reports_privacy() from public, anon, authenticated;
drop trigger if exists reports_zz_privacy on public.reports;
-- "zz": içerik denetimi (reports_moderate) gerçek adı gördükten SONRA maskelensin
create trigger reports_zz_privacy before insert or update of observer_name on public.reports
  for each row execute function public.reports_privacy();

grant select on public.reports to anon, authenticated;

create or replace function public.admin_observer_names() returns table (id uuid, observer_name text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler'; end if;
  return query select p.report_id, p.observer_name from public.report_private p;
end; $$;
revoke execute on function public.admin_observer_names() from public, anon;
grant execute on function public.admin_observer_names() to authenticated;
