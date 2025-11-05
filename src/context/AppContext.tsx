import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, LostItem, Claim, ActivityLog } from '../types';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, writeBatch, orderBy } from 'firebase/firestore';
import { toast } from 'sonner@2.0.3';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  items: LostItem[];
  setItems: (items: LostItem[]) => void;
  claims: Claim[];
  setClaims: (claims: Claim[]) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  selectedItem: LostItem | null;
  setSelectedItem: (item: LostItem | null) => void;
  activityLogs: ActivityLog[];
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => Promise<void>;
  addClaim: (claimData: { itemId: string, answers: string[] }) => Promise<string>;
  updateClaim: (claimId: string, status: 'approved' | 'rejected') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const storedPage = localStorage.getItem('currentPage');
    return storedPage || 'landing';
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [items, setItems] = useState<LostItem[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const appUser: User = {
            id: user.uid,
            fullName: userData.fullName,
            studentId: userData.studentId,
            contactNumber: userData.contactNumber,
            email: userData.email,
            role: userData.role
          };
          setCurrentUser(appUser);
          if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'register' || currentPage === 'forgot-password') {
            setCurrentPage(appUser.role === 'admin' ? 'admin' : 'board');
          }
        } else {
          setCurrentUser(null);
          setCurrentPage('login');
        }
      } else {
        setCurrentUser(null);
        setCurrentPage('landing');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setItems([]);
      return;
    }
    const q = query(collection(db, 'items'), orderBy('dateFound', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LostItem));
      setItems(itemsData);
    }, (error) => {
      console.error("Error fetching items:", error);
      toast.error("Failed to load item data.");
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setClaims([]);
      return;
    }

    let claimsQuery;
    if (currentUser.role === 'admin') {
      claimsQuery = query(collection(db, 'claims'), orderBy('submittedAt', 'desc'));
    } else {
      claimsQuery = query(collection(db, 'claims'), where('claimantId', '==', currentUser.id));
    }

    const unsubscribe = onSnapshot(claimsQuery, 
      (querySnapshot) => {
        const claimsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Claim));
        if (currentUser.role !== 'admin') {
          claimsData.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        }
        setClaims(claimsData);
      },
      (error) => {
        console.error("Error fetching claims:", error);
        toast.error("Failed to load claims data.");
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setActivityLogs([]);
      return;
    }

    let activityQuery;
    if (currentUser.role === 'admin') {
      activityQuery = query(collection(db, 'activity'), orderBy('timestamp', 'desc'));
    } else {
      activityQuery = query(collection(db, 'activity'), where('userId', '==', currentUser.id));
    }

    const unsubscribe = onSnapshot(activityQuery, (querySnapshot) => {
      const logsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      if (currentUser.role !== 'admin') {
        logsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
      setActivityLogs(logsData);
    }, (error) => {
      console.error("Error fetching activity logs:", error);
      toast.error("Failed to load activity data.");
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addActivityLog = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    try {
      await addDoc(collection(db, 'activity'), { ...log, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error adding activity log: ', error);
    }
  };

  const addClaim = async (claimData: { itemId: string, answers: string[] }) => {
    if (!currentUser) throw new Error("User not logged in.");
    const item = items.find(i => i.id === claimData.itemId);
    if (!item) throw new Error("Could not find item to claim.");

    const newClaim: Omit<Claim, 'id'> = {
      itemId: claimData.itemId,
      claimantId: currentUser.id,
      claimantName: currentUser.fullName,
      answers: claimData.answers,
      status: 'pending',
      claimCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      submittedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'claims'), newClaim);
      await addActivityLog({
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'claim_submitted',
        itemId: item.id,
        itemType: item.itemType,
        details: `Submitted a claim for ${item.itemType} (Code: ${newClaim.claimCode})`,
      });
      return newClaim.claimCode;
    } catch (e) {
      console.error("Failed to submit claim:", e);
      throw e;
    }
  };

  const updateClaim = async (claimId: string, status: 'approved' | 'rejected') => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Unauthorized action.");
    }

    const claim = claims.find(c => c.id === claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }

    const item = items.find(i => i.id === claim.itemId);
    if (!item) {
      throw new Error("Associated item not found");
    }

    try {
      const batch = writeBatch(db);
      const claimRef = doc(db, 'claims', claimId);
      batch.update(claimRef, { status });

      if (status === 'approved') {
        const itemRef = doc(db, 'items', claim.itemId);
        batch.update(itemRef, { status: 'claimed' });
      }
      
      await batch.commit();

    } catch (error) {
      console.error("Failed to update claim status:", error);
      throw new Error("Failed to update claim status. Please try again.");
    }
  };

  const logout = () => {
    auth.signOut();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        items,
        setItems,
        claims,
        setClaims,
        currentPage,
        setCurrentPage,
        selectedItem,
        setSelectedItem,
        activityLogs,
        addActivityLog,
        addClaim,
        updateClaim,
        logout,
        loading
      }}
    >
      {!loading && children}
    </AppContext.Provider>
  );
};
