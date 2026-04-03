-- 🔢 دوال مساعدة للعدادات (Counters)

-- زيادة التصويت
create or replace function increment_resource_vote(row_id uuid)
returns void as $$
begin
  update public.zoon_circle_resources
  set votes_count = votes_count + 1
  where id = row_id;
end;
$$ language plpgsql;

-- إنقاص التصويت
create or replace function decrement_resource_vote(row_id uuid)
returns void as $$
begin
  update public.zoon_circle_resources
  set votes_count = greatest(0, votes_count - 1)
  where id = row_id;
end;
$$ language plpgsql;
