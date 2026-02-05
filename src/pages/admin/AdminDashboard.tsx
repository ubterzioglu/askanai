import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { ListChecks, Users, MessageSquare, Ticket, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  totalPolls: number;
  totalResponses: number;
  totalComments: number;
  openTickets: number;
  recentPolls: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPolls: 0,
    totalResponses: 0,
    totalComments: 0,
    openTickets: 0,
    recentPolls: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [pollsRes, responsesRes, commentsRes, ticketsRes, recentPollsRes] = await Promise.all([
        supabase.from('polls').select('id', { count: 'exact', head: true }),
        supabase.from('responses').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('polls').select('id, title, slug, status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalPolls: pollsRes.count || 0,
        totalResponses: responsesRes.count || 0,
        totalComments: commentsRes.count || 0,
        openTickets: ticketsRes.count || 0,
        recentPolls: recentPollsRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    open: 'bg-neon-green/20 text-neon-green',
    closed: 'bg-neon-orange/20 text-neon-orange',
    draft: 'bg-muted text-muted-foreground',
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your ASKANAI platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Polls"
            value={loading ? '...' : stats.totalPolls}
            icon={<ListChecks className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Total Responses"
            value={loading ? '...' : stats.totalResponses}
            icon={<Users className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Comments"
            value={loading ? '...' : stats.totalComments}
            icon={<MessageSquare className="w-6 h-6" />}
            color="yellow"
          />
          <StatCard
            title="Open Tickets"
            value={loading ? '...' : stats.openTickets}
            icon={<Ticket className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {/* Recent Polls */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-neon-blue/10">
              <TrendingUp className="w-5 h-5 text-neon-blue" />
            </div>
            <h2 className="text-xl font-semibold">Recent Polls</h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : stats.recentPolls.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No polls created yet
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentPolls.map((poll) => (
                <a
                  key={poll.id}
                  href={`/p/${poll.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover:text-neon-blue transition-colors">
                      {poll.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(poll.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[poll.status]}`}>
                    {poll.status}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
