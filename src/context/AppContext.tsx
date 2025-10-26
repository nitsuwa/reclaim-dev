import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, LostItem, Claim, ActivityLog } from '../types';
import { db } from '../db/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

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
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
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
    const q = query(collection(db, "foundItems"), orderBy("reportedAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData: LostItem[] = [];
      querySnapshot.forEach((doc) => {
        itemsData.push({ ...doc.data(), id: doc.id } as LostItem);
      });
      setItems(itemsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "claims"), orderBy("submittedAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const claimsData: Claim[] = [];
      querySnapshot.forEach((doc) => {
        claimsData.push({ ...doc.data(), id: doc.id } as Claim);
      });
      setClaims(claimsData);
    });

    return () => unsubscribe();
  }, []);

  const addActivityLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);
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
        addActivityLog
      }}
    >
      {children}
    </AppContext.Provider>
  );
};