import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
}

export function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="glass-card p-4 md:p-5 lg:p-6 hover:shadow-md transition-all hover:scale-105">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-muted rounded-lg">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
        </div>
      </div>
      <div className="text-2xl md:text-3xl font-semibold text-foreground mb-1">
        {value}
      </div>
      <div className="text-sm md:text-base text-muted-foreground font-medium">
        {title}
      </div>
    </div>
  );
}
