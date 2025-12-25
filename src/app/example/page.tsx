"use client";

import { useState } from "react";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { Button } from "@/shared/ui/button";
import { MyDialog, MyDialogClose, MyDialogFooter } from "@/shared/components/MyDialog";
import { Card } from "@/shared/ui/card";

export default function DialogExamplePage() {
  const [simpleDialogOpen, setSimpleDialogOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [hiddenTitleDialogOpen, setHiddenTitleDialogOpen] = useState(false);
  const [fullWidthDialogOpen, setFullWidthDialogOpen] = useState(false);

  return (
    <DashboardLayout title="أمثلة مكون الحوار">
      <div className="space-y-8 p-4">
        <h1 className="text-2xl font-bold">أمثلة استخدام مكون الحوار المخصص</h1>
        <p className="text-gray-500">
          هذه الصفحة تعرض أمثلة مختلفة لاستخدام مكون الحوار المخصص <code>MyDialog</code>،
          الذي يضمن متطلبات الوصول (accessibility) ويقدم واجهة بسيطة للاستخدام.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* مثال للحوار البسيط */}
          <Card className="p-4">
            <h2 className="text-lg font-bold mb-2">حوار بسيط</h2>
            <p className="text-sm mb-4">حوار بسيط مع عنوان ووصف</p>
            <Button onClick={() => setSimpleDialogOpen(true)}>
              فتح الحوار البسيط
            </Button>
            
            <MyDialog
              open={simpleDialogOpen}
              onOpenChange={setSimpleDialogOpen}
              title="حوار بسيط"
              description="هذا مثال بسيط لاستخدام مكون الحوار المخصص"
              maxWidth="md"
            >
              <p>
                هذا محتوى بسيط داخل مربع الحوار. يمكن إضافة أي محتوى هنا مثل النصوص والصور 
                والنماذج وغيرها.
              </p>
              
              <MyDialogFooter>
                <MyDialogClose asChild>
                  <Button variant="outline" className="ml-2">إلغاء</Button>
                </MyDialogClose>
                <Button>موافق</Button>
              </MyDialogFooter>
            </MyDialog>
          </Card>

          {/* مثال للحوار مع عنوان مخفي */}
          <Card className="p-4">
            <h2 className="text-lg font-bold mb-2">حوار مع عنوان مخفي</h2>
            <p className="text-sm mb-4">حوار يحتوي على عنوان مخفي للقارئات</p>
            <Button onClick={() => setHiddenTitleDialogOpen(true)}>
              فتح الحوار بعنوان مخفي
            </Button>
            
            <MyDialog
              open={hiddenTitleDialogOpen}
              onOpenChange={setHiddenTitleDialogOpen}
              title="عنوان مخفي للقارئات"
              description="هذا الوصف سيكون مخفيًا أيضاً"
              maxWidth="lg"
              showTitle={false}
            >
              <div className="text-center py-6">
                <h3 className="text-2xl font-bold mb-4">محتوى مخصص</h3>
                <p className="text-gray-500 mb-4">
                  هذا المحتوى المخصص يظهر بدلاً من العنوان الافتراضي.
                  العنوان الحقيقي موجود لكنه مخفي، وهو متاح لقارئات الشاشة فقط.
                </p>
                <Button className="mx-auto" onClick={() => setHiddenTitleDialogOpen(false)}>إغلاق</Button>
              </div>
            </MyDialog>
          </Card>

          {/* مثال للحوار بعرض كامل */}
          <Card className="p-4">
            <h2 className="text-lg font-bold mb-2">حوار بعرض مخصص</h2>
            <p className="text-sm mb-4">حوار بعرض محدد بالبكسل</p>
            <Button onClick={() => setFullWidthDialogOpen(true)}>
              فتح الحوار العريض
            </Button>
            
            <MyDialog
              open={fullWidthDialogOpen}
              onOpenChange={setFullWidthDialogOpen}
              title="حوار بعرض مخصص"
              description="هذا حوار عرضه 700 بكسل"
              maxWidth="700px"
            >
              <div className="text-center py-6">
                <h3 className="text-xl font-bold mb-2">حوار بعرض مخصص</h3>
                <p className="bg-gray-100 p-4 rounded mb-4">
                  هذا الحوار له عرض مخصص يساوي 700 بكسل.
                  يمكن تحديد العرض بأي وحدة CSS مثل px أو % أو vw.
                </p>
                <Button onClick={() => setFullWidthDialogOpen(false)}>إغلاق</Button>
              </div>
            </MyDialog>
          </Card>

          {/* مثال للحوار المخصص تماماً */}
          <Card className="p-4">
            <h2 className="text-lg font-bold mb-2">حوار مخصص</h2>
            <p className="text-sm mb-4">حوار مع محتوى وتنسيق مخصص</p>
            <Button onClick={() => setCustomDialogOpen(true)}>
              فتح الحوار المخصص
            </Button>
            
            <MyDialog
              open={customDialogOpen}
              onOpenChange={setCustomDialogOpen}
              title="عنوان الحوار المخصص"
              description="وصف إضافي للحوار المخصص"
              className="bg-gradient-to-br from-blue-50 to-indigo-50"
              maxWidth="xl"
            >
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-700">محتوى مخصص</h3>
                  <p>يمكنك إضافة أي محتوى مخصص هنا، مثل نماذج، صور، أزرار، إلخ.</p>
                </div>
                
                <div className="bg-blue-600 text-white p-4 rounded-lg">
                  <h4 className="font-bold mb-2">ميزات إضافية</h4>
                  <ul className="list-disc list-inside">
                    <li>سهولة الاستخدام</li>
                    <li>دعم إمكانية الوصول</li>
                    <li>تخصيص كامل للأنماط</li>
                    <li>توافق مع جميع المتصفحات</li>
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                  <Button variant="outline" onClick={() => setCustomDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button className="bg-blue-600">
                    حفظ التغييرات
                  </Button>
                </div>
              </div>
            </MyDialog>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 