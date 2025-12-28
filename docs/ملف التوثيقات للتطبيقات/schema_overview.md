# مخططات علاقات قاعدة البيانات العامة والشاملة

هذا الملف يحتوي على مخططات توضح العلاقات بين الجداول المشتركة والتطبيقات المختلفة، بالإضافة إلى مخطط شامل لكل الجداول.

## مخطط العلاقات بين التطبيقات والجداول المشتركة

```mermaid
erDiagram
    %% Relationships connecting different App areas and Shared tables
    customer_orders }|..|| delivery_orders : "customer_order_id"
    customers }|..|| messages : "sender_customer_id"
    delivery_boys }|..|| messages : "sender_delivery_boy_id"
    conversations ||--o{ messages : "conversation_id"
    customers }|..|| conversation_participants : "customer_id"
    delivery_boys }|..|| conversation_participants : "delivery_boy_id"
    conversations ||--o{ conversation_participants : "conversation_id"
    delivery_orders }|..|| conversations : "delivery_order_id"
    customer_orders }|..|| order_details : "order_id"
    delivery_orders }|..|| order_details : "delivery_order_id"
    delivery_orders }|..|| waste_collection_sessions : "delivery_order_id"
    waste_collection_sessions ||--o{ waste_invoices : "session_id"
    waste_collection_sessions ||--o{ waste_collection_items : "session_id"
    categories ||--o{ waste_collection_items : "category_id"
    waste_data_admin }|..|| waste_collection_items : "waste_data_id" %% Link Admin/Core to Core
    categories ||--o{ subcategories : "category_id"
    categories }|..|| waste_data_admin : "category_id" %% Link Core to Admin/Core
    subcategories }|..|| waste_data_admin : "subcategory_id" %% Link Core to Admin/Core
    delivery_boys }|..|| customer_interactions : "created_by"
    new_profiles }|..|| customer_interactions : "customer_id"
    delivery_orders }|..|| customer_interactions : "order_id"

```

## مخطط العلاقات الشامل

```mermaid
erDiagram
    %% --- Customer Area ---
    new_profiles ||--o{ customer_addresses : "profile_id"
    new_profiles ||--o{ customer_orders : "profile_id"
    new_profiles ||--o{ customer_phones : "profile_id (fk_profile)"
    customers ||--o{ new_profiles : "id (new_profiles_id_fkey)"
    customers ||--o{ customer_addresses : "default_address_id"
    wallets ||--o{ wallet_transactions : "wallet_id"
    payment_qr_codes ||--o{ wallet_transactions : "qr_code_id"
    customer_orders ||--o{ invoice_details : "customer_order_id"
    new_profiles ||--o{ customer_interactions : "customer_id"

    %% --- Delivery Area ---
    delivery_boys ||--o{ delivery_vehicles : "assigned_agent_id"
    delivery_vehicles ||--o{ vehicle_maintenance_log : "vehicle_id"
    delivery_boys ||--o{ delivery_boy_daily_performance : "delivery_boy_id"
    new_profiles_delivery ||--o{ delivery_ratings : "delivery_id"
    new_profiles_delivery ||--o{ delivery_locations : "delivery_id"
    new_profiles_delivery ||--o{ delivery_documents : "delivery_id"
    new_profiles_delivery ||--o{ delivery_earnings : "delivery_id"
    new_profiles_delivery ||--o{ delivery_zones : "delivery_id"
    delivery_orders ||--o{ delivery_status_history : "delivery_order_id"
    delivery_orders ||--o{ order_schedule : "order_id"
    delivery_orders ||--o{ order_tracking : "order_id"
    delivery_boys ||--o{ order_tracking : "delivery_boy_id"

    %% --- Admin Area ---
    admins ||--o{ delegated_permissions : "from_admin_id / to_admin_id"
    permissions ||--o{ delegated_permissions : "permission_id"
    actions ||--o{ permissions : "action_id"
    resources ||--o{ permissions : "resource_id"
    admins ||--o{ admin_invitations : "invited_by"
    roles ||--o{ admin_invitations : "role_id"
    admins ||--o{ permission_audit_log : "changed_by"
    permissions ||--o{ permission_audit_log : "permission_id"
    admins ||--o{ admin_activity_log : "admin_id"
    admins ||--o{ admin_system_settings : "updated_by"
    departments ||--o{ departments : "parent_id"
    departments ||--o{ admins : "department_id"
    admins ||--o{ admins : "manager_id"
    roles ||--o{ admins : "role_id"
    departments ||--o{ admin_groups : "department_id"
    admins ||--o{ admin_group_members : "admin_id"
    admin_groups ||--o{ admin_group_members : "group_id"
    admins ||--o{ data_scopes : "admin_id / created_by"
    admin_groups ||--o{ data_scopes : "group_id"
    resources ||--o{ data_scopes : "resource_id"
    roles ||--o{ data_scopes : "role_id"
    admin_groups ||--o{ group_permissions : "group_id"
    permissions ||--o{ group_permissions : "permission_id"
    permissions ||--o{ role_permissions : "permission_id"
    roles ||--o{ role_permissions : "role_id"
    admins ||--o{ scoped_permissions : "admin_id"
    admin_groups ||--o{ scoped_permissions : "group_id"
    permissions ||--o{ scoped_permissions : "permission_id"
    roles ||--o{ scoped_permissions : "role_id"
    permission_scopes ||--o{ scoped_permissions : "scope_id"
    admins ||--o{ admin_permissions_overrides : "admin_id / granted_by_admin_id"
    permissions ||--o{ admin_permissions_overrides : "permission_id"

    %% --- Shared / Core / Inter-App ---
    customer_orders }|..|| delivery_orders : "customer_order_id"
    customers }|..|| messages : "sender_customer_id"
    delivery_boys }|..|| messages : "sender_delivery_boy_id"
    conversations ||--o{ messages : "conversation_id"
    messages ||--o{ messages : "reply_to_id" %% Self-reference for replies
    customers }|..|| conversation_participants : "customer_id"
    delivery_boys }|..|| conversation_participants : "delivery_boy_id"
    conversations ||--o{ conversation_participants : "conversation_id"
    delivery_orders }|..|| conversations : "delivery_order_id"
    customer_orders }|..|| order_details : "order_id (fk_order_details_customer)"
    delivery_orders }|..|| order_details : "delivery_order_id (fk_order_details_delivery)"
    delivery_orders }|..|| waste_collection_sessions : "delivery_order_id"
    waste_collection_sessions ||--o{ waste_invoices : "session_id"
    waste_collection_sessions ||--o{ waste_collection_items : "session_id"
    categories ||--o{ waste_collection_items : "category_id"
    waste_data_admin }|..|| waste_collection_items : "waste_data_id"
    categories ||--o{ subcategories : "category_id"
    categories }|..|| waste_data_admin : "category_id"
    subcategories }|..|| waste_data_admin : "subcategory_id"
    delivery_boys }|..|| customer_interactions : "created_by"
    delivery_orders }|..|| customer_interactions : "order_id"

``` 