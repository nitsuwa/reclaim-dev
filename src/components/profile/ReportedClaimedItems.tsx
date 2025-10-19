import { useState } from 'react';
import { LostItem, Claim } from '../../types';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Search, MapPin, Calendar, Clock, Package, FileText, Info, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface ReportedClaimedItemsProps {
  reportedItems: LostItem[];
  claimedItems: Array<{ claim: Claim; item: LostItem }>;
}

export const ReportedClaimedItems = ({ reportedItems, claimedItems }: ReportedClaimedItemsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { 
        label: 'Pending Verification', 
        className: 'bg-muted text-muted-foreground',
        icon: Clock
      },
      verified: { 
        label: 'Verified', 
        className: 'bg-accent text-accent-foreground',
        icon: FileText
      },
      claimed: { 
        label: 'Claimed', 
        className: 'bg-primary text-primary-foreground',
        icon: Package
      },
      approved: { 
        label: 'Claim Approved', 
        className: 'bg-primary text-primary-foreground',
        icon: FileText
      },
      rejected: { 
        label: 'Rejected', 
        className: 'bg-destructive text-destructive-foreground',
        icon: FileText
      }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const filterItems = (items: LostItem[]) => {
    return items.filter(item => {
      const matchesSearch = 
        item.itemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.otherItemTypeDetails?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filterClaims = (claims: Array<{ claim: Claim; item: LostItem }>) => {
    return claims.filter(({ claim, item }) => {
      const matchesSearch = 
        item.itemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.otherItemTypeDetails?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredReported = filterItems(reportedItems);
  const filteredClaimed = filterClaims(claimedItems);

  return (
    <Card className="p-6 bg-card">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-primary mb-2">My Items & Claims</h3>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>Track items you've reported and claims you've submitted. View-only - no editing allowed.</p>
          </div>
        </div>
          
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by item type or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 pl-10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="claimed">Claimed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs for Reported and Claimed Items */}
        <Tabs defaultValue="reported" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="reported" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Reported Items</span>
              <span className="sm:hidden">Reported</span>
              <Badge variant="secondary" className="ml-1">{filteredReported.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="claimed" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Claimed Items</span>
              <span className="sm:hidden">Claims</span>
              <Badge variant="secondary" className="ml-1">{filteredClaimed.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Reported Items Tab */}
          <TabsContent value="reported">
            {filteredReported.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">No reported items found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter'
                    : 'Items you report will appear here'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filteredReported.map((item) => (
                    <Card key={item.id} className="p-4 bg-background hover:shadow-md transition-all border-l-4 border-l-accent">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Item Image */}
                        <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={item.photoUrl} 
                            alt={item.itemType}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h4 className="text-foreground">
                                {item.itemType}
                                {item.otherItemTypeDetails && ` - ${item.otherItemTypeDetails}`}
                              </h4>
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>{item.dateFound}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span>{item.timeFound}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="h-4 w-4 flex-shrink-0" />
                              <span>{item.securityQuestions.length} security {item.securityQuestions.length === 1 ? 'question' : 'questions'}</span>
                            </div>
                          </div>

                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 italic">
                              "{item.description}"
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Claimed Items Tab */}
          <TabsContent value="claimed">
            {filteredClaimed.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">No claimed items found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter'
                    : 'Items you claim will appear here'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filteredClaimed.map(({ claim, item }) => (
                    <Card key={claim.id} className="p-4 bg-background hover:shadow-md transition-all border-l-4 border-l-primary">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Item Image */}
                        <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={item.photoUrl} 
                            alt={item.itemType}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h4 className="text-foreground">
                                {item.itemType}
                                {item.otherItemTypeDetails && ` - ${item.otherItemTypeDetails}`}
                              </h4>
                            </div>
                            {getStatusBadge(claim.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>{item.dateFound}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="h-4 w-4 flex-shrink-0" />
                              <span>Claim Code: <span className="font-mono text-accent">{claim.claimCode}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span>Submitted: {new Date(claim.submittedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Claim Instructions */}
                          {claim.status === 'approved' && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 text-sm text-primary mt-2">
                              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <p>Your claim has been approved! Visit the Guard Post with your Student ID and claim code to collect your item.</p>
                            </div>
                          )}
                          {claim.status === 'pending' && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground mt-2">
                              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <p>Your claim is being reviewed by the guard. You'll be notified once it's processed.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
