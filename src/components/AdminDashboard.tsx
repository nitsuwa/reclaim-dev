import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { useApp } from '../context/AppContext';
import { CheckCircle2, XCircle, Clock, Package, FileCheck, AlertCircle, CheckSquare, ScrollText, Eye } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const AdminDashboard = () => {
  const { currentUser, items, claims, setClaims, activityLogs, addActivityLog } = useApp();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [unblurredPhotos, setUnblurredPhotos] = useState<Set<string>>(new Set());
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [lookupClaim, setLookupClaim] = useState<any>(null);
  
  const [confirmAction, setConfirmAction] = useState<{
    show: boolean;
    type: 'verify-item' | 'reject-item' | 'approve-claim' | 'reject-claim' | null;
    itemId?: string;
    claimId?: string;
  }>({ show: false, type: null });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Claim code copied!');
    } catch (err) {
      toast.error('Failed to copy. Please copy manually.');
    }
  };

  const handleClaimCodeLookup = () => {
    if (!claimCodeInput.trim()) {
      toast.error('Please enter a claim code');
      return;
    }
    
    const claim = claims.find(c => c.claimCode === claimCodeInput.trim());
    if (claim) {
      setLookupClaim(claim);
      toast.success('Claim found!');
    } else {
      setLookupClaim(null);
      toast.error('No claim found with this code');
    }
  };

  const confirmVerifyItem = (itemId: string, approve: boolean) => {
    setConfirmAction({
      show: true,
      type: approve ? 'verify-item' : 'reject-item',
      itemId
    });
  };

  const handleVerifyItem = async (itemId: string, approve: boolean) => {
    const item = items.find(i => i.id === itemId);
    if (!item) {
      toast.error('Could not find item to update.');
      setConfirmAction({ show: false, type: null });
      return;
    }

    const newStatus = approve ? 'verified' : 'rejected';
    try {
      const itemRef = doc(db, 'items', itemId);
      await updateDoc(itemRef, {
        status: newStatus
      });

      addActivityLog({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.fullName || 'Admin',
        action: approve ? 'item_verified' : 'item_rejected',
        itemId: item.id,
        itemType: item.itemType,
        details: approve
          ? `Verified item report for ${item.itemType}`
          : `Rejected item report for ${item.itemType}`
      });

      toast.success(approve ? 'Item verified and published!' : 'Item report rejected');

    } catch (error) {
        console.error('Error updating item:', error);
        toast.error('Failed to update item status.');
    } finally {
        setShowItemDialog(false);
        setSelectedItem(null);
        setConfirmAction({ show: false, type: null });
    }
  };

  const confirmVerifyClaim = (claimId: string, approve: boolean) => {
    setConfirmAction({
      show: true,
      type: approve ? 'approve-claim' : 'reject-claim',
      claimId
    });
  };

  const handleVerifyClaim = (claimId: string, approve: boolean) => {
    // This function will be updated in a future step.
  };

  const pendingItems = items.filter(item => item.status === 'pending');
  const verifiedItems = items.filter(item => item.status === 'verified');
  const claimedItems = items.filter(item => item.status === 'claimed');
  const pendingClaims = claims.filter(claim => claim.status === 'pending');

  // ... (rest of the component remains the same)

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground border-b border-primary/10 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-primary-foreground">Admin Dashboard</h1>
              <p className="text-sm text-primary-foreground/80">Guard / Admin Panel - {currentUser?.fullName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md border border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-6 pt-6 px-6 border-b-0">
              <div className="flex items-center justify-between">
                <CardDescription className="text-base">Pending Reports</CardDescription>
                <Package className="h-5 w-5 text-accent" />
              </div>
              <CardTitle className="text-accent mt-3">{pendingItems.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-md border border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-6 pt-6 px-6 border-b-0">
              <div className="flex items-center justify-between">
                <CardDescription className="text-base">Verified Items</CardDescription>
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-primary mt-3">{verifiedItems.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-md border border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-6 pt-6 px-6 border-b-0">
              <div className="flex items-center justify-between">
                <CardDescription className="text-base">Pending Claims</CardDescription>
                <AlertCircle className="h-5 w-5 text-accent" />
              </div>
              <CardTitle className="text-accent mt-3">{pendingClaims.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-md border border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-6 pt-6 px-6 border-b-0">
              <div className="flex items-center justify-between">
                <CardDescription className="text-base">Claimed Items</CardDescription>
                <CheckSquare className="h-5 w-5 text-neutral-accent" />
              </div>
              <CardTitle className="text-neutral-accent mt-3">{claimedItems.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reports">Item Reports</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="lookup">Claim Lookup</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle>Pending Item Reports</CardTitle>
                <CardDescription>Review and verify found item reports</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending reports</p>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {pendingItems.map(item => (
                      <div key={item.id} className="border border-border rounded-lg p-4 flex items-start gap-4 hover:border-accent transition-colors cursor-pointer" onClick={() => { setSelectedItem(item.id); setShowItemDialog(true); }}>
                        <img src={item.photoUrl} alt={item.itemType} className="w-24 h-24 object-cover rounded blur-md" />
                        <div className="flex-1 space-y-2">
                          <div>
                            <h4 className="text-primary">{item.itemType}{item.otherItemTypeDetails && ` - ${item.otherItemTypeDetails}`}</h4>
                            <p className="text-sm text-muted-foreground">Found at {item.location} on {new Date(item.dateFound).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-accent text-white hover:bg-accent/90" onClick={(e) => { e.stopPropagation(); setSelectedItem(item.id); setShowItemDialog(true); }}>Review</Button>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-secondary text-white"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                      </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle>Verified Items</CardTitle>
                <CardDescription>Items currently on the Lost & Found Board</CardDescription>
              </CardHeader>
              <CardContent>
                {verifiedItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No verified items</p>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {verifiedItems.map(item => (
                      <div key={item.id} className="border border-border rounded-lg p-4 flex items-start gap-4">
                        <img src={item.photoUrl} alt={item.itemType} className="w-24 h-24 object-cover rounded" />
                        <div className="flex-1">
                          <h4 className="text-primary">{item.itemType}{item.otherItemTypeDetails && ` - ${item.otherItemTypeDetails}`}</h4>
                          <p className="text-sm text-muted-foreground">{item.location} - {new Date(item.dateFound).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="default" className="bg-accent text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                      </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4"> {/* ... Claims content ... */} </TabsContent>
          <TabsContent value="lookup" className="space-y-4"> {/* ... Lookup content ... */} </TabsContent>
          <TabsContent value="logs" className="space-y-4"> {/* ... Logs content ... */} </TabsContent>

        </Tabs>
      </div>

      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Item Report</DialogTitle>
            <DialogDescription>Verify the item details and approve or reject the report</DialogDescription>
          </DialogHeader>
          {selectedItem && (() => {
            const item = items.find(i => i.id === selectedItem);
            return item ? (
              <div className="space-y-4">
                <img src={item.photoUrl} alt={item.itemType} className="w-full h-64 object-cover rounded-lg" />
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Item Type</p>
                      <p className="text-primary">{item.itemType}{item.otherItemTypeDetails && ` - ${item.otherItemTypeDetails}`}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Location</p>
                      <p>{item.location}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date Found</p>
                      <p>{new Date(item.dateFound).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Time Found</p>
                      <p>{item.timeFound}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Security Questions</p>
                    <div className="space-y-2">
                      {item.securityQuestions.map((sq, idx) => (
                        <div key={idx} className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm"><span className="text-primary">Q{idx + 1}:</span> {sq.question}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => confirmVerifyItem(selectedItem!, false)} className="hover:bg-destructive hover:text-white"><XCircle className="h-4 w-4 mr-2" />Reject</Button>
            <Button onClick={() => confirmVerifyItem(selectedItem!, true)} className="bg-accent text-white hover:bg-accent/90"><CheckCircle2 className="h-4 w-4 mr-2" />Approve & Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmAction.show} onOpenChange={(open) => !open && setConfirmAction({ show: false, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.type === 'verify-item' && 'Verify Item Report'}
              {confirmAction.type === 'reject-item' && 'Reject Item Report'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.type === 'verify-item' && 'Are you sure you want to verify this item? It will be published to the Lost & Found Board and become visible to all users.'}
              {confirmAction.type === 'reject-item' && 'Are you sure you want to reject this item report? This action cannot be undone and the item will be permanently removed from the system.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmAction.type === 'verify-item' && confirmAction.itemId) {
                  await handleVerifyItem(confirmAction.itemId, true);
                } else if (confirmAction.type === 'reject-item' && confirmAction.itemId) {
                  await handleVerifyItem(confirmAction.itemId, false);
                }
              }}
              className={confirmAction.type === 'verify-item' ? 'bg-accent hover:bg-accent/90' : 'bg-destructive hover:bg-destructive/90'}
            >
              {confirmAction.type === 'verify-item' ? 'Verify & Publish' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};