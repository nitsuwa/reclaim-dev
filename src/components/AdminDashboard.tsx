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

export const AdminDashboard = () => {
  const { currentUser, items, setItems, claims, setClaims, activityLogs, addActivityLog } = useApp();
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

  // Clipboard copy helper with fallback
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Claim code copied!');
    } catch (err) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        toast.success('Claim code copied!');
      } catch (fallbackErr) {
        toast.error('Failed to copy. Please copy manually.');
      }
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

  const handleVerifyItem = (itemId: string, approve: boolean) => {
    const item = items.find(i => i.id === itemId);
    
    if (approve) {
      // Approve: set status to verified
      setItems(items.map(item => 
        item.id === itemId 
          ? { ...item, status: 'verified' as const }
          : item
      ));
    } else {
      // Reject: remove the item from the list
      setItems(items.filter(item => item.id !== itemId));
    }
    
    // Add activity log
    if (item) {
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
    }
    
    toast.success(approve ? 'Item verified and published!' : 'Item report rejected');
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

  const handleVerifyClaim = (claimId: string, approve: boolean) => {
    const claim = claims.find(c => c.id === claimId);
    const item = claim ? items.find(i => i.id === claim.itemId) : null;
    
    setClaims(claims.map(claim =>
      claim.id === claimId
        ? { ...claim, status: approve ? 'approved' as const : 'rejected' as const }
        : claim
    ));
    
    if (approve && claim) {
      setItems(items.map(item =>
        item.id === claim.itemId
          ? { ...item, status: 'claimed' as const }
          : item
      ));
    }
    
    // Add activity log
    if (claim && item) {
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
    }
    
    toast.success(approve ? 'Claim approved!' : 'Claim rejected');
    setShowClaimDialog(false);
    setSelectedClaim(null);
    // Clear lookup result if this claim was in lookup
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

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'item_reported': 'Item Reported',
      'item_verified': 'Item Verified',
      'item_rejected': 'Item Rejected',
      'claim_submitted': 'Claim Submitted',
      'claim_approved': 'Claim Approved',
      'claim_rejected': 'Claim Rejected',
      'failed_claim_attempt': 'Failed Claim Attempt',
      'item_status_changed': 'Item Status Changed'
    };
    return labels[action] || action;
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('approved') || action.includes('verified')) return 'default';
    if (action.includes('rejected') || action.includes('failed')) return 'destructive';
    if (action.includes('pending') || action.includes('submitted')) return 'secondary';
    return 'outline';
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

        {/* Tabs */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reports">Item Reports</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="lookup">Claim Lookup</TabsTrigger>
            <TabsTrigger value="logs">
              <ScrollText className="h-4 w-4 mr-2" />
              Activity Logs
            </TabsTrigger>
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
                      <div 
                        key={item.id} 
                        className="border border-border rounded-lg p-4 flex items-start gap-4 hover:border-accent transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedItem(item.id);
                          setShowItemDialog(true);
                        }}
                      >
                        <div 
                          className="relative w-24 h-24 cursor-pointer group/photo flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUnblurredPhotos(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(item.id)) {
                                newSet.delete(item.id);
                              } else {
                                newSet.add(item.id);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <img
                            src={item.photoUrl}
                            alt={item.itemType}
                            className={`w-24 h-24 object-cover rounded transition-all ${
                              unblurredPhotos.has(item.id) ? '' : 'blur-md'
                            }`}
                          />
                          {!unblurredPhotos.has(item.id) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded group-hover/photo:bg-black/40 transition-colors">
                              <Eye className="h-6 w-6 text-white group-hover/photo:scale-110 transition-transform" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <h4 className="text-primary">
                              {item.itemType}
                              {item.otherItemTypeDetails && ` - ${item.otherItemTypeDetails}`}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Found at {item.location} on {new Date(item.dateFound).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-accent text-white hover:bg-accent/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item.id);
                                setShowItemDialog(true);
                              }}
                            >
                              Review
                            </Button>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-secondary text-white">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
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
                        <div 
                          className="relative w-24 h-24 cursor-pointer group/photo flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUnblurredPhotos(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(item.id)) {
                                newSet.delete(item.id);
                              } else {
                                newSet.add(item.id);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <img
                            src={item.photoUrl}
                            alt={item.itemType}
                            className={`w-24 h-24 object-cover rounded transition-all ${
                              unblurredPhotos.has(item.id) ? '' : 'blur-md'
                            }`}
                          />
                          {!unblurredPhotos.has(item.id) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded group-hover/photo:bg-black/40 transition-colors">
                              <Eye className="h-6 w-6 text-white group-hover/photo:scale-110 transition-transform" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-primary">
                            {item.itemType}
                            {item.otherItemTypeDetails && ` - ${item.otherItemTypeDetails}`}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {item.location} - {new Date(item.dateFound).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-accent text-white">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle>Pending Claims</CardTitle>
                <CardDescription>Review and approve claim requests</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingClaims.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending claims</p>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {pendingClaims.map(claim => {
                      const item = items.find(i => i.id === claim.itemId);
                      return (
                        <div 
                          key={claim.id} 
                          className="border border-border rounded-lg p-4 hover:border-accent transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedClaim(claim.id);
                            setShowClaimDialog(true);
                          }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-primary">
                                {item?.itemType || 'Unknown Item'}
                                {item?.otherItemTypeDetails && ` - ${item.otherItemTypeDetails}`}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>Claim Code:</span>
                                <code 
                                  className="bg-muted px-2 py-1 rounded text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(claim.claimCode);
                                  }}
                                >
                                  {claim.claimCode}
                                </code>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-secondary text-white">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                          <div className="space-y-2 mb-4">
                            <p className="text-sm">Security Answers:</p>
                            {claim.answers.map((answer, idx) => (
                              <div key={idx} className="text-sm bg-card border border-border p-3 rounded">
                                <p className="text-muted-foreground mb-1">
                                  <strong>Q{idx + 1}:</strong> {item?.securityQuestions[idx]?.question}
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Answer:</span> {answer}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-accent text-white hover:bg-accent/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClaim(claim.id);
                                setShowClaimDialog(true);
                              }}
                            >
                              Review Claim
                            </Button>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lookup" className="space-y-4">
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle>Claim Code Lookup</CardTitle>
                <CardDescription>Enter a claim code to view and process the claim</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter claim code (e.g., CLM-123456)"
                    value={claimCodeInput}
                    onChange={(e) => setClaimCodeInput(e.target.value.toUpperCase())}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleClaimCodeLookup();
                      }
                    }}
                  />
                  <Button onClick={handleClaimCodeLookup} className="bg-accent text-white hover:bg-accent/90">
                    Search
                  </Button>
                </div>

                {lookupClaim && (() => {
                  const item = items.find(i => i.id === lookupClaim.itemId);
                  if (!item) return <p className="text-center text-muted-foreground py-8">Item not found</p>;
                  
                  return (
                    <div className="border border-border rounded-lg p-6 space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-primary mb-1">Claim Details</h3>
                          <Badge 
                            variant={
                              lookupClaim.status === 'approved' ? 'default' : 
                              lookupClaim.status === 'rejected' ? 'destructive' : 
                              'secondary'
                            }
                            className={
                              lookupClaim.status === 'approved' ? 'bg-accent text-white' : 
                              lookupClaim.status === 'rejected' ? 'bg-destructive text-white' : 
                              'bg-secondary text-white'
                            }
                          >
                            {lookupClaim.status.charAt(0).toUpperCase() + lookupClaim.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <Alert className="bg-accent/10 border-accent">
                        <AlertCircle className="h-4 w-4 text-accent" />
                        <AlertDescription className="flex items-center justify-between">
                          <span><strong>Claim Code:</strong> {lookupClaim.claimCode}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              copyToClipboard(lookupClaim.claimCode);
                            }}
                          >
                            Copy
                          </Button>
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Item Type</p>
                          <p className="text-primary">{item.itemType}</p>
                          {item.otherItemTypeDetails && (
                            <p className="text-sm text-muted-foreground mt-1">({item.otherItemTypeDetails})</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Location Found</p>
                          <p>{item.location}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Date Found</p>
                          <p>{new Date(item.dateFound).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Submitted</p>
                          <p>{new Date(lookupClaim.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Security Questions & Answers</p>
                        {lookupClaim.answers.map((answer: string, idx: number) => (
                          <div key={idx} className="bg-muted/50 border border-border p-4 rounded-lg space-y-3">
                            <p className="text-sm">
                              <span className="text-primary">Question {idx + 1}:</span> {item.securityQuestions[idx]?.question}
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Claimant's Answer</p>
                                <p className="text-sm text-primary">{answer}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Correct Answer</p>
                                <p className="text-sm text-accent">{item.securityQuestions[idx]?.answer}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {lookupClaim.status === 'pending' && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => confirmVerifyClaim(lookupClaim.id, false)}
                            className="flex-1 hover:bg-destructive hover:text-white"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Claim
                          </Button>
                          <Button
                            onClick={() => confirmVerifyClaim(lookupClaim.id, true)}
                            className="flex-1 bg-accent text-white hover:bg-accent/90"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve & Release
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>Complete history of system activities and actions</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activity logs</p>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="text-sm text-neutral-accent">
                                {new Date(log.timestamp).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell className="text-sm">{log.userName}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={getActionBadgeVariant(log.action)}
                                  className={
                                    log.action.includes('verified') || log.action.includes('approved') 
                                      ? 'bg-accent text-white' 
                                      : log.action.includes('rejected') || log.action.includes('failed')
                                      ? 'bg-destructive text-white'
                                      : 'bg-secondary text-white'
                                  }
                                >
                                  {getActionLabel(log.action)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-primary">
                                {log.itemType || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-md">
                                {log.details}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Item Review Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Item Report</DialogTitle>
            <DialogDescription>
              Verify the item details and approve or reject the report
            </DialogDescription>
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
                      <p className="text-primary">
                        {item.itemType}
                        {item.otherItemTypeDetails && ` - ${item.otherItemTypeDetails}`}
                      </p>
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
                          <p className="text-sm">
                            <span className="text-primary">Q{idx + 1}:</span> {sq.question}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => confirmVerifyItem(selectedItem!, false)}
              className="hover:bg-destructive hover:text-white"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button 
              onClick={() => confirmVerifyItem(selectedItem!, true)}
              className="bg-accent text-white hover:bg-accent/90"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Review Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Claim Request</DialogTitle>
            <DialogDescription>
              Verify the claimant's answers and approve or reject the claim
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (() => {
            const claim = claims.find(c => c.id === selectedClaim);
            const item = claim ? items.find(i => i.id === claim.itemId) : null;
            return claim && item ? (
              <div className="space-y-4">
                <Alert className="bg-accent/10 border-accent/30">
                  <AlertDescription className="flex items-center justify-between">
                    <span><strong>Claim Code:</strong> {claim.claimCode}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        copyToClipboard(claim.claimCode);
                      }}
                    >
                      Copy
                    </Button>
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Item Type</p>
                    <p className="text-primary">
                      {item.itemType}
                      {item.otherItemTypeDetails && ` - ${item.otherItemTypeDetails}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p>{item.location}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Security Questions & Answers</p>
                  {claim.answers.map((answer, idx) => (
                    <div key={idx} className="bg-muted/50 border border-border p-4 rounded-lg space-y-3">
                      <p className="text-sm">
                        <span className="text-primary">Question {idx + 1}:</span> {item.securityQuestions[idx]?.question}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Claimant's Answer</p>
                          <p className="text-sm text-primary">{answer}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Correct Answer</p>
                          <p className="text-sm text-accent">{item.securityQuestions[idx]?.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => confirmVerifyClaim(selectedClaim!, false)}
              className="hover:bg-destructive hover:text-white"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Claim
            </Button>
            <Button 
              onClick={() => confirmVerifyClaim(selectedClaim!, true)}
              className="bg-accent text-white hover:bg-accent/90"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve & Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmAction.show} onOpenChange={(open) => !open && setConfirmAction({ show: false, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.type === 'verify-item' && 'Verify Item Report'}
              {confirmAction.type === 'reject-item' && 'Reject Item Report'}
              {confirmAction.type === 'approve-claim' && 'Approve Claim'}
              {confirmAction.type === 'reject-claim' && 'Reject Claim'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.type === 'verify-item' && 
                'Are you sure you want to verify this item? It will be published to the Lost & Found Board and become visible to all users.'}
              {confirmAction.type === 'reject-item' && 
                'Are you sure you want to reject this item report? This action cannot be undone and the item will be permanently removed from the system.'}
              {confirmAction.type === 'approve-claim' && 
                'Are you sure you want to approve this claim? The item will be marked as claimed and the claimant can collect it at the Guard Post.'}
              {confirmAction.type === 'reject-claim' && 
                'Are you sure you want to reject this claim? The claimant will not be able to collect this item.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction.type === 'verify-item' && confirmAction.itemId) {
                  handleVerifyItem(confirmAction.itemId, true);
                } else if (confirmAction.type === 'reject-item' && confirmAction.itemId) {
                  handleVerifyItem(confirmAction.itemId, false);
                } else if (confirmAction.type === 'approve-claim' && confirmAction.claimId) {
                  handleVerifyClaim(confirmAction.claimId, true);
                } else if (confirmAction.type === 'reject-claim' && confirmAction.claimId) {
                  handleVerifyClaim(confirmAction.claimId, false);
                }
              }}
              className={
                confirmAction.type === 'verify-item' || confirmAction.type === 'approve-claim'
                  ? 'bg-accent hover:bg-accent/90'
                  : 'bg-destructive hover:bg-destructive/90'
              }
            >
              {confirmAction.type === 'verify-item' && 'Verify & Publish'}
              {confirmAction.type === 'reject-item' && 'Reject'}
              {confirmAction.type === 'approve-claim' && 'Approve'}
              {confirmAction.type === 'reject-claim' && 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
