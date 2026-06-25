import { useEffect, useState } from 'react';
import { Users, Plus, UserPlus, Trash2, Loader2, Crown } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function TeamCard({ team, currentUser, onDelete, onAddMember }) {
  const isOwner = team.owner_id === currentUser?.id;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Users size={18} className="text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">{team.name}</h3>
              {isOwner && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5">
                  <Crown size={10} /> Owner
                </span>
              )}
            </div>
            {team.description && (
              <p className="text-gray-500 text-xs mt-0.5">{team.description}</p>
            )}
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => onDelete(team.id, team.name)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete team"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
      <button
        onClick={() => onAddMember(team)}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-2"
      >
        <UserPlus size={13} /> Add member
      </button>
    </div>
  );
}

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create team form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Add member form
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [memberId, setMemberId] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [addingMember, setAddingMember] = useState(false);

  function fetchTeams() {
    api.get('/teams')
      .then((res) => setTeams(res.data))
      .catch(() => setError('Could not load teams.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchTeams(); }, []);

  async function createTeam(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/teams', { name: newName.trim(), description: newDesc.trim() || null });
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      fetchTeams();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create team.');
    } finally {
      setCreating(false);
    }
  }

  async function deleteTeam(id, name) {
    if (!confirm(`Delete team "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/teams/${id}`);
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete team.');
    }
  }

  async function addMember(e) {
    e.preventDefault();
    if (!memberId || !selectedTeam) return;
    setAddingMember(true);
    try {
      await api.post(`/teams/${selectedTeam.id}/members`, {
        user_id: parseInt(memberId),
        role: memberRole,
      });
      setSelectedTeam(null);
      setMemberId('');
      setMemberRole('member');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not add member.');
    } finally {
      setAddingMember(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-500 mt-1">Organise members into workspace teams.</p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> New team
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Create team form */}
      {showCreate && (
        <form onSubmit={createTeam} className="bg-white border border-indigo-200 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">New team</h3>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Team name"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Add member modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={addMember}
            className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl"
          >
            <h3 className="font-semibold text-gray-900">Add member to "{selectedTeam.name}"</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Enter user ID"
                type="number"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">Find user IDs in the Analytics page.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addingMember}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {addingMember && <Loader2 size={14} className="animate-spin" />}
                Add member
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No teams yet</p>
          <p className="text-sm">Create your first team above.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              currentUser={user}
              onDelete={deleteTeam}
              onAddMember={setSelectedTeam}
            />
          ))}
        </div>
      )}
    </div>
  );
}
