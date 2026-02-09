import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ExternalLink, 
  Trash2, 
  XCircle, 
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Poll {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'open' | 'closed';
  created_at: string;
  visibility_mode: string;
  _count?: {
    responses: number;
  };
}

const PAGE_SIZE = 10;

export default function AdminPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, [page, search]);

  async function fetchPolls() {
    setLoading(true);
    try {
      let query = supabase
        .from('polls')
        .select('id, title, slug, status, created_at, visibility_mode', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search) {
        query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      // Fetch response counts for each poll
      const pollsWithCounts = await Promise.all(
        (data || []).map(async (poll) => {
          const { count } = await supabase
            .from('responses')
            .select('id', { count: 'exact', head: true })
            .eq('poll_id', poll.id);
          return { ...poll, _count: { responses: count || 0 } };
        })
      );

      setPolls(pollsWithCounts);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching polls:', error);
      toast.error('Failed to fetch polls');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(pollId: string, newStatus: 'open' | 'closed') {
    try {
      const { error } = await supabase
        .from('polls')
        .update({ status: newStatus })
        .eq('id', pollId);

      if (error) throw error;

      setPolls(polls.map(p => 
        p.id === pollId ? { ...p, status: newStatus } : p
      ));
      toast.success(`Poll ${newStatus === 'open' ? 'opened' : 'closed'}`);
    } catch (error) {
      console.error('Error updating poll:', error);
      toast.error('Failed to update poll');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    
    setDeleting(true);
    try {
      // Use backend archival delete to keep a snapshot and enforce ownership/admin checks server-side.
      await apiJson(`/api/polls/${deleteId}/delete`, { method: 'DELETE', includeAuth: true });

      setPolls(polls.filter(p => p.id !== deleteId));
      setTotalCount(prev => prev - 1);
      toast.success('Poll deleted');
    } catch (error) {
      console.error('Error deleting poll:', error);
      toast.error('Failed to delete poll');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const statusColors: Record<string, string> = {
    open: 'bg-neon-green/20 text-neon-green border-neon-green/30',
    closed: 'bg-neon-orange/20 text-neon-orange border-neon-orange/30',
    draft: 'bg-muted text-muted-foreground border-border',
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Polls</h1>
            <p className="text-muted-foreground mt-1">
              Manage all polls on the platform
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {totalCount} total polls
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-12 h-12 bg-card border-border"
          />
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {search ? 'No polls match your search' : 'No polls yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Slug</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Responses</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {polls.map((poll) => (
                    <tr key={poll.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-6 py-4">
                        <span className="font-medium line-clamp-1">{poll.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm text-neon-blue bg-neon-blue/10 px-2 py-1 rounded">
                          {poll.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusColors[poll.status]}`}>
                          {poll.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {poll._count?.responses || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {format(new Date(poll.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/p/${poll.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="View poll"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          {poll.status === 'open' ? (
                            <button
                              onClick={() => handleStatusChange(poll.id, 'closed')}
                              className="p-2 rounded-lg hover:bg-neon-orange/10 text-neon-orange transition-colors"
                              title="Close poll"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          ) : poll.status === 'closed' ? (
                            <button
                              onClick={() => handleStatusChange(poll.id, 'open')}
                              className="p-2 rounded-lg hover:bg-neon-green/10 text-neon-green transition-colors"
                              title="Reopen poll"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : null}
                          <button
                            onClick={() => setDeleteId(poll.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                            title="Delete poll"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
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
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the poll and all its responses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
