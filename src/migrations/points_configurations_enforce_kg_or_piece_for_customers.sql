-- =================================================================
-- فرض قاعدة: للمستخدمين إمّا نقاط/كجم أو نقاط/قطعة وليس الاثنين معاً
-- تاريخ: يناير 2026
-- =================================================================
-- الهدف:
--  - منع تكوين إعداد نقاط يعطي للمستخدمين في نفس الوقت:
--      * نقاط لكل كيلوجرام (points_per_kg) تطبق على المستخدمين
--      * ونقاط لكل قطعة (points_per_piece)
--  - مع السماح بالسيناريو التالي:
--      * نقاط/كجم للوكلاء فقط (agents_only)
--      * ونقاط/قطعة للمستخدمين (customers) في نفس الإعداد
-- =================================================================

ALTER TABLE public.points_configurations
ADD CONSTRAINT points_configurations_customers_kg_or_piece_chk
CHECK (
  NOT (
    COALESCE(points_per_piece, 0) > 0
    AND COALESCE(points_per_kg, 0) > 0
    AND (points_per_kg_applies_to IS NULL OR points_per_kg_applies_to IN ('customers_only', 'both'))
  )
);

COMMENT ON CONSTRAINT points_configurations_customers_kg_or_piece_chk ON public.points_configurations IS
'يمنع منح المستخدمين نقاطاً على الكيلو والقطعة معاً لنفس الإعداد؛ للمستخدم إمّا نقاط/كجم أو نقاط/قطعة فقط. يسمح بالجمع بين نقاط/كجم للوكلاء فقط ونقاط/قطعة للمستخدمين.';

