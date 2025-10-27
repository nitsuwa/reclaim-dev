import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { useApp } from '../context/AppContext';
import { CheckCircle2, XCircle, Clock, Package, FileCheck, AlertCircle, CheckSquare, ScrollText, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const AdminDashboard = () => {
  const { currentUser, items, claims, activityLogs, addActivityLog } = useApp();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [unblurredPhotos, setUnblurredPhotos] = useState<Set<string>>(new Set());
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [lookupClaim, setLookupClaim] = useState<any>(null);
  
  // Confirmation dialog states
  const [confirmAction, setConfirmAction] = useState<{
    show: boolean;
    type: 'verify-item' | 'reject-item' | 'approve-claim' | 'reject-claim' | null;
    itemId?: string;
    claimId?: string;
  }>({ show: false, type: null });

  // Clipboard copy helper
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
      return setConfirmAction({ show: false, type: null });
    }

    const newStatus = approve ? 'verified' : 'rejected';
    try {
      const itemRef = doc(db, 'items', itemId);
      await updateDoc(itemRef, { status: newStatus });

      addActivityLog({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.fullName || 'Admin',
        action: approve ? 'item_verified' : 'item_rejected',
        itemId: item.id,
        itemType: item.itemType,
        details: `${approve ? 'Verified' : 'Rejected'} item report for ${item.itemType}`
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

  const handleVerifyClaim = async (claimId: string, approve: boolean) => {
    const claim = claims.find(c => c.id === claimId);
    const item = claim ? items.find(i => i.id === claim.itemId) : null;
    
    if (!claim || !item) {
      toast.error('Could not find claim to update.');
      return setConfirmAction({ show: false, type: null });
    }

    const newClaimStatus = approve ? 'approved' : 'rejected';
    try {
      const claimRef = doc(db, 'claims', claimId);
      await updateDoc(claimRef, { status: newClaimStatus });
      
      if (approve) {
        const itemRef = doc(db, 'items', item.id);
        await updateDoc(itemRef, { status: 'claimed' });
      }

      addActivityLog({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.fullName || 'Admin',
        action: approve ? 'claim_approved' : 'claim_rejected',
        itemId: item.id,
        itemType: item.itemType,
        details: `${approve ? 'Approved' : 'Rejected'} claim for ${item.itemType} (Code: ${claim.claimCode})`
      });

      toast.success(approve ? 'Claim approved!' : 'Claim rejected');
    } catch (error) {
      console.error('Error updating claim:', error);
      toast.error('Failed to update claim status.');
    } finally {
      setShowClaimDialog(false);
      setSelectedClaim(null);
      if (lookupClaim && lookupClaim.id === claimId) {
        setLookupClaim(null);
        setClaimCodeInput('');
      }
      setConfirmAction({ show: false, type: null });
    }
  };

  const pendingItems = items.filter(item => item.status === 'pending');
  const verifiedItems = items.filter(item => item.status === 'verified');
  const claimedItems = items.filter(item => item.status === 'claimed');
  const pendingClaims = claims.filter(claim => claim.status === 'pending');

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'item_reported': 'Item Reported', 'item_verified': 'Item Verified', 'item_rejected': 'Item Rejected',
      'claim_submitted': 'Claim Submitted', 'claim_approved': 'Claim Approved', 'claim_rejected': 'Claim Rejected',
      'failed_claim_attempt': 'Failed Claim Attempt', 'item_status_changed': 'Item Status Changed'
    };
    return labels[action] || action;
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('approved') || action.includes('verified')) return 'default';
    if (action.includes('rejected') || action.includes('failed')) return 'destructive';
    return 'secondary';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md border"><CardHeader className="pb-6 pt-6 px-6"><div className="flex items-center justify-between"><CardDescription>Pending Reports</CardDescription><Package /></div><CardTitle>{pendingItems.length}</CardTitle></CardHeader></Card>
          <Card className="shadow-md border"><CardHeader className="pb-6 pt-6 px-6"><div className="flex items-center justify-between"><CardDescription>Verified Items</CardDescription><FileCheck /></div><CardTitle>{verifiedItems.length}</CardTitle></CardHeader></Card>
          <Card className="shadow-md border"><CardHeader className="pb-6 pt-6 px-6"><div className="flex items-center justify-between"><CardDescription>Pending Claims</CardDescription><AlertCircle /></div><CardTitle>{pendingClaims.length}</CardTitle></CardHeader></Card>
          <Card className="shadow-md border"><CardHeader className="pb-6 pt-6 px-6"><div className="flex items-center justify-between"><CardDescription>Claimed Items</CardDescription><CheckSquare /></div><CardTitle>{claimedItems.length}</CardTitle></CardHeader></Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reports">Item Reports</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="lookup">Claim Lookup</TabsTrigger>
            <TabsTrigger value="logs"><ScrollText className="h-4 w-4 mr-2" />Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <Card className="shadow-sm border">
              <CardHeader><CardTitle>Pending Item Reports</CardTitle><CardDescription>Review and verify found item reports</CardDescription></CardHeader>
              <CardContent>
                {pendingItems.length === 0 ? <p className="text-center py-8">No pending reports</p> : (
                  <ScrollArea className="h-[500px] pr-4"><div className="space-y-4">
                    {pendingItems.map(item => (
                      <div key={item.id} className="border rounded-lg p-4 flex items-start gap-4 cursor-pointer" onClick={() => { setSelectedItem(item.id); setShowItemDialog(true); }}>
                        <img src={item.photoUrl} alt={item.itemType} className="w-24 h-24 object-cover rounded blur-md" />
                        <div className="flex-1 space-y-2">
                          <h4>{item.itemType}</h4>
                          <p>{item.location} on {new Date(item.dateFound).toLocaleDateString()}</p>
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedItem(item.id); setShowItemDialog(true); }}>Review</Button>
                        </div>
                        <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                      </div>
                    ))}
                  </div></ScrollArea>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-sm border">
              <CardHeader><CardTitle>Verified Items</CardTitle><CardDescription>Items currently on the Lost & Found Board</CardDescription></CardHeader>
              <CardContent>
                {verifiedItems.length === 0 ? <p className="text-center py-8">No verified items</p> : (
                  <ScrollArea className="h-[500px] pr-4"><div className="space-y-4">
                    {verifiedItems.map(item => (
                      <div key={item.id} className="border rounded-lg p-4 flex items-start gap-4">
                        <img src={item.photoUrl} alt={item.itemType} className="w-24 h-24 object-cover rounded" />
                        <div className="flex-1"><h4>{item.itemType}</h4><p>{item.location}</p></div>
                        <Badge><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                      </div>
                    ))}
                  </div></ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            <Card className="shadow-sm border">
              <CardHeader><CardTitle>Pending Claims</CardTitle><CardDescription>Review and approve claim requests</CardDescription></CardHeader>
              <CardContent>
                {pendingClaims.length === 0 ? <p className="text-center py-8">No pending claims</p> : (
                  <ScrollArea className="h-[500px] pr-4"><div className="space-y-4">
                    {pendingClaims.map(claim => {
                      const item = items.find(i => i.id === claim.itemId);
                      return (
                        <div key={claim.id} className="border rounded-lg p-4 cursor-pointer" onClick={() => { setSelectedClaim(claim.id); setShowClaimDialog(true); }}>
                          <div className="flex justify-between mb-4">
                            <div><h4>{item?.itemType}</h4><code>{claim.claimCode}</code></div>
                            <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                          </div>
                          <div>{claim.answers.map((ans, i) => <p key={i}>Q{i+1}: {ans}</p>)}</div>
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedClaim(claim.id); setShowClaimDialog(true); }}>Review Claim</Button>
                        </div>
                      );
                    })}
                  </div></ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lookup" className="space-y-4">
            <Card className="shadow-sm border">
              <CardHeader><CardTitle>Claim Code Lookup</CardTitle><CardDescription>Enter a claim code to view and process the claim</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input placeholder="Enter claim code" value={claimCodeInput} onChange={e => setClaimCodeInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleClaimCodeLookup()} />
                  <Button onClick={handleClaimCodeLookup}>Search</Button>
                </div>
                {lookupClaim && (() => {
                  const item = items.find(i => i.id === lookupClaim.itemId);
                  if (!item) return <p>Item not found</p>;
                  return (
                    <div className="border rounded-lg p-6 space-y-6">
                       <h3>Claim Details</h3>
                       <p>Item: {item.itemType}</p>
                       {lookupClaim.status === 'pending' && (
                         <div className="flex gap-2">
                           <Button variant="outline" onClick={() => confirmVerifyClaim(lookupClaim.id, false)}>Reject</Button>
                           <Button onClick={() => confirmVerifyClaim(lookupClaim.id, true)}>Approve</Button>
                         </div>
                       )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card className="shadow-sm border">
              <CardHeader><CardTitle>Activity Logs</CardTitle><CardDescription>Complete history of system activities</CardDescription></CardHeader>
              <CardContent>
                {activityLogs.length === 0 ? <p className="text-center py-8">No activity logs</p> : (
                  <ScrollArea className="h-[600px]"><Table>
                    <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {activityLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{log.userName}</TableCell>
                          <TableCell><Badge variant={getActionBadgeVariant(log.action)}>{getActionLabel(log.action)}</Badge></TableCell>
                          <TableCell>{log.details}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Item Report</DialogTitle><DialogDescription>Verify details and approve/reject.</DialogDescription></DialogHeader>
          {selectedItem && (() => { const item = items.find(i => i.id === selectedItem); return item ? <div> {/* Item Details */} </div> : null; })()}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => confirmVerifyItem(selectedItem!, false)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
            <Button onClick={() => confirmVerifyItem(selectedItem!, true)}><CheckCircle2 className="mr-2 h-4 w-4" />Approve & Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Claim Request</DialogTitle><DialogDescription>Verify answers and approve/reject.</DialogDescription></DialogHeader>
          {selectedClaim && (() => { const claim = claims.find(c => c.id === selectedClaim); const item = claim && items.find(i => i.id === claim.itemId); return claim && item ? <div> {/* Claim Details */} </div> : null; })()}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => confirmVerifyClaim(selectedClaim!, false)}><XCircle className="mr-2 h-4 w-4" />Reject Claim</Button>
            <Button onClick={() => confirmVerifyClaim(selectedClaim!, true)}><CheckCircle2 className="mr-2 h-4 w-4" />Approve & Release</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmAction.show} onOpenChange={(open) => !open && setConfirmAction({ show: false, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirm Action</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription>Are you sure you want to proceed? This action may not be reversible.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (confirmAction.type === 'verify-item') handleVerifyItem(confirmAction.itemId!, true);
              else if (confirmAction.type === 'reject-item') handleVerifyItem(confirmAction.itemId!, false);
              else if (confirmAction.type === 'approve-claim') handleVerifyClaim(confirmAction.claimId!, true);
              else if (confirmAction.type === 'reject-claim') handleVerifyClaim(confirmAction.claimId!, false);
            }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
