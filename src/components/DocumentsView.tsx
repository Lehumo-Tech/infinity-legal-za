'use client';

import React, { useState, useRef } from 'react';
import { RefreshCw, Upload, FileText, FileCheck, Eye } from 'lucide-react';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { User, DocumentItem } from '@/components/types';
import { CardGridSkeleton } from '@/components/LoadingSkeleton';

export function DocumentsView({ token, documents, onRefresh, user, loading }: {
  token: string | null; documents: DocumentItem[]; onRefresh: () => void; user: User | null; loading?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('contract');
  const [uploadCaseId, setUploadCaseId] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!token || !fileInputRef.current?.files?.[0]) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileInputRef.current.files[0]);
      formData.append('title', uploadTitle);
      formData.append('document_type', uploadType);
      formData.append('case_id', uploadCaseId);
      if (uploadDesc) formData.append('description', uploadDesc);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setShowUpload(false);
        setUploadTitle('');
        setUploadType('contract');
        setUploadCaseId('');
        setUploadDesc('');
        onRefresh();
      }
    } catch (e) {
      console.error('Upload error:', e);
    }
    setUploading(false);
  };

  const workflowColors: Record<string, string> = {
    draft: 'bg-slate-50 text-slate-700 border-slate-100', review: 'bg-amber-50 text-amber-700 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100', signed: 'bg-blue-50 text-blue-700 border-blue-100',
    filed: 'bg-teal-50 text-teal-700 border-teal-100', archived: 'bg-slate-50 text-slate-500 border-slate-100',
  };

  const typeIcons: Record<string, { bg: string; text: string }> = {
    contract: { bg: 'bg-blue-50', text: 'text-blue-600' },
    pleading: { bg: 'bg-purple-50', text: 'text-purple-600' },
    correspondence: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    court_filing: { bg: 'bg-red-50', text: 'text-red-600' },
    affidavit: { bg: 'bg-amber-50', text: 'text-amber-600' },
    opinion: { bg: 'bg-teal-50', text: 'text-teal-600' },
    memo: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
    invoice: { bg: 'bg-orange-50', text: 'text-orange-600' },
    consent_form: { bg: 'bg-pink-50', text: 'text-pink-600' },
    id_document: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    other: { bg: 'bg-slate-50', text: 'text-slate-600' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Documents</h2>
          <p className="text-[13px] text-slate-500">{documents.length} documents</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRefresh} className="border-[#0c1e3c]/20 text-[#0c1e3c] text-[12px] h-8">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] text-[13px] h-8">
                <Upload className="w-3.5 h-3.5 mr-1" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-[#0c1e3c]">Upload Document</DialogTitle>
                <DialogDescription className="text-[12px] text-slate-500">Upload a document to the case management system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-[12px]">Title</Label>
                  <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Document title" className="mt-1 text-[13px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[12px]">Document Type</Label>
                    <Select value={uploadType} onValueChange={setUploadType}>
                      <SelectTrigger className="mt-1 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="pleading">Pleading</SelectItem>
                        <SelectItem value="correspondence">Correspondence</SelectItem>
                        <SelectItem value="court_filing">Court Filing</SelectItem>
                        <SelectItem value="affidavit">Affidavit</SelectItem>
                        <SelectItem value="opinion">Opinion</SelectItem>
                        <SelectItem value="memo">Memo</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="consent_form">Consent Form</SelectItem>
                        <SelectItem value="id_document">ID Document</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[12px]">Case ID</Label>
                    <Input value={uploadCaseId} onChange={e => setUploadCaseId(e.target.value)} placeholder="Enter case ID" className="mt-1 text-[13px]" />
                  </div>
                </div>
                <div>
                  <Label className="text-[12px]">Description (Optional)</Label>
                  <Textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Brief description..." className="mt-1 text-[13px]" rows={2} />
                </div>
                <div>
                  <Label className="text-[12px]">File</Label>
                  <Input type="file" ref={fileInputRef} className="mt-1 text-[12px]" accept=".pdf,.doc,.docx,.txt,.jpg,.png" />
                  <p className="text-[9px] text-slate-400 mt-1">Max 10MB · PDF, DOC, DOCX, TXT, JPG, PNG</p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" className="text-[12px]">Cancel</Button></DialogClose>
                <Button onClick={handleUpload} disabled={uploading || !uploadTitle || !uploadCaseId} className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] text-[13px]">
                  {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> : <Upload className="w-3.5 h-3.5 mr-2" />}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && documents.length === 0 ? (
          <CardGridSkeleton count={6} />
        ) : documents.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-[13px] font-medium text-slate-500">No documents yet</p>
            <p className="text-[12px] text-slate-400 mt-1">Upload your first document to get started</p>
          </div>
        ) : (
          documents.map(doc => {
            const iconStyle = typeIcons[doc.document_type] || typeIcons.other;
            return (
              <Card key={doc.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconStyle.bg}`}>
                      <FileCheck className={`w-4 h-4 ${iconStyle.text}`} />
                    </div>
                    <Badge className={`text-[9px] border ${workflowColors[doc.workflow_status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>{doc.workflow_status}</Badge>
                  </div>
                  <div className="mt-3">
                    <div className="text-[13px] font-medium text-[#0c1e3c]">{doc.title}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{doc.document_type?.replace(/_/g, ' ')} · v{doc.version}</div>
                    {doc.case && <div className="text-[10px] text-slate-500">Case: {doc.case.title}</div>}
                    {doc.prepared_by_user && <div className="text-[10px] text-slate-500">By: {doc.prepared_by_user.full_name}</div>}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400">{new Date(doc.created_at).toLocaleDateString('en-ZA')}</span>
                    {doc.file_name && <Button size="sm" variant="ghost" className="h-6 text-[9px] text-slate-500 hover:text-[#0c1e3c]"><Eye className="w-3 h-3 mr-1" />View</Button>}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
