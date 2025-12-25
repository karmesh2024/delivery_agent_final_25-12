'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, Eye, MessageSquare } from 'lucide-react';
import { toast } from '@/lib/toast';

interface PermissionRequest {
  id: string;
  requester_name: string;
  requester_email: string;
  permission_name: string;
  scope_type: string;
  scope_name: string;
  reason: string;
  priority: string;
  status: string;
  requested_at: string;
  expires_at?: string;
  approver_comments?: string;
  approver_name?: string;
  approved_at?: string;
}

interface PermissionRequestsTableProps {
  requests: PermissionRequest[];
  onApprove: (id: string, comments?: string) => void;
  onReject: (id: string, comments: string) => void;
  onViewDetails: (request: PermissionRequest) => void;
}

export default function PermissionRequestsTable({
  requests,
  onApprove,
  onReject,
  onViewDetails
}: PermissionRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState('');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'expired': return 'outline';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجلة';
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return priority;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'موافق عليها';
      case 'pending': return 'في الانتظار';
      case 'rejected': return 'مرفوضة';
      case 'expired': return 'منتهية الصلاحية';
      default: return status;
    }
  };

  const getScopeTypeText = (scopeType: string) => {
    switch (scopeType) {
      case 'province': return 'محافظة';
      case 'region': return 'منطقة';
      case 'city': return 'مدينة';
      case 'warehouse': return 'مخزن';
      case 'global': return 'عام';
      default: return scopeType;
    }
  };

  const handleApprove = () => {
    if (selectedRequest) {
      onApprove(selectedRequest.id, comments);
      setShowApproveDialog(false);
      setComments('');
      setSelectedRequest(null);
    }
  };

  const handleReject = () => {
    if (selectedRequest && comments.trim()) {
      onReject(selectedRequest.id, comments);
      setShowRejectDialog(false);
      setComments('');
      setSelectedRequest(null);
    } else {
      toast.error('يرجى إدخال سبب الرفض');
    }
  };

  const openApproveDialog = (request: PermissionRequest) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const openRejectDialog = (request: PermissionRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-semibold text-lg">{request.requester_name}</h4>
                  <Badge variant={getPriorityColor(request.priority)}>
                    {getPriorityText(request.priority)}
                  </Badge>
                  <Badge variant={getStatusColor(request.status)} className="flex items-center space-x-1">
                    {getStatusIcon(request.status)}
                    <span>{getStatusText(request.status)}</span>
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">الصلاحية المطلوبة</p>
                    <p className="font-medium">{request.permission_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">النطاق</p>
                    <p className="font-medium">
                      {request.scope_name} ({getScopeTypeText(request.scope_type)})
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">تاريخ الطلب</p>
                    <p className="font-medium">
                      {new Date(request.requested_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  {request.expires_at && (
                    <div>
                      <p className="text-muted-foreground">ينتهي في</p>
                      <p className="font-medium">
                        {new Date(request.expires_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-muted-foreground mb-1">السبب</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{request.reason}</p>
                </div>

                {request.approver_comments && (
                  <div>
                    <p className="text-muted-foreground mb-1">تعليقات الموافق</p>
                    <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                      {request.approver_comments}
                    </p>
                  </div>
                )}

                {request.approver_name && request.approved_at && (
                  <div className="text-sm text-muted-foreground">
                    {request.status === 'approved' ? 'وافق عليه' : 'رفضه'} {request.approver_name} في{' '}
                    {new Date(request.approved_at).toLocaleDateString('ar-SA')}
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(request)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  عرض التفاصيل
                </Button>

                {request.status === 'pending' && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openApproveDialog(request)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      موافقة
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openRejectDialog(request)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      رفض
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Dialog الموافقة */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>موافقة على طلب الصلاحية</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من الموافقة على هذا الطلب؟
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">تفاصيل الطلب</h4>
                <p><strong>المطلب:</strong> {selectedRequest.requester_name}</p>
                <p><strong>الصلاحية:</strong> {selectedRequest.permission_name}</p>
                <p><strong>النطاق:</strong> {selectedRequest.scope_name}</p>
                <p><strong>السبب:</strong> {selectedRequest.reason}</p>
              </div>
            )}
            <div>
              <Label htmlFor="approve-comments">تعليقات (اختياري)</Label>
              <Textarea
                id="approve-comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="أضف تعليقات على الموافقة..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleApprove}>
                <CheckCircle className="h-4 w-4 mr-2" />
                موافقة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog الرفض */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض طلب الصلاحية</DialogTitle>
            <DialogDescription>
              يرجى إدخال سبب رفض هذا الطلب
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">تفاصيل الطلب</h4>
                <p><strong>المطلب:</strong> {selectedRequest.requester_name}</p>
                <p><strong>الصلاحية:</strong> {selectedRequest.permission_name}</p>
                <p><strong>النطاق:</strong> {selectedRequest.scope_name}</p>
                <p><strong>السبب:</strong> {selectedRequest.reason}</p>
              </div>
            )}
            <div>
              <Label htmlFor="reject-comments">سبب الرفض *</Label>
              <Textarea
                id="reject-comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="اشرح سبب رفض هذا الطلب..."
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                إلغاء
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                <XCircle className="h-4 w-4 mr-2" />
                رفض
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
