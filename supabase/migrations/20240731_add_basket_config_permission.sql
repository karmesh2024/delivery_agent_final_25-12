-- Add the new permission for managing basket configurations
INSERT INTO public.permissions (name, description, group_id)
VALUES ('product-categories:manage-basket-configs', 'Allow managing basket configurations for product subcategories', 'Product Categories Management')
ON CONFLICT (name) DO NOTHING;

-- Grant this new permission to the super_admin role
-- This assumes the 'super_admin' role exists and its ID can be found.
DO $$
DECLARE
    permission_id_to_add UUID;
    super_admin_role_id UUID;
BEGIN
    -- Get the ID of the newly created permission
    SELECT id INTO permission_id_to_add FROM public.permissions WHERE name = 'product-categories:manage-basket-configs';

    -- Get the ID of the 'super_admin' role
    SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin';

    -- If both exist, grant the permission to the role
    IF permission_id_to_add IS NOT NULL AND super_admin_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (super_admin_role_id, permission_id_to_add)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END $$; 