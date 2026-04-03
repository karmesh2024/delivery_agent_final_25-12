import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { 
    Phone, 
    MessageSquare, 
    User, 
    Smartphone, 
    Calendar as CalendarIcon, 
    DollarSign, 
    Package, 
    Clipboard,
    Tag,
    Building2,
    Save,
    X,
    Layers,
    Box
} from "lucide-react";
import { toast } from "react-toastify";
import { marketBidService } from "../services/marketBidService";
import { BidSource, CreateMarketBidDTO } from "../partners/market-bids.types";
import { industrialPartnersService } from "@/domains/waste-management/partners/services/industrialPartnersService";
import { useAppSelector } from "@/store";

interface QuickBidDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    preFilled?: {
        subcategory_id?: number | string;
        product_id?: string;
        industrial_order_id?: string;
        bid_price?: number;
    };
    subcategories: any[];
    products: any[];
    exchangePrices?: any[];
}

export const QuickBidDialog: React.FC<QuickBidDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
    preFilled,
    subcategories = [],
    products = [],
    exchangePrices = [],
}) => {
    const { currentAdmin } = useAppSelector((state) => state.auth);
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<CreateMarketBidDTO>({
        bidder_name: "",
        bid_price: 0,
        currency: "EGP",
        quantity: 0,
        unit: "ton",
        source: "phone",
        status: "active",
        subcategory_id: undefined,
        product_id: undefined,
        industrial_order_id: undefined,
        partner_id: undefined,
        notes: "",
        delivery_date: "",
        expiry_date: "",
        entered_by: currentAdmin?.id || "",
    });

    useEffect(() => {
        if (isOpen) {
            // Load partners
            industrialPartnersService.getPartners().then(setPartners).catch(console.error);
            
            // Set pre-filled values
            if (preFilled) {
                setFormData(prev => ({
                    ...prev,
                    subcategory_id: preFilled.subcategory_id ? Number(preFilled.subcategory_id) : undefined,
                    product_id: preFilled.product_id || undefined,
                    industrial_order_id: preFilled.industrial_order_id || undefined,
                    bid_price: preFilled.bid_price || 0,
                    entered_by: currentAdmin?.id || "",
                }));
            }
        }
    }, [isOpen, preFilled, currentAdmin]);

    const handleSubmit = async () => {
        if (!formData.bidder_name || !formData.bid_price || formData.bid_price <= 0) {
            toast.error("يرجى إدخال اسم العارض وسعر صحيح أكبر من الصفر");
            return;
        }

        if (!formData.subcategory_id) {
            toast.error("يرجى اختيار الفئة الفرعية");
            return;
        }

        setLoading(true);
        try {
            // تنظيف البيانات من القيم الفارغة التي قد تسبب أخطاء UUID في Postgres
            const submissionData = { ...formData };
            
            if (!submissionData.product_id || submissionData.product_id === "") delete submissionData.product_id;
            if (!submissionData.partner_id || submissionData.partner_id === "") delete submissionData.partner_id;
            if (!submissionData.industrial_order_id || submissionData.industrial_order_id === "") delete submissionData.industrial_order_id;
            if (!submissionData.entered_by || submissionData.entered_by === "") delete submissionData.entered_by;
            if (!submissionData.delivery_date) delete submissionData.delivery_date;
            if (!submissionData.expiry_date) delete submissionData.expiry_date;
            if (!submissionData.notes) delete submissionData.notes;

            console.log("Submitting bid data:", submissionData);
            await marketBidService.createBid(submissionData);
            
            toast.success("تم تسجيل العرض بنجاح");
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error("Error creating bid detailed:", error);
            // استخراج رسالة الخطأ بشكل أفضل من كائن Supabase
            const errorMsg = error.message || error.details || (typeof error === 'object' ? JSON.stringify(error) : "خطأ غير معروف");
            toast.error("خطأ أثناء حفظ العرض: " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const sourceIcons = {
        phone: <Phone className="w-4 h-4" />,
        whatsapp: <MessageSquare className="w-4 h-4" />,
        person: <User className="w-4 h-4" />,
        app: <Smartphone className="w-4 h-4" />,
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] bg-white rounded-2xl shadow-2xl border-0 overflow-hidden p-0">
                <DialogHeader className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Tag className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black">تسجيل عرض سعر خارجي</DialogTitle>
                            <DialogDescription className="text-blue-100 font-medium">
                                سجل العروض القادمة عبر الهاتف أو الواتساب لتحديث بورصة الأسعار
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* المادة والمنتج */}
                        <div className="space-y-4 md:col-span-2">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-blue-500" /> الفئة الفرعية
                                    </Label>
                                    <Select 
                                        value={formData.subcategory_id?.toString()} 
                                        onValueChange={(val) => setFormData({...formData, subcategory_id: Number(val)})}
                                    >
                                        <SelectTrigger className="bg-gray-50 border-gray-200 font-medium h-11">
                                            <SelectValue placeholder="اختر الفئة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subcategories.map(sub => (
                                                <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Box className="w-4 h-4 text-blue-500" /> المنتج (اختياري)
                                    </Label>
                                    <Select 
                                        value={formData.product_id} 
                                        onValueChange={(val) => setFormData({...formData, product_id: val})}
                                    >
                                        <SelectTrigger className="bg-gray-50 border-gray-200 font-medium h-11">
                                            <SelectValue placeholder="اختر المنتج" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.filter(p => !formData.subcategory_id || p.subcategory_id === formData.subcategory_id).map(prod => (
                                                <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>
                        </div>

                        {/* بيانات العارض والسعر */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-emerald-500" /> اسم العارض / المصنع
                            </Label>
                            <Input 
                                placeholder="مثال: مصنع الأمل للإلـومنيوم" 
                                value={formData.bidder_name}
                                onChange={(e) => setFormData({...formData, bidder_name: e.target.value})}
                                className="bg-gray-50 border-gray-200 h-11 font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-500" /> السعر المعروض
                            </Label>
                            <div className="relative">
                                <Input 
                                    type="number"
                                    placeholder="0.00" 
                                    value={formData.bid_price || ""}
                                    onChange={(e) => setFormData({...formData, bid_price: Number(e.target.value)})}
                                    className="bg-gray-50 border-gray-200 h-11 pr-12 font-black text-lg text-emerald-700"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">ج.م / طن</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Package className="w-4 h-4 text-orange-500" /> الكمية المطلوبة
                            </Label>
                            <div className="flex gap-2">
                                <Input 
                                    type="number"
                                    placeholder="0.00" 
                                    value={formData.quantity || ""}
                                    onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                                    className="bg-gray-50 border-gray-200 h-11 font-bold"
                                />
                                <Select value={formData.unit} onValueChange={(val) => setFormData({...formData, unit: val})}>
                                    <SelectTrigger className="w-24 bg-gray-50 border-gray-200 h-11 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ton">طن</SelectItem>
                                        <SelectItem value="kg">كجم</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-purple-500" /> مصدر العرض
                            </Label>
                            <Select value={formData.source} onValueChange={(val: BidSource) => setFormData({...formData, source: val})}>
                                <SelectTrigger className="bg-gray-50 border-gray-200 h-11 font-bold">
                                    <div className="flex items-center gap-2">
                                        {formData.source && sourceIcons[formData.source]}
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="phone" className="font-medium">اتصال هاتفي</SelectItem>
                                    <SelectItem value="whatsapp" className="font-medium">واتساب</SelectItem>
                                    <SelectItem value="person" className="font-medium">مقابلة شخصية</SelectItem>
                                    <SelectItem value="app" className="font-medium">تطبيق الجوال</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-blue-500" /> تاريخ التسليم
                            </Label>
                            <Input 
                                type="date"
                                value={formData.delivery_date}
                                onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                                className="bg-gray-50 border-gray-200 h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-500" /> شريك مسجل (اختياري)
                            </Label>
                            <Select 
                                value={formData.partner_id} 
                                onValueChange={(val) => {
                                    const partner = partners.find(p => p.id === val);
                                    setFormData({
                                        ...formData, 
                                        partner_id: val,
                                        bidder_name: partner ? partner.name : formData.bidder_name
                                    });
                                }}
                            >
                                <SelectTrigger className="bg-gray-50 border-gray-200 h-11 font-medium">
                                    <SelectValue placeholder="اختر الشريك" />
                                </SelectTrigger>
                                <SelectContent>
                                    {partners.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Clipboard className="w-4 h-4 text-gray-500" /> ملاحظات إضافية
                            </Label>
                            <Textarea 
                                placeholder="أي تفاصيل خاصة مثل شروط الدفع أو النقل..." 
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                className="bg-gray-50 border-gray-200 min-h-[80px]"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100 flex items-center gap-3 sm:justify-end">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="font-bold text-gray-500"
                    >
                        <X className="w-4 h-4 mr-2" />
                        إلغاء
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 shadow-lg shadow-indigo-100 transition-all rounded-xl h-11"
                    >
                        {loading ? "جاري الحفظ..." : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                حفظ العرض فوراً
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
