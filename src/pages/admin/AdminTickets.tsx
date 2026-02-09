import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  CheckCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Ticket {
  id: string;
  type: string;
  message: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  poll_id: string | null;
  comment_id: string | null;
}

const PAGE_SIZE = 20;

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter]);

  async function fetchTickets() {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        // Do not use `select('*')` because some internal columns are not selectable by design.
        .select('id, type, message, status, admin_note, created_at, resolved_at, poll_id, comment_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setTickets(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(ticketId: string) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          admin_note: adminNote || null
        })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(tickets.map(t => 
        t.id === ticketId 
          ? { ...t, status: 'resolved', resolved_at: new Date().toISOString(), admin_note: adminNote }
          : t
      ));
      setSelectedTicket(null);
      setAdminNote('');
      toast.success('Ticket resolved');
    } catch (error) {
      console.error('Error resolving ticket:', error);
      toast.error('Failed to resolve ticket');
    } finally {
      setSaving(false);
    }
  }

  async function handleReopen(ticketId: string) {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: 'open',
          resolved_at: null
        })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(tickets.map(t => 
        t.id === ticketId 
          ? { ...t, status: 'open', resolved_at: null }
          : t
      ));
      toast.success('Ticket reopened');
    } catch (error) {
      console.error('Error reopening ticket:', error);
      toast.error('Failed to reopen ticket');
    }
  }

  const statusColors: Record<string, string> = {
    open: 'bg-neon-orange/20 text-neon-orange border-neon-orange/30',
    resolved: 'bg-neon-green/20 text-neon-green border-neon-green/30',
  };

  const typeLabels: Record<string, string> = {
    report_poll: '🚨 Poll Report',
    report_comment: '💬 Comment Report',
    feedback: '📝 Feedback',
    bug: '🐛 Bug Report',
    other: '📋 Other',
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tickets</h1>
            <p className="text-muted-foreground mt-1">
              Handle reports and support requests
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {totalCount} {statusFilter === 'all' ? 'total' : statusFilter} tickets
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['open', 'resolved', 'all'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter(status);
                setPage(0);
              }}
              className={statusFilter === status ? 'bg-neon-blue text-background' : ''}
            >
              {status === 'open' && <Clock className="w-4 h-4 mr-2" />}
              {status === 'resolved' && <CheckCircle className="w-4 h-4 mr-2" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              {statusFilter === 'open' ? 'No open tickets 🎉' : 'No tickets found'}
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-card border border-border rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg">
                        {typeLabels[ticket.type] || ticket.type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </div>
                    
                    {ticket.message && (
                      <p className="text-foreground bg-muted/30 p-4 rounded-xl">
                        {ticket.message}
                      </p>
                    )}

                    {ticket.admin_note && (
                      <div className="bg-neon-blue/10 border border-neon-blue/20 p-4 rounded-xl">
                        <p className="text-sm text-neon-blue font-medium mb-1">Admin Note:</p>
                        <p className="text-sm">{ticket.admin_note}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Created: {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}</span>
                      {ticket.resolved_at && (
                        <span>Resolved: {format(new Date(ticket.resolved_at), 'MMM d, yyyy h:mm a')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {ticket.status === 'open' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setAdminNote(ticket.admin_note || '');
                        }}
                        className="border-neon-green/30 text-neon-green hover:bg-neon-green/10"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReopen(ticket.id)}
                        className="border-neon-orange/30 text-neon-orange hover:bg-neon-orange/10"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Resolve Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Resolve Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Admin Note (optional)
              </label>
              <Textarea
                placeholder="Add a note about how this was resolved..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="bg-background border-border min-h-[100px]"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedTicket(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedTicket && handleResolve(selectedTicket.id)}
                disabled={saving}
                className="bg-neon-green text-background hover:bg-neon-green/90"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Mark Resolved
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
