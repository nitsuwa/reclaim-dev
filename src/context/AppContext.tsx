import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, LostItem, Claim, ActivityLog } from '../types';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, onSnapshot, query } from 'firebase/firestore';

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
          const appUser = {
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

  const addActivityLog = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    try {
      await addDoc(collection(db, 'activity'), newLog);
      setActivityLogs(prev => [newLog, ...prev]);
    } catch (error) {
      console.error('Error adding activity log: ', error);
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
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};