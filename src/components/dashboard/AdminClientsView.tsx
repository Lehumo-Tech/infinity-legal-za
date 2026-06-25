'use client';

import React from 'react';
import {
  Users, Search, Phone, Mail, Building, ChevronRight, Crown,
  ShieldCheck, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface ClientRecord {
  id: string;
  full_name: string | null;
  email: string;
  phone?: string | null;
  role: string;
  subscription_status?: string;
  plan_name?: string;
  contract_number?: string;
  created_at?: string;
}

interface AdminClientsViewProps {
  token: string | null;
}

export function AdminClientsView({ token }: AdminClientsViewProps) {
  const [clients, setClients] = React.useState<ClientRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    loadClients();
  }, [token]);

  const loadClients = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/staff?role=client&perPage=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setClients(data.data?.data || data.data || []);
      }
    } catch (e) {
      console.error('Clients load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter(c =>
    !search || (c.full_name?.toLowerCase().includes(search.toLowerCase())) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Clients</h2>
          <p className="text-[13px] text-slate-500">{clients.length} total clients</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search clients..."
            className="pl-9 w-64 h-8 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-premium">
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No clients found</h3>
            <p className="text-sm text-slate-400 mt-1">{search ? 'Try a different search term' : 'Clients will appear here once they sign up'}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map(client => (
            <div key={client.id} className="card-premium p-4 hover:cursor-pointer">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarFallback className="bg-[#c9a84c] text-[#0c1e3c] text-xs font-bold">
                    {client.full_name?.split(' ').map(n => n[0]).join('') || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#0c1e3c] truncate">{client.full_name || 'Unnamed Client'}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] text-slate-500 truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="text-[11px] text-slate-500">{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <Badge className={`text-[9px] ${
                  client.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  client.subscription_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {client.subscription_status || 'No Plan'}
                </Badge>
                {client.plan_name && (
                  <span className="text-[10px] text-slate-400">{client.plan_name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
