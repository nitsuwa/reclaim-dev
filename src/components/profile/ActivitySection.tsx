import { ActivityLog } from '../../types';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  FileCheck, 
  AlertCircle,
  Clock,
  Info
} from 'lucide-react';

interface ActivitySectionProps {
  activities: ActivityLog[];
}

export const ActivitySection = ({ activities }: ActivitySectionProps) => {
  const getActivityIcon = (action: ActivityLog['action']) => {
    const iconMap = {
      item_reported: Package,
      item_verified: FileCheck,
      item_rejected: XCircle,
      claim_submitted: Clock,
      claim_approved: CheckCircle,
      claim_rejected: XCircle,
      failed_claim_attempt: AlertCircle,
      item_status_changed: Clock
    };
    return iconMap[action] || Package;
  };

  const getActivityColor = (action: ActivityLog['action']) => {
    const colorMap = {
      item_reported: 'text-primary bg-primary/10 border-primary/20',
      item_verified: 'text-accent bg-accent/10 border-accent/20',
      item_rejected: 'text-destructive bg-destructive/10 border-destructive/20',
      claim_submitted: 'text-secondary bg-secondary/10 border-secondary/20',
      claim_approved: 'text-primary bg-primary/10 border-primary/20',
      claim_rejected: 'text-destructive bg-destructive/10 border-destructive/20',
      failed_claim_attempt: 'text-destructive bg-destructive/10 border-destructive/20',
      item_status_changed: 'text-accent bg-accent/10 border-accent/20'
    };
    return colorMap[action] || 'text-muted-foreground bg-muted border-muted';
  };

  const getActivityLabel = (action: ActivityLog['action']) => {
    const labelMap = {
      item_reported: 'Reported',
      item_verified: 'Verified',
      item_rejected: 'Rejected',
      claim_submitted: 'Claim Submitted',
      claim_approved: 'Approved',
      claim_rejected: 'Rejected',
      failed_claim_attempt: 'Failed Attempt',
      item_status_changed: 'Status Changed'
    };
    return labelMap[action] || action;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Card className="p-6 bg-card">
      <div className="space-y-6">
        <div>
          <h3 className="text-primary mb-2">Recent Activity</h3>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>Your latest actions and updates ({activities.length} {activities.length === 1 ? 'activity' : 'activities'})</p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">No recent activity</p>
            <p className="text-sm text-muted-foreground">
              Your actions will appear here as you use the system
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.action);
                const colorClass = getActivityColor(activity.action);
                
                return (
                  <div 
                    key={activity.id} 
                    className="flex gap-3 p-4 rounded-lg bg-background hover:shadow-sm transition-all border border-border"
                  >
                    <div className={`h-12 w-12 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0 border-2`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getActivityLabel(activity.action)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>

                      <p className="text-foreground mb-1">{activity.details}</p>
                      
                      {activity.itemType && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>{activity.itemType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
};