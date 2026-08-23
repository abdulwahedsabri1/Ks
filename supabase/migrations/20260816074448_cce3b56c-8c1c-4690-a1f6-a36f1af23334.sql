INSERT INTO public.user_roles (user_id, role)
VALUES ('e332d70d-6e21-4264-80a7-1e6be50d1835', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;