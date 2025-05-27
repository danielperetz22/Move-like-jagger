import React, { useState } from 'react';
import Button from './ui/Button';

interface MemberProps {
  userId: string;
  groups: Group[];
}

interface Group {
  _id: string;
  name: string;
  members: { _id: string; username: string; email: string }[];
}

const Member: React.FC<MemberProps> = ({ userId, groups }) => {
  const [selectedGroupForDisplay, setSelectedGroupForDisplay] = useState<Group | null>(null);

  const viewGroupDetails = (group: Group) => {
    setSelectedGroupForDisplay(group);
  };

  const userGroups = groups.filter((group) => 
    group.members.some((member) => member._id === userId)
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your Groups</h2>
      {userGroups.length === 0 ? (
        <p className="text-gray-500">You are not a member of any groups yet.</p>
      ) : (
        <ul className="divide-y border rounded bg-white">
          {userGroups.map((group) => (
            <li key={group._id} className="p-4 hover:bg-gray-50">
              <div className="font-medium text-lg mb-2">{group.name}</div>
              <div className="text-sm text-gray-600">
                {group.members.length} members
              </div>
              <Button 
                onClick={() => viewGroupDetails(group)} 
                variant="secondary"
                className="mt-2"
              >
                View Members
              </Button>
            </li>
          ))}
        </ul>
      )}
      
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
  );
};

export default Member;