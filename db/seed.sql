insert into tenants (name, slug)
values ('Demo Cooperative', 'demo-cooperative')
on conflict (slug) do nothing;

-- Create the first admin through the app register page, then promote them:
-- update user_roles set role = 'admin' where user_id = (select id from users where email = 'you@example.com');
