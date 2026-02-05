import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Eye, 
  EyeOff, 
  Flag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Comment {
  id: string;
  body: string;
  display_name: string | null;
  status: 'visible' | 'hidden' | 'flagged';
  created_at: string;
  poll_id: string;
  polls?: {
    title: string;
    slug: string;
  };
}

const PAGE_SIZE = 20;

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchComments();
  }, [page, search, statusFilter]);

  async function fetchComments() {
    setLoading(true);
    try {
      let query = supabase
        .from('comments')
        .select(`
          id, body, display_name, status, created_at, poll_id,
          polls!inner(title, slug)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search) {
        query = query.ilike('body', `%${search}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'visible' | 'hidden' | 'flagged');
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setComments(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(commentId: string, newStatus: 'visible' | 'hidden' | 'flagged') {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status: newStatus })
        .eq('id', commentId);

      if (error) throw error;

      setComments(comments.map(c => 
        c.id === commentId ? { ...c, status: newStatus } : c
      ));
      toast.success(`Comment ${newStatus}`);
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  }

  const statusColors: Record<string, string> = {
    visible: 'bg-neon-green/20 text-neon-green border-neon-green/30',
    hidden: 'bg-muted text-muted-foreground border-border',
    flagged: 'bg-neon-orange/20 text-neon-orange border-neon-orange/30',
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Comments</h1>
            <p className="text-muted-foreground mt-1">
              Moderate user comments
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {totalCount} total comments
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search comments..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-12 h-12 bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'visible', 'hidden', 'flagged'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(0);
                }}
                className={statusFilter === status ? 'bg-neon-blue text-background' : ''}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              {search || statusFilter !== 'all' ? 'No comments match your filters' : 'No comments yet'}
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-card border border-border rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        {comment.display_name || 'Anonymous'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[comment.status]}`}>
                        {comment.status}
                      </span>
                    </div>
                    <p className="text-foreground">{comment.body}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}</span>
                      <a
                        href={`/p/${comment.polls?.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-neon-blue transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {comment.polls?.title}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {comment.status !== 'visible' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(comment.id, 'visible')}
                        className="border-neon-green/30 text-neon-green hover:bg-neon-green/10"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Show
                      </Button>
                    )}
                    {comment.status !== 'hidden' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(comment.id, 'hidden')}
                        className="border-border hover:bg-muted"
                      >
                        <EyeOff className="w-4 h-4 mr-1" />
                        Hide
                      </Button>
                    )}
                    {comment.status !== 'flagged' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(comment.id, 'flagged')}
                        className="border-neon-orange/30 text-neon-orange hover:bg-neon-orange/10"
                      >
                        <Flag className="w-4 h-4 mr-1" />
                        Flag
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
    </AdminLayout>
  );
}
