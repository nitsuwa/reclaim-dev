import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { useApp } from '../context/AppContext';
import { CheckCircle2, XCircle, Clock, Package, FileCheck, AlertCircle, CheckSquare, ScrollText, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const AdminDashboard = () => {
  const { currentUser, items, claims, activityLogs, addActivityLog, updateClaim } = useApp();
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
    if (!claimCodeInput.trim()) return toast.error('Please enter a claim code');
    const claim = claims.find(c => c.claimCode === claimCodeInput.trim());
    if (claim) {
      setLookupClaim(claim);
      toast.success('Claim found!');
    } else {
      setLookupClaim(null);
      toast.error('No claim found with this code');
    }
  };

  const confirmVerifyItem = (itemId: string, approve: boolean) => setConfirmAction({ show: true, type: approve ? 'verify-item' : 'reject-item', itemId });

  const handleVerifyItem = async (itemId: string, approve: boolean) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return toast.error('Could not find item to update.');
    const newStatus = approve ? 'verified' : 'rejected';
    try {
      await updateDoc(doc(db, 'items', itemId), { status: newStatus });
      addActivityLog({
        userId: currentUser?.id || 'admin', userName: currentUser?.fullName || 'Admin', action: approve ? 'item_verified' : 'item_rejected',
        itemId: item.id, itemType: item.itemType, details: `${approve ? 'Verified' : 'Rejected'} item report for ${item.itemType}`
      });
      toast.success(approve ? 'Item verified and published!' : 'Item report rejected');
    } catch (e) { toast.error('Failed to update item status.'); } finally {
      setShowItemDialog(false); setSelectedItem(null); setConfirmAction({ show: false, type: null });
    }
  };

  const confirmVerifyClaim = (claimId: string, approve: boolean) => setConfirmAction({ show: true, type: approve ? 'approve-claim' : 'reject-claim', claimId });

  const handleVerifyClaim = async (claimId: string, approve: boolean) => {
    const status = approve ? 'approved' : 'rejected';
    try {
      await updateClaim(claimId, status);
      toast.success(approve ? 'Claim approved!' : 'Claim rejected');
    } catch (e) {
      toast.error('Failed to update claim status.');
    } finally {
      setShowClaimDialog(false);
      setSelectedClaim(null);
      setConfirmAction({ show: false, type: null });
      if (lookupClaim?.id === claimId) {
        setLookupClaim(null);
        setClaimCodeInput('');
      }
    }
  };

  const pendingItems = items.filter(item => item.status === 'pending');
  const verifiedItems = items.filter(item => item.status === 'verified');
  const claimedItems = items.filter(item => item.status === 'claimed');
  const pendingClaims = claims.filter(claim => claim.status === 'pending');

  const getActionLabel = (action: string) => ({ item_reported: 'Item Reported', item_verified: 'Item Verified', item_rejected: 'Item Rejected', claim_submitted: 'Claim Submitted', claim_approved: 'Claim Approved', claim_rejected: 'Claim Rejected', item_claimed: 'Item Claimed' }[action] || action);
  const getActionBadgeVariant = (action: string) => action.includes('approved') || action.includes('verified') || action.includes('claimed') ? 'default' : action.includes('rejected') ? 'destructive' : 'secondary';
  const togglePhotoBlur = (id: string) => setUnblurredPhotos(p => new Set(p.has(id) ? [...p].filter(i => i !== id) : [...p, id]));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground border-b border-primary/10 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"><h1 className="text-primary-foreground">Admin Dashboard</h1><p className="text-sm text-primary-foreground/80">Guard / Admin Panel - {currentUser?.fullName}</p></div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card><CardHeader><CardDescription>Pending Reports</CardDescription><CardTitle>{pendingItems.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Verified Items</CardDescription><CardTitle>{verifiedItems.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Pending Claims</CardDescription><CardTitle>{pendingClaims.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Claimed Items</CardDescription><CardTitle>{claimedItems.length}</CardTitle></CardHeader></Card>
        </div>
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList><TabsTrigger value="reports">Item Reports</TabsTrigger><TabsTrigger value="claims">Claims</TabsTrigger><TabsTrigger value="lookup">Claim Lookup</TabsTrigger><TabsTrigger value="logs">Activity Logs</TabsTrigger></TabsList>
          <TabsContent value="reports" className="space-y-4">
            <Card><CardHeader><CardTitle>Pending Item Reports</CardTitle></CardHeader><CardContent>{pendingItems.length === 0 ? <p className="text-center py-8">No pending reports</p> : <ScrollArea className="h-[500px]"><div className="space-y-4 pr-4">
              {pendingItems.map(item => <div key={item.id} className="border rounded-lg p-4 flex gap-4 cursor-pointer" onClick={() => { setSelectedItem(item.id); setShowItemDialog(true); }}>
                <img src={item.photoUrl} alt={item.itemType} className={`w-24 h-24 object-cover rounded transition-all ${unblurredPhotos.has(item.id) ? '' : 'blur-md'}`} onClick={e => { e.stopPropagation(); togglePhotoBlur(item.id); }} />
                <div className="flex-1"><h4>{item.itemType}</h4><p>{item.location}</p></div>
                <Button size="sm" onClick={e => { e.stopPropagation(); setSelectedItem(item.id); setShowItemDialog(true); }}>Review</Button>
              </div>)}</div></ScrollArea>}</CardContent></Card>
            <Card><CardHeader><CardTitle>Verified Items</CardTitle></CardHeader><CardContent>{verifiedItems.length === 0 ? <p className="text-center py-8">No verified items</p> : <ScrollArea className="h-[500px]"><div className="space-y-4 pr-4">
              {verifiedItems.map(item => <div key={item.id} className="border rounded-lg p-4 flex gap-4"><img src={item.photoUrl} alt={item.itemType} className="w-24 h-24 object-cover rounded" /><div className="flex-1"><h4>{item.itemType}</h4><p>{item.location}</p></div></div>)}
            </div></ScrollArea>}</CardContent></Card>
          </TabsContent>
          <TabsContent value="claims"><Card><CardHeader><CardTitle>Pending Claims</CardTitle></CardHeader><CardContent>{pendingClaims.length === 0 ? <p className="text-center py-8">No pending claims</p> : <ScrollArea className="h-[500px]"><div className="space-y-4 pr-4">
            {pendingClaims.map(claim => { const item = items.find(i => i.id === claim.itemId); return <div key={claim.id} className="border rounded-lg p-4 cursor-pointer" onClick={() => { setSelectedClaim(claim.id); setShowClaimDialog(true); }}>
              <h4>{item?.itemType}</h4><code>{claim.claimCode}</code><p>Claimant: {claim.claimantName}</p>
              <Button size="sm" onClick={e => { e.stopPropagation(); setSelectedClaim(claim.id); setShowClaimDialog(true); }}>Review Claim</Button>
            </div>;})}
          </div></ScrollArea>}</CardContent></Card></TabsContent>
          <TabsContent value="lookup"><Card><CardHeader><CardTitle>Claim Code Lookup</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="flex gap-2"><Input placeholder="Enter claim code" value={claimCodeInput} onChange={e => setClaimCodeInput(e.target.value)} /><Button onClick={handleClaimCodeLookup}>Search</Button></div>
            {lookupClaim && (()=>{ const item = items.find(i => i.id === lookupClaim.itemId); return <div><h4>{item?.itemType}</h4><p>Status: {lookupClaim.status}</p>{lookupClaim.status === 'pending' && <Button onClick={() => { setSelectedClaim(lookupClaim.id); setShowClaimDialog(true); }}>Review</Button>}</div>;})()}
          </CardContent></Card></TabsContent>
          <TabsContent value="logs"><Card><CardHeader><CardTitle>Activity Logs</CardTitle></CardHeader><CardContent>{activityLogs.length === 0 ? <p className="text-center py-8">No activity logs</p> : <ScrollArea className="h-[600px]"><Table><TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead></TableRow></TableHeader><TableBody>
            {activityLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => <TableRow key={log.id}><TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell><TableCell>{log.userName}</TableCell><TableCell><Badge variant={getActionBadgeVariant(log.action)}>{getActionLabel(log.action)}</Badge></TableCell><TableCell>{log.details}</TableCell></TableRow>)}
          </TableBody></Table></ScrollArea>}</CardContent></Card></TabsContent>
        </Tabs>
      </div>
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}><DialogContent><DialogHeader><DialogTitle>Review Item Report</DialogTitle></DialogHeader>
        {selectedItem && (()=>{ const item = items.find(i => i.id === selectedItem); return item ? <div className="space-y-4"><img src={item.photoUrl} className={`w-full h-64 object-cover rounded ${unblurredPhotos.has(item.id) ? '' : 'blur-md'}`} onClick={() => togglePhotoBlur(item.id)} /><p><b>Type:</b> {item.itemType}</p><p><b>Location:</b> {item.location}</p><p><b>Description:</b> {item.description}</p><div><b>Questions:</b>{item.securityQuestions.map((sq, i) => <p key={i}>{i+1}: {sq.question}</p>)}</div></div> : null;})()}
        <DialogFooter><Button variant="outline" onClick={() => confirmVerifyItem(selectedItem!, false)}>Reject</Button><Button onClick={() => confirmVerifyItem(selectedItem!, true)}>Approve & Publish</Button></DialogFooter>
      </DialogContent></Dialog>
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}><DialogContent><DialogHeader><DialogTitle>Review Claim</DialogTitle></DialogHeader>
        {selectedClaim && (()=>{ const claim = claims.find(c => c.id === selectedClaim); const item = claim && items.find(i => i.id === claim.itemId); return claim && item ? <div><p><b>Item:</b> {item.itemType}</p><div><b>Answers:</b>{claim.answers.map((ans, i) => <div key={i}><p><b>Q:</b> {item.securityQuestions[i].question}</p><p><b>A:</b> {ans}</p></div>)}</div></div> : null; })()}
        <DialogFooter><Button variant="outline" onClick={() => confirmVerifyClaim(selectedClaim!, false)}>Reject Claim</Button><Button onClick={() => confirmVerifyClaim(selectedClaim!, true)}>Approve Claim</Button></DialogFooter>
      </DialogContent></Dialog>
      <AlertDialog open={confirmAction.show} onOpenChange={v => !v && setConfirmAction({show:false,type:null})}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Action</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if(confirmAction.type === 'verify-item') handleVerifyItem(confirmAction.itemId!, true); else if(confirmAction.type === 'reject-item') handleVerifyItem(confirmAction.itemId!, false); else if(confirmAction.type === 'approve-claim') handleVerifyClaim(confirmAction.claimId!, true); else if(confirmAction.type === 'reject-claim') handleVerifyClaim(confirmAction.claimId!, false); }}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};