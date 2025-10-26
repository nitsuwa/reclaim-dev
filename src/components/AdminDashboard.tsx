import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { useApp } from '../context/AppContext';
import { CheckCircle2, XCircle, Clock, Package, FileCheck, AlertCircle, CheckSquare, ScrollText, Eye, EyeOff, Copy } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { db } from '../db/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { LostItem, Claim } from '../types';

export const AdminDashboard = () => {
  const { currentUser, items, claims, activityLogs, addActivityLog } = useApp();
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [unblurredPhotos, setUnblurredPhotos] = useState<Set<string>>(new Set());
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [lookupClaim, setLookupClaim] = useState<Claim | null>(null);
  
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
    if (!item) return;

    try {
        if (approve) {
            const itemRef = doc(db, "foundItems", itemId);
            await updateDoc(itemRef, { status: 'verified' });
        } else {
            await deleteDoc(doc(db, "foundItems", itemId));
        }
        
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
        toast.error("Failed to update item status.");
    }

    setShowItemDialog(false);
    setSelectedItem(null);
    setConfirmAction({ show: false, type: null });
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
    if (!claim || !item) return;

    try {
        const claimRef = doc(db, "claims", claimId);
        if (approve) {
            await updateDoc(claimRef, { status: 'approved' });
            const itemRef = doc(db, "foundItems", item.id);
            await updateDoc(itemRef, { status: 'claimed' });
        } else {
            await updateDoc(claimRef, { status: 'rejected' });
        }
        
        addActivityLog({
            userId: currentUser?.id || 'admin',
            userName: currentUser?.fullName || 'Admin',
            action: approve ? 'claim_approved' : 'claim_rejected',
            itemId: item.id,
            itemType: item.itemType,
            details: approve 
              ? `Approved claim for ${item.itemType} (Code: ${claim.claimCode})` 
              : `Rejected claim for ${item.itemType} (Code: ${claim.claimCode})`
        });
        
        toast.success(approve ? 'Claim approved!' : 'Claim rejected');
    } catch (error) {
        toast.error("Failed to update claim status.");
    }
    
    setShowClaimDialog(false);
    setSelectedClaim(null);
    if (lookupClaim && lookupClaim.id === claimId) {
      setLookupClaim(null);
      setClaimCodeInput('');
    }
    setConfirmAction({ show: false, type: null });
  };

  const pendingItems = items.filter(item => item.status === 'pending');
  const verifiedItems = items.filter(item => item.status === 'verified');
  const claimedItems = items.filter(item => item.status === 'claimed');
  const pendingClaims = claims.filter(claim => claim.status === 'pending');

  const renderItemRows = (itemsToRender: LostItem[], includeActions: boolean) => {
    if (itemsToRender.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={includeActions ? 5 : 4} className="text-center h-24">
            No items in this category.
          </TableCell>
        </TableRow>
      );
    }
    return itemsToRender.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.itemType}</TableCell>
        <TableCell>{item.location}</TableCell>
        <TableCell>{new Date(item.reportedAt).toLocaleDateString()}</TableCell>
        <TableCell>{item.reportedBy?.name || 'N/A'}</TableCell>
        {includeActions && (
          <TableCell>
            <Button variant="outline" size="sm" onClick={() => { setSelectedItem(item); setShowItemDialog(true); }}>
              View
            </Button>
          </TableCell>
        )}
      </TableRow>
    ));
  };
  
  const renderClaimRows = (claimsToRender: Claim[]) => {
    if (claimsToRender.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center h-24">
            No claims in this category.
          </TableCell>
        </TableRow>
      );
    }
    return claimsToRender.map(claim => {
      const item = items.find(i => i.id === claim.itemId);
      return (
        <TableRow key={claim.id}>
          <TableCell>{item?.itemType || 'Unknown Item'}</TableCell>
          <TableCell>{new Date(claim.submittedAt).toLocaleDateString()}</TableCell>
          <TableCell>{claim.claimerName}</TableCell>
          <TableCell>
            <Badge variant={claim.status === 'approved' ? 'default' : claim.status === 'rejected' ? 'destructive' : 'secondary'}>
              {claim.status}
            </Badge>
          </TableCell>
          <TableCell>
            <Button variant="outline" size="sm" onClick={() => { setSelectedClaim(claim); setShowClaimDialog(true); }}>
              View
            </Button>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Card className="w-full h-full shadow-lg border-border">
      <CardHeader>
        <CardTitle>Admin Dashboard</CardTitle>
        <CardDescription>Manage found items, claims, and view activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending-items">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending-items">Pending Items <Badge className="ml-2">{pendingItems.length}</Badge></TabsTrigger>
            <TabsTrigger value="pending-claims">Pending Claims <Badge className="ml-2">{pendingClaims.length}</Badge></TabsTrigger>
            <TabsTrigger value="verified-items">Verified Items <Badge className="ml-2">{verifiedItems.length}</Badge></TabsTrigger>
            <TabsTrigger value="claimed-items">Claimed Items <Badge className="ml-2">{claimedItems.length}</Badge></TabsTrigger>
            <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending-items">
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date Reported</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderItemRows(pendingItems, true)}</TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="pending-claims">
            <ScrollArea className="h-96">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Date Submitted</TableHead>
                            <TableHead>Claimer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>{renderClaimRows(pendingClaims)}</TableBody>
                </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="verified-items">
            <ScrollArea className="h-96">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Date Reported</TableHead>
                            <TableHead>Reporter</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>{renderItemRows(verifiedItems, false)}</TableBody>
                </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="claimed-items">
            <ScrollArea className="h-96">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Date Reported</TableHead>
                            <TableHead>Reporter</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>{renderItemRows(claimedItems, false)}</TableBody>
                </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity-log">
             <ScrollArea className="h-96">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activityLogs.map(log => (
                            <TableRow key={log.id}>
                                <TableCell>{log.userName}</TableCell>
                                <TableCell>{log.action}</TableCell>
                                <TableCell>{log.details}</TableCell>
                                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
          </TabsContent>

        </Tabs>

        {/* Item Details Dialog */}
        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
            <DialogContent className="max-w-2xl">
                {selectedItem && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{selectedItem.itemType}</DialogTitle>
                            <DialogDescription>
                                Reported at {selectedItem.location} on {new Date(selectedItem.reportedAt).toLocaleDateString()}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* ... Dialog content ... */}
                        </div>
                        <DialogFooter>
                            <Button onClick={() => confirmVerifyItem(selectedItem.id, false)} variant="destructive">Reject</Button>
                            <Button onClick={() => confirmVerifyItem(selectedItem.id, true)}>Verify</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>

        {/* Claim Details Dialog */}
        <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
            <DialogContent className="max-w-2xl">
                {selectedClaim && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Claim for: {items.find(i => i.id === selectedClaim.itemId)?.itemType}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* ... Dialog content ... */}
                        </div>
                        <DialogFooter>
                           <Button onClick={() => confirmVerifyClaim(selectedClaim.id, false)} variant="destructive">Reject</Button>
                           <Button onClick={() => confirmVerifyClaim(selectedClaim.id, true)}>Approve</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmAction.show} onOpenChange={(show) => setConfirmAction(prev => ({ ...prev, show }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently alter the status of the item or claim.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if(confirmAction.type === 'verify-item' && confirmAction.itemId) handleVerifyItem(confirmAction.itemId, true);
                if(confirmAction.type === 'reject-item' && confirmAction.itemId) handleVerifyItem(confirmAction.itemId, false);
                if(confirmAction.type === 'approve-claim' && confirmAction.claimId) handleVerifyClaim(confirmAction.claimId, true);
                if(confirmAction.type === 'reject-claim' && confirmAction.claimId) handleVerifyClaim(confirmAction.claimId, false);
              }}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
