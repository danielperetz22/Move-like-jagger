import { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import axiosInstance from '../axiosinstance';
import Button from '../components/ui/Button';

interface Group {
  _id: string;
  name: string;
  members: { _id: string; username: string; email: string }[];
}

interface User {
  _id: string;
  username: string;
  email: string;
}

const Dashboard = () => {
  const { userId, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // Use the /auth/me endpoint instead of /users/:id
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

  const createGroup = async () => {
    try {
      const resp = await axiosInstance.post<Group>('/groups', { name: groupName });
      setGroups([...groups, resp.data]);
      setGroupName('');
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      console.log("Search query is empty");
      return;
    }
    
    try {
      console.log("Searching for users with query:", searchQuery);
      const resp = await axiosInstance.get<User[]>(`/auth/search`, {
        params: { query: searchQuery },
      });
      console.log("Search results:", resp.data);
      setSearchResults(resp.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const addMember = async (userId: string) => {
    try {
      await axiosInstance.post(`/groups/${selectedGroupId}/members`, { memberIds: [userId] });
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  return (
    <div className="dashboard container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : isAdmin ? (
        <div className="admin-panel">
          <h2 className="text-2xl font-semibold mb-4">Admin Panel</h2>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="border p-2 rounded w-full mb-2"
            />
            <Button onClick={createGroup} variant="primary">
              Create Group
            </Button>
          </div>
          <div className="mb-6 border p-4 rounded bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Add Users to Group</h3>
            <select
              onChange={(e) => setSelectedGroupId(e.target.value)}
              value={selectedGroupId}
              className="border p-2 rounded w-full mb-2"
            >
              <option value="">Select Group</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Search Users by Username or Email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border p-2 rounded flex-grow"
              />
              <Button onClick={searchUsers} variant="secondary">
                Search
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Search Results</h4>
                <ul className="border rounded bg-white">
                  {searchResults.map((user) => (
                    <li key={user._id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                      <span>
                        {user.username} ({user.email})
                      </span>
                      <Button 
                        onClick={() => addMember(user._id)} 
                        variant="outline2"
                        disabled={!selectedGroupId}
                      >
                        Add to Group
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Groups</h2>
          <ul>
            {groups
              .filter((group) => group.members.some((member) => member._id === userId))
              .map((group) => (
                <li key={group._id} className="mb-2">
                  {group.name}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
