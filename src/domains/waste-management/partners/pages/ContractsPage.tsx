"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppSelector } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  FileText, Plus, Search, Building2, Calendar,
  CheckCircle, XCircle, Clock, TrendingUp,
  Package, Truck, Filter, BarChart3, Box, X, ShieldCheck
} from "lucide-react";
import { toast } from "react-toastify";
import { contractService } from "../services/contractService";
import { operationalCostService } from "../services/operationalCostService";
import { marketBidService } from "../../services/marketBidService";
import { categoryService } from "@/domains/product-categories/api/categoryService";
import {
  PartnerContract,
  CreateContractDTO,
  ContractStatus,
  ContractType,
  IndustrialPartner,
  CategoryOperationalCost,
} from "../types";
import { MarketBid } from "../market-bids.types";
import { industrialPartnersService } from "../services/industrialPartnersService";
import { format } from "date-fns";

// ═══════════════════════════════════════════════
// ثوابت الحالات والأنواع
// ═══════════════════════════════════════════════

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "مسودة", color: "bg-gray-100 text-gray-700 border-gray-200", icon: <Clock size={12} /> },
  active: { label: "نشط", color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle size={12} /> },
  completed: { label: "مكتمل", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <CheckCircle size={12} /> },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700 border-red-200", icon: <XCircle size={12} /> },
  expired: { label: "منتهي", color: "bg-orange-100 text-orange-700 border-orange-200", icon: <Clock size={12} /> },
};

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  one_time: "صفقة واحدة",
  short_term: "قصير المدة",
  long_term: "طويل المدة",
};

// ═══════════════════════════════════════════════
// المكون الرئيسي
// ═══════════════════════════════════════════════

const ContractsPage: React.FC = () => {
  const { currentAdmin } = useAppSelector((state) => state.auth);

  // البيانات
  const [contracts, setContracts] = useState<PartnerContract[]>([]);
  const [partners, setPartners] = useState<IndustrialPartner[]>([]);
  const [activeBids, setActiveBids] = useState<MarketBid[]>([]);
  const [operationalCosts, setOperationalCosts] = useState<CategoryOperationalCost[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // الفلاتر
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // إنشاء عقد
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [bulkContractData, setBulkContractData] = useState({
    partner_id: "",
    contract_type: "one_time" as ContractType,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    notes: "",
    affects_exchange_price: true,
    items: [{ subcategory_id: 0, agreed_price: 0, quantity: 0, operational_cost_override: undefined as number | undefined }]
  });
  const [selectedBidId, setSelectedBidId] = useState<string>("");

  // ═══════════════════════════════════════════════
  // جلب البيانات
  // ═══════════════════════════════════════════════

  const loadData = async () => {
    setLoading(true);
    try {
      const [contractsData, partnersData, bidsData, costsData, subsRes] = await Promise.all([
        contractService.getContracts(),
        industrialPartnersService.getPartners(),
        marketBidService.getBids({ status: "accepted" }),
        operationalCostService.getAllCosts(),
        categoryService.getSubCategories(),
      ]);
      setContracts(contractsData);
      setPartners(partnersData);
      setActiveBids(bidsData);
      setOperationalCosts(costsData);
      setAllSubCategories(subsRes.data || []);
    } catch (error) {
      console.error("خطأ في جلب البيانات:", error);
      toast.error("فشل في تحميل البيانات");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ═══════════════════════════════════════════════
  // تصفية العقود
  // ═══════════════════════════════════════════════

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchSearch = !searchTerm ||
        c.partner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  // إحصائيات سريعة
  const stats = useMemo(() => ({
    total: contracts.length,
    active: contracts.filter(c => c.status === "active").length,
    draft: contracts.filter(c => c.status === "draft").length,
    totalValue: contracts
      .filter(c => c.status === "active")
      .reduce((s, c) => s + (Number(c.agreed_price) * Number(c.quantity)), 0),
  }), [contracts]);

  // ═══════════════════════════════════════════════
  // العمليات
  // ═══════════════════════════════════════════════

  const handleCreateFromBid = (bid: MarketBid) => {
    setBulkContractData({
      partner_id: bid.partner_id || "",
      contract_type: "one_time",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      notes: bid.notes || "",
      affects_exchange_price: true,
      items: [{ 
        subcategory_id: bid.subcategory_id ? Number(bid.subcategory_id) : 0, 
        agreed_price: Number(bid.bid_price), 
        quantity: Number(bid.quantity) || 0,
        operational_cost_override: undefined
      }]
    });
    setSelectedBidId(bid.id);
    setIsCreateOpen(true);
  };

  const handleCreateContract = async () => {
    try {
      const { partner_id, contract_type, start_date, end_date, notes, items } = bulkContractData;

      if (!partner_id || items.some(i => !i.subcategory_id || !i.agreed_price || !i.quantity)) {
        toast.error("يرجى ملء جميع الحقول المطلوبة لجميع المواد");
        return;
      }

      // حفظ كل مادة كعقد مستقل
      const creationPromises = items.map(item => 
        contractService.createContract({
          partner_id,
          contract_type,
          subcategory_id: item.subcategory_id,
          agreed_price: item.agreed_price,
          quantity: item.quantity,
          operational_cost_override: item.operational_cost_override,
          start_date,
          end_date: end_date || undefined,
          notes,
          unit: "ton",
          status: "draft",
          affects_exchange_price: bulkContractData.affects_exchange_price
        })
      );

      await Promise.all(creationPromises);

      // تحديث حالة العرض إلى "تم التعاقد" إذا كان مربوطاً بعرض
      if (selectedBidId) {
        await marketBidService.updateBidStatus(selectedBidId, "contracted");
      }

      toast.success(`تم إنشاء ${items.length} عقود بنجاح`);
      setIsCreateOpen(false);
      resetBulkData();
      loadData();
    } catch (error) {
      console.error("خطأ في إنشاء العقود:", error);
      toast.error("فشل في إنشاء العقود");
    }
  };

  const resetBulkData = () => {
    setBulkContractData({
        partner_id: "",
        contract_type: "one_time",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        notes: "",
        affects_exchange_price: true,
        items: [{ subcategory_id: 0, agreed_price: 0, quantity: 0, operational_cost_override: undefined }]
    });
    setSelectedBidId("");
  };

  const handleActivateContract = async (contract: PartnerContract) => {
    try {
      const adminId = currentAdmin?.id;
      if (!adminId) {
        toast.error("لم يتم العثور على بيانات المسؤول");
        return;
      }

      await contractService.updateContractStatus(
        contract.id,
        "active",
        adminId
      );
      toast.success("تم اعتماد وتفعيل العقد بنجاح");
      loadData();
    } catch (error) {
      console.error("خطأ في تفعيل العقد:", error);
      toast.error("فشل في تفعيل العقد - يرجى مراجعة الصلاحيات");
    }
  };

  const handleCancelContract = async (id: string) => {
    try {
      await contractService.updateContractStatus(id, "cancelled");
      toast.success("تم إلغاء العقد");
      loadData();
    } catch (error) {
      toast.error("فشل في إلغاء العقد");
    }
  };

  // ═══════════════════════════════════════════════
  // العرض
  // ═══════════════════════════════════════════════

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">نظرة عامة على الالتزامات</h2>
        <Button
          onClick={() => {
            resetBulkData();
            setIsCreateOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 gap-2 font-bold shadow-md h-10 px-6 rounded-xl"
        >
          <Plus size={18} />
          عقد توريد جديد
        </Button>
      </div>

      {/* إحصائيات سريعة مختصرة */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">إجمالي العقود</p>
                <p className="text-2xl font-black text-gray-900">{stats.total}</p>
              </div>
              <FileText className="text-purple-400" size={28} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">عقود نشطة</p>
                <p className="text-2xl font-black text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="text-green-400" size={28} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">مسودات</p>
                <p className="text-2xl font-black text-amber-600">{stats.draft}</p>
              </div>
              <Clock className="text-amber-400" size={28} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">قيمة العقود النشطة</p>
                <p className="text-xl font-black text-blue-600">{stats.totalValue.toLocaleString()} ج.م</p>
              </div>
              <BarChart3 className="text-blue-400" size={28} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* العروض المقبولة بانتظار التعاقد */}
      {activeBids.length > 0 && (
        <Card className="border-2 border-purple-200 shadow-md">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b py-4">
            <CardTitle className="text-base font-black text-purple-800 flex items-center gap-2">
              <TrendingUp size={18} />
              عروض مقبولة بانتظار التعاقد ({activeBids.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeBids.map((bid) => (
                <div key={bid.id} className="bg-white border-2 border-purple-100 rounded-xl p-4 hover:border-purple-300 transition-all shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800">{bid.bidder_name}</span>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] font-bold">
                      مقبول
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">السعر:</span>
                      <span className="font-black text-green-600">{Number(bid.bid_price).toLocaleString()} ج.م/طن</span>
                    </div>
                    {bid.quantity && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">الكمية:</span>
                        <span className="font-bold">{bid.quantity} {bid.unit}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 font-bold gap-2"
                    onClick={() => handleCreateFromBid(bid)}
                  >
                    <FileText size={14} />
                    تحويل إلى عقد
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* الفلاتر */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="بحث بالاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 font-medium"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter size={14} className="ml-2" />
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
            <SelectItem value="expired">منتهي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* قائمة العقود */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
        ) : filteredContracts.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium text-lg">لا توجد عقود</p>
              <p className="text-gray-400 text-sm mt-1">ابدأ بتحويل العروض المقبولة أو إنشاء عقد جديد</p>
            </CardContent>
          </Card>
        ) : (
          filteredContracts.map((contract) => {
            const remaining = Number(contract.quantity) - Number(contract.delivered_quantity);
            const progress = Number(contract.quantity) > 0
              ? (Number(contract.delivered_quantity) / Number(contract.quantity)) * 100
              : 0;
            const statusConf = STATUS_CONFIG[contract.status];
            const opsCost = operationalCosts.find(c => c.subcategory_id === contract.subcategory_id);
            const effectiveCost = contract.operational_cost_override ?? opsCost?.total_cost ?? 0;

            return (
              <Card key={contract.id} className="border-2 border-gray-200 hover:border-purple-200 transition-all shadow-sm">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    {/* المعلومات الأساسية */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Building2 className="text-gray-400" size={18} />
                        <div className="flex flex-col">
                            <span className="font-black text-lg text-gray-900 leading-none">
                            {contract.partner?.name || "—"}
                            </span>
                            <span className="text-xs font-bold text-purple-600 mt-1 flex items-center gap-1">
                                <Box size={10} />
                                {allSubCategories.find(s => s.id === contract.subcategory_id)?.name || "مادة غير محددة"}
                            </span>
                        </div>
                        <Badge className={`text-[11px] border font-bold ${statusConf.color} h-fit`}>
                          {statusConf.icon}
                          <span className="mr-1">{statusConf.label}</span>
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {CONTRACT_TYPE_LABELS[contract.contract_type] || contract.contract_type}
                        </Badge>
                        {!contract.affects_exchange_price && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-bold">
                            ⚠️ مستثنى من تسعير البورصة
                          </Badge>
                        )}
                      </div>

                      {/* التفاصيل المالية */}
                      <div className="grid grid-cols-4 gap-4 bg-gray-50 p-3 rounded-lg">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">سعر البيع/طن</span>
                          <span className="text-base font-black text-green-600">
                            {Number(contract.agreed_price).toLocaleString()} ج.م
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">الكمية</span>
                          <span className="text-base font-black text-gray-800">
                            {Number(contract.quantity).toLocaleString()} طن
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">تكلفة تشغيل/طن</span>
                          <span className="text-base font-black text-orange-600">
                            {Number(effectiveCost).toLocaleString()} ج.م
                            {contract.operational_cost_override != null && (
                              <span className="text-[9px] text-orange-400 mr-1">(مخصص)</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">القيمة الإجمالية</span>
                          <span className="text-base font-black text-blue-600">
                            {(Number(contract.agreed_price) * Number(contract.quantity)).toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>

                      {/* شريط التقدم */}
                      {contract.status === "active" && (
                        <div className="flex items-center gap-3">
                          <Truck size={14} className="text-gray-400" />
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-600">
                            {Number(contract.delivered_quantity).toLocaleString()} / {Number(contract.quantity).toLocaleString()} طن
                            <span className="text-gray-400 mr-1">({progress.toFixed(0)}%)</span>
                          </span>
                        </div>
                      )}

                      {/* التواريخ */}
                      <div className="flex items-center gap-4 text-[11px] text-gray-400 font-medium">
                        {contract.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            من: {format(new Date(contract.start_date), "yyyy/MM/dd")}
                          </span>
                        )}
                        {contract.end_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            إلى: {format(new Date(contract.end_date), "yyyy/MM/dd")}
                          </span>
                        )}
                        {contract.notes && (
                          <span className="text-gray-400">📝 {contract.notes}</span>
                        )}
                      </div>
                    </div>

                    {/* الأزرار */}
                    <div className="flex flex-col gap-2 mr-4">
                      {contract.status === "draft" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold gap-1 text-xs"
                            onClick={() => handleActivateContract(contract)}
                          >
                            <CheckCircle size={12} />
                            اعتماد
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 font-bold gap-1 text-xs"
                            onClick={() => handleCancelContract(contract.id)}
                          >
                            <XCircle size={12} />
                            إلغاء
                          </Button>
                        </>
                      )}
                      {contract.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 font-bold gap-1 text-xs"
                          onClick={() => handleCancelContract(contract.id)}
                        >
                          <XCircle size={12} />
                          إلغاء العقد
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* نافذة إنشاء عقد جديد */}
      {/* ═══════════════════════════════════════════════ */}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 py-5 bg-gradient-to-r from-purple-50 to-white border-b">
            <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
              <FileText className="text-purple-600" size={22} />
              إنشاء عقد توريد جديد
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 font-medium">
              ملء بيانات العقد بين الشركة والمصنع/التاجر
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* الشريك ونوع العقد */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
                <div className="space-y-2">
                    <Label className="font-bold text-gray-700">الشريك (المصنع/التاجر) *</Label>
                    <Select
                        value={bulkContractData.partner_id}
                        onValueChange={(v) => setBulkContractData({ ...bulkContractData, partner_id: v })}
                    >
                        <SelectTrigger className="bg-white"><SelectValue placeholder="اختر الشريك" /></SelectTrigger>
                        <SelectContent>
                        {partners.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-gray-700">نوع التعاقد الشامل</Label>
                    <Select
                        value={bulkContractData.contract_type}
                        onValueChange={(v) => setBulkContractData({ ...bulkContractData, contract_type: v as ContractType })}
                    >
                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="one_time">صفقة واحدة</SelectItem>
                            <SelectItem value="short_term">قصير المدة</SelectItem>
                            <SelectItem value="long_term">طويل المدة</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* بنود المواد */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                        <Box size={16} className="text-purple-600" />
                        المواد المتعاقد عليها
                    </h3>
                    {!selectedBidId && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setBulkContractData({
                                ...bulkContractData,
                                items: [...bulkContractData.items, { subcategory_id: 0, agreed_price: 0, quantity: 0, operational_cost_override: undefined }]
                            })}
                            className="h-7 text-[10px] font-black border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                            + إضافة مادة
                        </Button>
                    )}
                </div>

                <div className="space-y-3">
                    {bulkContractData.items.map((item, index) => (
                        <div key={index} className="p-4 border-2 border-purple-50 rounded-xl bg-white relative group animate-in slide-in-from-right-2">
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500">المادة *</Label>
                                    <Select
                                        value={item.subcategory_id.toString()}
                                        onValueChange={(v) => {
                                            const newItems = [...bulkContractData.items];
                                            newItems[index].subcategory_id = parseInt(v);
                                            setBulkContractData({ ...bulkContractData, items: newItems });
                                        }}
                                        disabled={!!selectedBidId}
                                    >
                                        <SelectTrigger className="h-9"><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                                        <SelectContent>
                                            {allSubCategories.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500">سعر البيع/طن *</Label>
                                    <Input
                                        type="number"
                                        value={item.agreed_price || ""}
                                        onChange={(e) => {
                                            const newItems = [...bulkContractData.items];
                                            newItems[index].agreed_price = parseFloat(e.target.value) || 0;
                                            setBulkContractData({ ...bulkContractData, items: newItems });
                                        }}
                                        className="h-9 font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500">الكمية/طن *</Label>
                                    <Input
                                        type="number"
                                        value={item.quantity || ""}
                                        onChange={(e) => {
                                            const newItems = [...bulkContractData.items];
                                            newItems[index].quantity = parseFloat(e.target.value) || 0;
                                            setBulkContractData({ ...bulkContractData, items: newItems });
                                        }}
                                        className="h-9 font-bold"
                                        placeholder="0.000"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 flex justify-between">
                                        تكلفة تشغيل مخصصة 
                                        <span className="text-[9px] text-gray-300 font-normal">(اختياري)</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        value={item.operational_cost_override || ""}
                                        onChange={(e) => {
                                            const newItems = [...bulkContractData.items];
                                            newItems[index].operational_cost_override = e.target.value ? parseFloat(e.target.value) : undefined;
                                            setBulkContractData({ ...bulkContractData, items: newItems });
                                        }}
                                        className="h-9 text-xs"
                                        placeholder="تلقائي"
                                    />
                                </div>
                            </div>

                            {bulkContractData.items.length > 1 && !selectedBidId && (
                                <button 
                                    onClick={() => {
                                        const newItems = bulkContractData.items.filter((_, i) => i !== index);
                                        setBulkContractData({ ...bulkContractData, items: newItems });
                                    }}
                                    className="absolute -left-2 -top-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-red-200"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* تفاصيل المدة والملاحظات */}
            <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-gray-700">تاريخ البداية</Label>
                        <Input
                            type="date"
                            value={bulkContractData.start_date}
                            onChange={(e) => setBulkContractData({ ...bulkContractData, start_date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold text-gray-700">تاريخ النهاية</Label>
                        <Input
                            type="date"
                            value={bulkContractData.end_date}
                            onChange={(e) => setBulkContractData({ ...bulkContractData, end_date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <input 
                        type="checkbox" 
                        id="affects-price"
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        checked={bulkContractData.affects_exchange_price}
                        onChange={(e) => setBulkContractData({ ...bulkContractData, affects_exchange_price: e.target.checked })}
                    />
                    <Label htmlFor="affects-price" className="font-bold text-purple-900 cursor-pointer flex items-center gap-2">
                        <ShieldCheck size={16} className="text-purple-600" />
                        تفعيل حماية السعر (يؤثر هذا العقد على تسعير البورصة)
                    </Label>
                </div>

                <div className="space-y-2">
                    <Label className="font-bold text-gray-700">ملاحظات العقد</Label>
                    <Input
                        value={bulkContractData.notes}
                        onChange={(e) => setBulkContractData({ ...bulkContractData, notes: e.target.value })}
                        placeholder="أي شروط خاصة بالتوريد أو الدفع..."
                    />
                </div>
            </div>
          </div>

          {/* أزرار الحفظ */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="font-bold">إلغاء</Button>
            <Button
              onClick={handleCreateContract}
              className="bg-purple-600 hover:bg-purple-700 font-bold gap-2 min-w-[140px]"
            >
              <FileText size={14} />
              حفظ وتعميم العقود
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsPage;
