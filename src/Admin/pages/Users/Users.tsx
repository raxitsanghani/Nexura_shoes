import { useEffect, useState } from "react";
import UserTable from "@/Admin/components/Tables/UserTable";
import ReactLoading from "react-loading";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import toast, { Toaster } from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState<any[]>([]); // Typed as any[] for now to avoid complexity in this file
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    // Real-time listener for users
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleBlockUser = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isBlocked: !currentStatus
      });
      toast.success(currentStatus ? "User Unblocked" : "User Blocked");
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user and all their data? This cannot be undone.")) {
      return;
    }

    const toastId = toast.loading("Deleting user...");
    try {
      // Find user email for blacklist
      const userToDelete = users.find((u: any) => u.id === userId);
      const userEmail = userToDelete?.email;

      const batch = writeBatch(db);

      // 1. Add to Blacklist (deleted_users)
      if (userEmail) {
        const blacklistRef = doc(db, "deleted_users", userEmail);
        batch.set(blacklistRef, {
          email: userEmail,
          deletedAt: new Date(),
          reason: "Admin Permanent Delete"
        });
      }

      // 2. Delete all orders by this user
      const ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
      const ordersSnapshot = await getDocs(ordersQuery);

      ordersSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 3. Delete the user document
      const userRef = doc(db, "users", userId);
      batch.delete(userRef);

      await batch.commit();

      toast.success("User and all data deleted permanently", { id: toastId });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user", { id: toastId });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <ReactLoading type={"bars"} height={40} width={40} color="black" />
        </div>
      ) : (
        <UserTable
          users={users}
          onBlock={handleBlockUser}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default Users;
