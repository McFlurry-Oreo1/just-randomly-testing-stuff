import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { useEffect, useState } from "react";
import { db, doc, getDoc, setDoc, onSnapshot } from "@/lib/firebase";

export function useAuth() {
  const { data: serverUser, isLoading: serverLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const [firebaseBalance, setFirebaseBalance] = useState<number | null>(null);

  useEffect(() => {
    if (serverUser?.email) {
      const userDocRef = doc(db, "locked", serverUser.email);
      
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setFirebaseBalance(docSnap.data().diamondBalance);
        } else {
          // Initialize user in firebase if doesn't exist
          setDoc(userDocRef, {
            email: serverUser.email,
            diamondBalance: serverUser.diamondBalance || 0,
            firstName: serverUser.firstName,
            lastName: serverUser.lastName
          });
        }
      });

      return () => unsubscribe();
    }
  }, [serverUser?.email]);

  const user = serverUser ? {
    ...serverUser,
    diamondBalance: firebaseBalance !== null ? firebaseBalance : serverUser.diamondBalance
  } : null;

  return {
    user,
    isLoading: serverLoading,
    isAuthenticated: !!user,
  };
}
