'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPartners, createPartner } from '../store/industrialPartnersSlice';
import { IndustrialPartner, PartnerType } from '../types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { Plus, Search, Filter, Factory, Truck, Briefcase } from 'lucide-react';
import { toast } from 'react-toastify';

const IndustrialPartnersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { partners, loading } = useAppSelector((state) => state.industrialPartners);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<PartnerType | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form State
  const [newPartner, setNewPartner] = useState({
    name: '',
    type: 'factory' as PartnerType,
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    credit_limit: 0
  });

  useEffect(() => {
    dispatch(fetchPartners());
  }, [dispatch]);

  const handleCreatePartner = async () => {
    try {
      await dispatch(createPartner({
        ...newPartner,
        current_balance: 0
      })).unwrap();
      toast.success('تم إضافة الشريك بنجاح');
      setIsAddDialogOpen(false);
      setNewPartner({ name: '', type: 'factory', contact_person: '', phone: '', email: '', address: '', credit_limit: 0 });
    } catch (error) {
      toast.error('فشل في إضافة الشريك');
    }
  };

  const filteredPartners = partners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: PartnerType) => {
    switch (type) {
      case 'factory': return <Factory className="text-blue-600" size={18} />;
      case 'crusher': return <Truck className="text-orange-600" size={18} />;
      case 'merchant': return <Briefcase className="text-green-600" size={18} />;
      default: return null;
    }
  };

  const getTypeName = (type: PartnerType) => {
    switch (type) {
        case 'factory': return 'مصنع';
        case 'crusher': return 'كسارة';
        case 'merchant': return 'تاجر';
        case 'other': return 'آخر';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الشركاء الصناعيين</h1>
          <p className="text-gray-500">إدارة المصانع، الكسارات، والتجار (المشترين)</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة شريك جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة شريك صناعي جديد</DialogTitle>
              <DialogDescription>أدخل بيانات المصنع أو التاجر الجديد</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">الاسم</Label>
                <Input id="name" value={newPartner.name} onChange={e => setNewPartner({...newPartner, name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">النوع</Label>
                <div className="col-span-3">
                    <Select value={newPartner.type} onValueChange={(val: PartnerType) => setNewPartner({...newPartner, type: val})}>
                    <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="factory">مصنع</SelectItem>
                        <SelectItem value="crusher">كسارة</SelectItem>
                        <SelectItem value="merchant">تاجر</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact" className="text-right">مسؤول التواصل</Label>
                <Input id="contact" value={newPartner.contact_person} onChange={e => setNewPartner({...newPartner, contact_person: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">الهاتف</Label>
                <Input id="phone" value={newPartner.phone} onChange={e => setNewPartner({...newPartner, phone: e.target.value})} className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="limit" className="text-right">الحد الائتماني</Label>
                <Input id="limit" type="number" value={newPartner.credit_limit} onChange={e => setNewPartner({...newPartner, credit_limit: Number(e.target.value)})} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreatePartner}>حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-blue-700">عدد المصانع</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-blue-800">{partners.filter(p => p.type === 'factory').length}</div>
            </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-orange-700">عدد الكسارات</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-orange-800">{partners.filter(p => p.type === 'crusher').length}</div>
            </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-green-700">عدد التجار</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-green-800">{partners.filter(p => p.type === 'merchant').length}</div>
            </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-white border-b pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
               <Briefcase className="w-5 h-5 text-primary"/>
               قائمة الشركاء
            </CardTitle>
            <div className="flex gap-2">
               <div className="relative">
                 <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                 <Input 
                   placeholder="بحث عن شريك..." 
                   className="pr-8 w-64 bg-gray-50 border-gray-200 focus:bg-white transition-colors" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
               </div>
               <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
                  <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
                    <Filter className="ml-2 h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="تصفية حسب النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="factory">مصانع</SelectItem>
                    <SelectItem value="crusher">كسارات</SelectItem>
                    <SelectItem value="merchant">تجار</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-right font-bold text-gray-600 w-[200px]">الاسم</TableHead>
                <TableHead className="text-center font-bold text-gray-600">النوع</TableHead>
                <TableHead className="text-center font-bold text-gray-600">المسؤول</TableHead>
                <TableHead className="text-center font-bold text-gray-600">الهاتف</TableHead>
                <TableHead className="text-center font-bold text-gray-600">الرصيد الحالي</TableHead>
                <TableHead className="text-center font-bold text-gray-600">الحد الائتماني</TableHead>
                <TableHead className="text-center font-bold text-gray-600">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Briefcase className="w-8 h-8 opacity-20" />
                          <p>لا يوجد شركاء مسجلين</p>
                        </div>
                      </TableCell>
                  </TableRow>
              ): filteredPartners.map((partner) => (
                <TableRow key={partner.id} className="hover:bg-blue-50/30 transition-colors border-b last:border-0">
                  <TableCell className="font-semibold text-gray-800 pr-4">{partner.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
                            partner.type === 'factory' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            partner.type === 'crusher' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            'bg-green-50 text-green-700 border-green-100'
                        }`}>
                            {getTypeIcon(partner.type)}
                            <span>{getTypeName(partner.type)}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-gray-600">{partner.contact_person || '-'}</TableCell>
                  <TableCell className="text-center text-gray-600 font-mono text-sm">{partner.phone || '-'}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-gray-700 text-base">{partner.current_balance.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 mr-1">ج.م</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium text-gray-600">{partner.credit_limit.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 mr-1">ج.م</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="hover:bg-blue-50 text-blue-600">تعديل</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndustrialPartnersPage;


