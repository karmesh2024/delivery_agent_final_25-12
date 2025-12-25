-- مخطط قاعدة بيانات المحادثات والرسائل
-- تاريخ الإنشاء: 2025-04-14

-- جدول المحادثات
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT, -- عنوان اختياري للمحادثة
  
  -- ربط مع الطلب (اختياري) للسماح بإجراء محادثات متعلقة بطلبات محددة
  delivery_order_id UUID REFERENCES delivery_orders(id),
  
  conversation_type VARCHAR(50) NOT NULL DEFAULT 'standard', -- نوع المحادثة: standard, support, order_related
  last_message TEXT, -- آخر رسالة في المحادثة
  last_message_time TIMESTAMPTZ DEFAULT NOW(), -- وقت آخر رسالة
  is_active BOOLEAN DEFAULT TRUE, -- حالة المحادثة: نشطة أو مؤرشفة
  created_by UUID NOT NULL, -- من أنشأ المحادثة
  created_by_type VARCHAR(20) NOT NULL, -- نوع المنشئ: delivery_boy, customer, admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء الفهارس
CREATE INDEX idx_conversations_delivery_order_id ON conversations(delivery_order_id);
CREATE INDEX idx_conversations_last_message_time ON conversations(last_message_time DESC);

-- جدول مشاركي المحادثات
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- حقول معرّفات المشاركين المختلفين (كل حقل يمكن أن يكون NULL باستثناء الزوج المناسب لنوع المشارك)
  delivery_boy_id UUID REFERENCES delivery_boys(id),
  customer_id UUID REFERENCES customers(id),
  admin_id UUID, -- يمكن ربطه بجدول المشرفين إذا كان موجوداً
  
  -- نوع المشارك
  participant_type VARCHAR(20) NOT NULL CHECK (participant_type IN ('delivery_boy', 'customer', 'admin')),
  is_muted BOOLEAN DEFAULT FALSE, -- هل كتم المشارك الإشعارات؟
  unread_count INTEGER DEFAULT 0, -- عدد الرسائل غير المقروءة
  last_read_time TIMESTAMPTZ, -- آخر وقت قراءة
  is_active BOOLEAN DEFAULT TRUE, -- هل المشارك نشط في المحادثة؟
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- قيد فريد: لا يمكن للمشارك الانضمام للمحادثة نفسها أكثر من مرة
  CONSTRAINT unique_participant_conversation UNIQUE (conversation_id, delivery_boy_id, customer_id, admin_id)
);

-- إنشاء الفهارس
CREATE INDEX idx_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_delivery_boy_id ON conversation_participants(delivery_boy_id);
CREATE INDEX idx_participants_customer_id ON conversation_participants(customer_id);
CREATE INDEX idx_participants_admin_id ON conversation_participants(admin_id);

-- جدول الرسائل
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- حقول المرسل - نفس منطق جدول المشاركين
  sender_delivery_boy_id UUID REFERENCES delivery_boys(id),
  sender_customer_id UUID REFERENCES customers(id),
  sender_admin_id UUID,
  
  -- نوع المرسل
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('delivery_boy', 'customer', 'admin', 'system')),
  content TEXT NOT NULL, -- محتوى الرسالة
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'voice', 'system')),
  is_edited BOOLEAN DEFAULT FALSE, -- هل تم تعديل الرسالة؟
  is_deleted BOOLEAN DEFAULT FALSE, -- هل تم حذف الرسالة؟
  reply_to_id UUID REFERENCES messages(id), -- معرّف الرسالة المرد عليها (اختياري)
  metadata JSONB, -- بيانات إضافية مثل معلومات الملفات أو الصور أو المواقع
  sent_at TIMESTAMPTZ DEFAULT NOW(), -- وقت إرسال الرسالة
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء الفهارس
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_delivery_boy_id ON messages(sender_delivery_boy_id);
CREATE INDEX idx_messages_sender_customer_id ON messages(sender_customer_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);

-- دالة لتحديث آخر رسالة في المحادثة
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = FALSE THEN
    -- تحديث آخر رسالة ووقتها
    UPDATE conversations 
    SET last_message = CASE 
                        WHEN NEW.message_type = 'text' THEN NEW.content
                        WHEN NEW.message_type = 'image' THEN 'صورة'
                        WHEN NEW.message_type = 'voice' THEN 'رسالة صوتية'
                        WHEN NEW.message_type = 'location' THEN 'موقع'
                        WHEN NEW.message_type = 'file' THEN 'ملف'
                        WHEN NEW.message_type = 'system' THEN NEW.content
                        ELSE NEW.content
                       END,
        last_message_time = NEW.sent_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    -- زيادة عداد الرسائل غير المقروءة لجميع المشاركين باستثناء المرسل
    UPDATE conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id
      AND (
        (participant_type = 'delivery_boy' AND delivery_boy_id != NEW.sender_delivery_boy_id) OR
        (participant_type = 'customer' AND customer_id != NEW.sender_customer_id) OR
        (participant_type = 'admin' AND admin_id != NEW.sender_admin_id)
      )
      AND is_active = TRUE;

    -- إضافة سجل في جدول customer_interactions إذا كانت الرسالة من مندوب إلى عميل
    IF NEW.sender_type = 'delivery_boy' AND EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = NEW.conversation_id 
      AND cp.participant_type = 'customer'
    ) THEN
      INSERT INTO customer_interactions (
        order_id,
        customer_id,
        created_by,
        type,
        message,
        is_read
      )
      SELECT 
        c.delivery_order_id,
        cp.customer_id,
        NEW.sender_delivery_boy_id,
        'message'::interaction_type,
        NEW.content,
        FALSE
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE c.id = NEW.conversation_id
      AND cp.participant_type = 'customer'
      AND c.delivery_order_id IS NOT NULL
      LIMIT 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء تريجر لتحديث المحادثة عند إضافة رسالة جديدة
CREATE TRIGGER update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_new_message();

-- دالة لتعليم الرسائل كمقروءة
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_participant_type VARCHAR,
  p_participant_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- تحديث آخر وقت قراءة وإعادة تعيين عداد الرسائل غير المقروءة
  UPDATE conversation_participants
  SET unread_count = 0,
      last_read_time = NOW()
  WHERE conversation_id = p_conversation_id
    AND participant_type = p_participant_type
    AND (
      (p_participant_type = 'delivery_boy' AND delivery_boy_id = p_participant_id) OR
      (p_participant_type = 'customer' AND customer_id = p_participant_id) OR
      (p_participant_type = 'admin' AND admin_id = p_participant_id)
    );
END;
$$ LANGUAGE plpgsql;

-- دالة لإنشاء محادثة جديدة بين مندوب وعميل
CREATE OR REPLACE FUNCTION create_conversation_for_order(
  p_delivery_order_id UUID,
  p_created_by_id UUID,
  p_created_by_type VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_delivery_boy_id UUID;
  v_customer_id UUID;
BEGIN
  -- استرداد معرّفات المندوب والعميل من الطلب
  SELECT 
    delivery_boy_id, 
    customer_id 
  INTO v_delivery_boy_id, v_customer_id
  FROM delivery_orders 
  WHERE id = p_delivery_order_id;

  -- إنشاء محادثة جديدة
  INSERT INTO conversations (
    delivery_order_id,
    conversation_type,
    created_by,
    created_by_type
  ) VALUES (
    p_delivery_order_id,
    'order_related',
    p_created_by_id,
    p_created_by_type
  ) RETURNING id INTO v_conversation_id;

  -- إضافة المندوب كمشارك
  INSERT INTO conversation_participants (
    conversation_id,
    delivery_boy_id,
    participant_type
  ) VALUES (
    v_conversation_id,
    v_delivery_boy_id,
    'delivery_boy'
  );

  -- إضافة العميل كمشارك
  INSERT INTO conversation_participants (
    conversation_id,
    customer_id,
    participant_type
  ) VALUES (
    v_conversation_id,
    v_customer_id,
    'customer'
  );

  -- إضافة رسالة نظام تعلن عن بدء المحادثة
  INSERT INTO messages (
    conversation_id,
    sender_type,
    content,
    message_type
  ) VALUES (
    v_conversation_id,
    'system',
    'تم إنشاء محادثة للطلب #' || p_delivery_order_id,
    'system'
  );

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;