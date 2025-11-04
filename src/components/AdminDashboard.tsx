import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { useApp } from '../context/AppContext';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { toast } from 'sonner';
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
    const claim = claims.find(c => c.id === claimId);
    const item = claim && items.find(i => i.id === claim.itemId);

    if (!claim || !item) {
      toast.error("Claim or associated item not found.");
      return;
    }

    try {
      await updateClaim(claimId, status);

      addActivityLog({
        userId: currentUser!.id,
        userName: currentUser!.fullName,
        action: status === 'approved' ? 'claim_approved' : 'claim_rejected',
        itemId: item.id,
        itemType: item.itemType,
        details: `${status === 'approved' ? 'Approved' : 'Rejected'} claim from ${claim.claimantName} for ${item.itemType}`,
      });

      addActivityLog({
        userId: claim.claimantId,
        userName: claim.claimantName,
        action: status === 'approved' ? 'claim_approved' : 'claim_rejected',
        itemId: item.id,
        itemType: item.itemType,
        details: `Your claim for ${item.itemType} has been ${status}. ${status === 'approved' ? `Your claim code is ${claim.claimCode}.` : ''}`,
      });

      toast.success(approve ? 'Claim approved!' : 'Claim rejected');
    } catch (e) {
      toast.error((e as Error).message);
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
          <TabsContent value="claims">
            <Card>
              <CardHeader>
                <CardTitle>Pending Claims</CardTitle>
                <CardDescription>Review and approve claim requests</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingClaims.length === 0 ? (
                  <p className="text-center py-8">No pending claims</p>
                ) : (
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    <div className="space-y-6 pr-4">
                      {pendingClaims.map(claim => {
                        const item = items.find(i => i.id === claim.itemId);
                        return (
                          <Card key={claim.id} className="shadow-sm">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">{item?.itemType}</CardTitle>
                                  <p className="text-sm text-muted-foreground pt-1">
                                    Claim Code: <code className="font-mono bg-gray-100 p-1 rounded-sm text-xs">{claim.claimCode}</code>
                                  </p>
                                </div>
                                <Badge variant="secondary">
                                  <Clock className="mr-2 h-4 w-4" />
                                  Pending
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Security Answers:</h4>
                                <div className="space-y-3">
                                  {claim.answers.map((answer, index) => (
                                    <div key={index} className="border p-3 rounded-lg bg-gray-50/70">
                                      <p className="font-semibold text-sm text-gray-700">
                                        Q{index + 1}: {item?.securityQuestions[index]?.question}
                                      </p>
                                      <p className="pt-1">Answer: {answer}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <Button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedClaim(claim.id);
                                  setShowClaimDialog(true);
                                }}
                              >
                                Review Claim
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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
      
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Claim Request</DialogTitle>
            <DialogDescription>Verify the claimant's answers and approve or reject the claim</DialogDescription>
          </DialogHeader>
          {selectedClaim && (() => {
            const claim = claims.find(c => c.id === selectedClaim);
            const item = claim && items.find(i => i.id === claim.itemId);
            if (!claim || !item) return null;

            return (
              <div className="space-y-6 pt-4">
                <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-gray-800">Claim Code: <code className="font-mono bg-white p-1 rounded-sm">{claim.claimCode}</code></span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(claim.claimCode)}>Copy</Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Item Type</p>
                    <p className="font-semibold text-lg">{item.itemType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-semibold text-lg">{item.location}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Security Questions & Answers</h3>
                  <div className="space-y-4">
                    {item.securityQuestions.map((sq, i) => (
                      <div key={i} className="border p-4 rounded-lg bg-gray-50/70">
                        <p className="font-semibold text-gray-800 mb-3">Question {i + 1}: {sq.question}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Claimant's Answer</p>
                            <p className="font-medium text-blue-600">{claim.answers[i]}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Correct Answer</p>
                            <p className="font-medium text-green-600">{sq.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={() => confirmVerifyClaim(selectedClaim!, false)}>
              <XCircle className="mr-2 h-4 w-4" /> Reject Claim
            </Button>
            <Button onClick={() => confirmVerifyClaim(selectedClaim!, true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmAction.show} onOpenChange={v => !v && setConfirmAction({show:false,type:null})}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Action</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if(confirmAction.type === 'verify-item') handleVerifyItem(confirmAction.itemId!, true); else if(confirmAction.type === 'reject-item') handleVerifyItem(confirmAction.itemId!, false); else if(confirmAction.type === 'approve-claim') handleVerifyClaim(confirmAction.claimId!, true); else if(confirmAction.type === 'reject-claim') handleVerifyClaim(confirmAction.claimId!, false); }}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};
