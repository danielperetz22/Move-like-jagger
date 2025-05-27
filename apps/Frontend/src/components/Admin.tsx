import React, { useState } from 'react';
import axiosInstance from '../axiosinstance';
import Button from './ui/Button';
import Input from './ui/Input';


interface AdminProps {
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
}

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

const Admin: React.FC<AdminProps> = ({ groups, setGroups }) => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [activeTab, setActiveTab] = useState<'groups' | 'members'>('groups');
  const [selectedGroupForDisplay, setSelectedGroupForDisplay] = useState<Group | null>(null);

  const createGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }
    
    try {
      const resp = await axiosInstance.post<Group>('/groups', { name: groupName });
      setGroups([...groups, resp.data]);
      setGroupName('');
      // Switch to members tab to immediately add members
      setSelectedGroupId(resp.data._id);
      setActiveTab('members');
      alert("Group created successfully! You can now add members.");
    } catch (error) {
      console.error('Error creating group:', error);
      alert("Failed to create group. Please try again.");
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
      
      // Refresh the groups list to show updated members
      const resp = await axiosInstance.get<Group[]>('/groups');
      setGroups(resp.data);
      
      // Update the selected group for display if needed
      if (selectedGroupForDisplay) {
        const updatedGroup = resp.data.find(g => g._id === selectedGroupForDisplay._id);
        if (updatedGroup) {
          setSelectedGroupForDisplay(updatedGroup);
        }
      }
      
      alert("Member added successfully!");
    } catch (error) {
      console.error('Error adding member:', error);
      alert("Failed to add member. Please try again.");
    }
  };

  const viewGroupDetails = (group: Group) => {
    setSelectedGroupForDisplay(group);
  };

  return (
    <div className="admin-panel">
      <h2 className="text-2xl font-semibold mb-4">Admin Panel</h2>
      
      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button 
          className={`py-2 px-4 mr-2 ${activeTab === 'groups' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Manage Groups
        </button>
        <button 
          className={`py-2 px-6 ${activeTab === 'members' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Add Members
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'groups' ? (
        <div>
          {/* Create Group Section */}
          <div className="mb-6 p-4 border rounded bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Create New Group</h3>
            <div className="flex gap-8">
              <Input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                label="New Group Name"
              />
              <Button
                onClick={createGroup}
                variant="secondary"
                className="w-40  self-end"
              >
                Create Group
              </Button>
            </div>
          </div>
          
          {/* Group List Section */}
          <div className="mb-6 p-4 border rounded bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Your Groups</h3>
            {groups.length === 0 ? (
              <p className="text-gray-500">No groups created yet.</p>
            ) : (
              <ul className="divide-y">
                {groups.map((group) => (
                  <li key={group._id} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{group.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({group.members.length} members)
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => viewGroupDetails(group)} 
                        variant="secondary"
                      >
                        View Members
                      </Button>
                      <Button 
                        onClick={() => {
                          setSelectedGroupId(group._id);
                          setActiveTab('members');
                        }} 
                        variant="secondary"
                      >
                        Add Members
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Group Details Modal */}
          {selectedGroupForDisplay && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">{selectedGroupForDisplay.name} - Members</h3>
                <div className="max-h-60 overflow-y-auto">
                  {selectedGroupForDisplay.members.length === 0 ? (
                    <p className="text-gray-500">No members in this group yet.</p>
                  ) : (
                    <ul className="divide-y">
                      {selectedGroupForDisplay.members.map((member) => (
                        <li key={member._id} className="py-2">
                          {member.username} ({member.email})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={() => setSelectedGroupForDisplay(null)} 
                    variant="secondary"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 p-4 border rounded bg-gray-50">
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
            <Button 
              onClick={searchUsers} 
              variant="secondary"
              disabled={!selectedGroupId}
            >
              Search
            </Button>
          </div>
          {!selectedGroupId && (
            <p className="text-amber-600 text-sm mt-1">
              Please select a group first
            </p>
          )}
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
                    >
                      Add to Group
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;