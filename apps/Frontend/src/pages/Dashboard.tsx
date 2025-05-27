import { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import axiosInstance from '../axiosinstance';
import Admin from '../components/Admin';
import Member from '../components/Member';

interface Group {
  _id: string;
  name: string;
  members: { _id: string; username: string; email: string }[];
}

const Dashboard = () => {
  const { userId, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const resp = await axiosInstance.get<{admin: boolean}>('/auth/me');
        setIsAdmin(resp.data.admin);
        console.log("User is admin:", resp.data.admin);
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchGroups = async () => {
      try {
        const resp = await axiosInstance.get<Group[]>('/groups');
        setGroups(resp.data);
        console.log("Fetched groups:", resp.data);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    if (isAuthenticated) {
      fetchUserDetails();
      fetchGroups();
    }
  }, [isAuthenticated, userId]);

  return (
    <div className="dashboard container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : isAdmin ? (
        <Admin groups={groups} setGroups={setGroups} />
      ) : (
        <Member userId={userId || ''} groups={groups} />
      )}
    </div>
  );
};

export default Dashboard;