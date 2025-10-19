import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useApp } from '../context/AppContext';
import { Search, Filter, Plus, Package, MapPin, Calendar, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';

export const LostAndFoundBoard = () => {
  const { currentUser, items, setCurrentPage, setSelectedItem } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [currentPage, setCurrentPageNum] = useState(1);
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null);
  const itemsPerPage = 9;

  const filteredItems = items
    .filter(item => item.status === 'verified')
    .filter(item => {
      const matchesSearch = item.itemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.otherItemTypeDetails?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.itemType.toLowerCase().includes(filterType.toLowerCase());
      const matchesLocation = filterLocation === 'all' || item.location.includes(filterLocation);
      
      let matchesDate = true;
      if (filterDate !== 'all') {
        const itemDate = new Date(item.dateFound || item.foundDate || '');
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filterDate === 'today') matchesDate = daysDiff === 0;
        if (filterDate === 'week') matchesDate = daysDiff <= 7;
        if (filterDate === 'month') matchesDate = daysDiff <= 30;
      }
      
      return matchesSearch && matchesType && matchesLocation && matchesDate;
    });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handleClaimItem = (item: any) => {
    setClaimingItemId(item.id);
    
    // Simulate a brief delay to show loading state
    setTimeout(() => {
      setSelectedItem(item);
      setCurrentPage('claim');
      setClaimingItemId(null);
      toast.info('Starting claim process', {
        description: 'Please answer the security questions to proceed'
      });
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      verified: { variant: 'default', label: 'Verified' },
      pending: { variant: 'secondary', label: 'Pending' },
      claimed: { variant: 'outline', label: 'Claimed' }
    };

    const config = variants[status] || variants.verified;
    return (
      <Badge variant={config.variant} className={
        status === 'verified' ? 'bg-accent text-white' :
        status === 'pending' ? 'bg-secondary text-white' :
        'bg-muted text-muted-foreground'
      }>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-primary mb-2">Lost & Found Board</h1>
          <p className="text-muted-foreground">
            Browse verified found items and initiate a claim if you recognize your belongings
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 shadow-sm border border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by item type, location, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-12 border-2 focus:border-accent transition-all"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-11 border-2">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Item Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="id">ID Card</SelectItem>
                    <SelectItem value="bag">Bag</SelectItem>
                    <SelectItem value="keys">Keys</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="h-11 border-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Library">Library</SelectItem>
                    <SelectItem value="Cafeteria">Cafeteria</SelectItem>
                    <SelectItem value="Gym">Gym</SelectItem>
                    <SelectItem value="Classroom">Classroom</SelectItem>
                    <SelectItem value="Hallway">Hallway</SelectItem>
                    <SelectItem value="Parking">Parking Lot</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterDate} onValueChange={setFilterDate}>
                  <SelectTrigger className="h-11 border-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Date Found" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Past Week</SelectItem>
                    <SelectItem value="month">Past Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(searchTerm || filterType !== 'all' || filterLocation !== 'all' || filterDate !== 'all') && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Found {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                      setFilterLocation('all');
                      setFilterDate('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="mb-6">
          <Button 
            onClick={() => setCurrentPage('report')} 
            className="w-full sm:w-auto bg-accent text-white hover:bg-accent/90 shadow-md h-12"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Report Found Item
          </Button>
        </div>

        {/* Items Grid */}
        {paginatedItems.length === 0 ? (
          <Card className="shadow-sm border border-border">
            <CardContent className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-muted-foreground mb-2">No items found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || filterType !== 'all' || filterLocation !== 'all' || filterDate !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'There are no verified items at the moment'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedItems.map((item) => {
                const isClaiming = claimingItemId === item.id;
                return (
                  <Card key={item.id} className="overflow-hidden transition-all duration-300 border border-border hover:border-accent hover:shadow-2xl hover:-translate-y-1 group">
                    <CardHeader className="p-0">
                      <div className="relative h-56 bg-muted">
                        {/* Always keep photos blurred for students */}
                        <img
                          src={item.photoUrl}
                          alt={item.itemType}
                          className="w-full h-full object-cover blur-lg scale-105"
                        />
                        {/* Overlay to indicate photo is blurred for privacy */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                          <div className="text-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                              <p className="text-white text-sm">Photo blurred for security</p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <CardTitle className="text-primary mb-1">
                          {item.itemType}
                          {item.otherItemTypeDetails && ` - ${item.otherItemTypeDetails}`}
                        </CardTitle>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 text-accent" />
                          <span>{item.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>Found on {new Date(item.dateFound || item.foundDate || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        onClick={() => handleClaimItem(item)}
                        disabled={isClaiming}
                        className={`w-full bg-primary hover:bg-primary-hover transition-all ${
                          isClaiming ? 'bg-primary-hover' : ''
                        }`}
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Starting Claim...
                          </>
                        ) : (
                          'Initiate Claim'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPageNum(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPageNum(page)}
                      className={page === currentPage ? 'bg-accent text-white hover:bg-accent/90' : ''}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPageNum(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};