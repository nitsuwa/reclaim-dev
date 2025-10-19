import { useApp } from '../context/AppContext';
import { UserInfoSection } from './profile/UserInfoSection';
import { ReportedClaimedItems } from './profile/ReportedClaimedItems';
import { ActivitySection } from './profile/ActivitySection';

export const ProfilePage = () => {
  const { currentUser, items, claims, activityLogs, setCurrentPage } = useApp();

  if (!currentUser) return null;

  // Redirect admins - they shouldn't access profile page
  if (currentUser.role === 'admin') {
    setCurrentPage('admin');
    return null;
  }

  // Get user's reported items
  const reportedItems = items.filter(item => item.reportedBy === currentUser.id);
  
  // Get user's claimed items
  const userClaims = claims.filter(claim => claim.claimantId === currentUser.id);
  const claimedItems = userClaims.map(claim => ({
    claim,
    item: items.find(item => item.id === claim.itemId)!
  })).filter(ci => ci.item);

  // Get user's activity logs - filter out admin actions
  const userActivities = activityLogs.filter(log => 
    log.userId === currentUser.id && 
    log.action !== 'item_verified' && 
    log.action !== 'item_rejected' &&
    log.action !== 'claim_approved' &&
    log.action !== 'claim_rejected'
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-primary mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account and track your Lost & Found activity
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
          {/* Left Column - User Profile */}
          <div className="lg:col-span-1">
            {/* User Information Card */}
            <UserInfoSection user={currentUser} />
          </div>

          {/* Right Column - Tabbed Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reported/Claimed Items Section */}
            <ReportedClaimedItems
              reportedItems={reportedItems}
              claimedItems={claimedItems}
            />
            
            {/* Activity Section */}
            <ActivitySection activities={userActivities} />
          </div>
        </div>
      </div>
    </div>
  );
};