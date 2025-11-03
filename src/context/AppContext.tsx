import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, LostItem, Claim, ActivityLog } from '../types';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
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
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [items, setItems] = useState<LostItem[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

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
          setCurrentPage(appUser.role === 'admin' ? 'admin' : 'board');
        } else {
          setCurrentUser(null);
          setCurrentPage('login');
        }
      } else {
        setCurrentUser(null);
        setCurrentPage('landing');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'items'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LostItem));
      setItems(itemsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setClaims([]);
      return;
    }

    let claimsQuery;
    if (currentUser.role === 'admin') {
      claimsQuery = query(collection(db, 'claims'));
    } else {
      claimsQuery = query(collection(db, 'claims'), where('claimantId', '==', currentUser.id));
    }

    const unsubscribe = onSnapshot(claimsQuery, 
      (querySnapshot) => {
        const claimsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Claim));
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
    const q = query(collection(db, 'activity'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      setActivityLogs(logsData);
    });
    return () => unsubscribe();
  }, []);

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
    setCurrentUser(null);
    setCurrentPage('landing');
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
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
