import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'yellow';
}

const colorMap = {
  blue: 'bg-neon-blue/10 text-neon-blue border-neon-blue/30',
  green: 'bg-neon-green/10 text-neon-green border-neon-green/30',
  orange: 'bg-neon-orange/10 text-neon-orange border-neon-orange/30',
  yellow: 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30',
};

export function StatCard({ title, value, icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <div className={cn(
      "p-6 rounded-2xl border bg-card transition-all hover:scale-[1.02]",
      colorMap[color]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium",
              trend.positive ? "text-neon-green" : "text-neon-orange"
            )}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-background/50">
          {icon}
        </div>
      </div>
    </div>
  );
}
