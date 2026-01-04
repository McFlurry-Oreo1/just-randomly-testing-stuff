import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DiamondBalance } from "@/components/DiamondBalance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Users, Loader2, Plus, Minus, Trash2, Play, Pause, RotateCcw } from "lucide-react";
import type { User } from "@shared/schema";
import { db, doc, onSnapshot, setDoc, updateDoc, getDoc } from "@/lib/firebase";

export default function UserManagement() {
  const { toast } = useToast();
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "game"), (docSnap) => {
      if (docSnap.exists()) {
        setGameState(docSnap.data());
      } else {
        setDoc(doc(db, "settings", "game"), {
          isActive: false,
          timeLeft: 3600,
          lastTick: Date.now()
        });
      }
    });

    // Also sync users to Firebase if they don't exist there
    if (users) {
      users.forEach(async (u) => {
        const userRef = doc(db, "locked", u.email);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            email: u.email,
            diamondBalance: u.diamondBalance,
            isAdmin: u.isAdmin,
            firstName: u.firstName || "",
            lastName: u.lastName || ""
          });
        }
      });
    }

    return () => unsubscribe();
  }, [users]);

  const handleAdjustDiamonds = async (userId: string) => {
    const amount = adjustments[userId];
    if (amount && amount !== 0) {
      const user = users?.find(u => u.id === userId);
      if (user) {
        // Update PG
        await adjustDiamondsMutation.mutateAsync({ userId, amount });
        
        // Update Firebase for instant sync
        const userRef = doc(db, "locked", user.email);
        const snap = await getDoc(userRef);
        const currentBalance = snap.exists() ? snap.data().diamondBalance : user.diamondBalance;
        await setDoc(userRef, { diamondBalance: currentBalance + amount }, { merge: true });
      }
      setAdjustments({ ...adjustments, [userId]: 0 });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center glass p-12 rounded-lg max-w-md">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Users</h3>
          <p className="text-muted-foreground">No users found in the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and diamond balances.
          </p>
        </div>
        <Card className="glass p-4 flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Rewards</p>
            <p className="text-2xl font-mono font-bold">{gameState?.isActive ? "ON" : "OFF"}</p>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant={gameState?.isActive ? "destructive" : "default"} onClick={async () => {
              const newState = !gameState?.isActive;
              await updateDoc(doc(db, "settings", "game"), {
                isActive: newState,
                lastTick: Date.now()
              });
            }}>
              {gameState?.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="glass p-6" data-testid={`card-user-${user.id}`}>
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback>
                  {user.firstName?.[0] || user.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold" data-testid={`text-user-email-${user.id}`}>
                    {user.email || `User ${user.id.slice(0, 8)}`}
                  </h3>
                  {user.isAdmin && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>
                {user.firstName && user.lastName && (
                  <p className="text-sm text-muted-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <DiamondBalance balance={user.diamondBalance} size="md" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    const current = adjustments[user.id] || 0;
                    setAdjustments({ ...adjustments, [user.id]: current - 100 });
                  }}
                  data-testid={`button-decrease-diamonds-${user.id}`}
                >
                  <Minus className="w-4 h-4" />
                </Button>

                <Input
                  type="number"
                  value={adjustments[user.id] || 0}
                  onChange={(e) => {
                    setAdjustments({ ...adjustments, [user.id]: parseInt(e.target.value) || 0 });
                  }}
                  className="w-32 text-center"
                  placeholder="0"
                  data-testid={`input-diamond-adjustment-${user.id}`}
                />

                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    const current = adjustments[user.id] || 0;
                    setAdjustments({ ...adjustments, [user.id]: current + 100 });
                  }}
                  data-testid={`button-increase-diamonds-${user.id}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => handleAdjustDiamonds(user.id)}
                  disabled={!adjustments[user.id] || adjustments[user.id] === 0 || adjustDiamondsMutation.isPending}
                  data-testid={`button-apply-adjustment-${user.id}`}
                >
                  Apply
                </Button>
              </div>

              {!user.isAdmin && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${user.email}?`)) {
                      deleteUserMutation.mutate(user.id);
                    }
                  }}
                  disabled={deleteUserMutation.isPending}
                  data-testid={`button-delete-user-${user.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
