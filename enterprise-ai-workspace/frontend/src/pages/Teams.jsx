import { useEffect, useState } from 'react';
import {
  Crown,
  Loader2,
  Plus,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import api from '../api/client';

function RoleBadge({ role }) {
  const owner = role === 'owner';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
      owner
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-slate-200 bg-slate-50 text-slate-600'
    }`}>
      {owner ? <Crown size={12} /> : <Shield size={12} />}
      {role}
    </span>
  );
}

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [addingMember, setAddingMember] = useState(false);

  async function fetchTeams(selectTeamId = selectedTeam?.id) {
    setLoadingTeams(true);
    setError('');
    try {
      const res = await api.get('/api/teams');
      setTeams(res.data);
      const nextTeam = selectTeamId
        ? res.data.find((team) => team.id === selectTeamId)
        : res.data[0];
      if (nextTeam) {
        await fetchTeamDetails(nextTeam.id);
      } else {
        setSelectedTeam(null);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load teams.');
    } finally {
      setLoadingTeams(false);
    }
  }

  async function fetchTeamDetails(teamId) {
    setLoadingDetails(true);
    setError('');
    try {
      const res = await api.get(`/api/teams/${teamId}`);
      setSelectedTeam(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load team details.');
    } finally {
      setLoadingDetails(false);
    }
  }

  useEffect(() => {
    fetchTeams(null);
  }, []);

  async function createTeam(e) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setError('');
    try {
      const res = await api.post('/api/teams', {
        name: newName.trim(),
        description: newDesc.trim() || null,
      });
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      await fetchTeams(res.data.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create team.');
    } finally {
      setCreating(false);
    }
  }

  async function deleteTeam(team) {
    if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;

    setError('');
    try {
      await api.delete(`/api/teams/${team.id}`);
      const remaining = teams.filter((item) => item.id !== team.id);
      setTeams(remaining);
      if (remaining.length) {
        await fetchTeamDetails(remaining[0].id);
      } else {
        setSelectedTeam(null);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete team.');
    }
  }

  async function addMember(e) {
    e.preventDefault();
    if (!memberEmail.trim() || !selectedTeam) return;

    setAddingMember(true);
    setError('');
    try {
      await api.post(`/api/teams/${selectedTeam.id}/members`, {
        email: memberEmail.trim(),
        role: memberRole,
      });
      setMemberEmail('');
      setMemberRole('member');
      await fetchTeams(selectedTeam.id);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'User is already a member') {
        setMemberEmail('');
        setMemberRole('member');
        await fetchTeams(selectedTeam.id);
      } else {
        setError(detail || 'Could not add member.');
      }
    } finally {
      setAddingMember(false);
    }
  }

  async function removeMember(member) {
    if (!selectedTeam || !confirm(`Remove ${member.email} from "${selectedTeam.name}"?`)) return;

    setError('');
    try {
      await api.delete(`/api/teams/${selectedTeam.id}/members/${member.user_id}`);
      await fetchTeams(selectedTeam.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not remove member.');
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-500 mt-1">Manage workspace groups and member access.</p>
        </div>
        <button
          onClick={() => setShowCreate((value) => !value)}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          New team
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {showCreate && (
        <form onSubmit={createTeam} className="bg-white border border-indigo-200 rounded-lg p-5 mb-6">
          <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {creating && <Loader2 size={15} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My teams</h2>
            {loadingTeams && <Loader2 size={16} className="text-gray-400 animate-spin" />}
          </div>

          {teams.length === 0 && !loadingTeams ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={36} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No teams yet</p>
              <p className="text-sm">Create a team to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => fetchTeamDetails(team.id)}
                  className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors ${
                    selectedTeam?.id === team.id ? 'bg-indigo-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{team.name}</p>
                      {team.description && (
                        <p className="text-sm text-gray-500 truncate mt-0.5">{team.description}</p>
                      )}
                    </div>
                    {team.is_owner && <Crown size={16} className="text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-lg min-h-[420px]">
          {!selectedTeam ? (
            <div className="h-full min-h-[420px] flex items-center justify-center text-center text-gray-400">
              <div>
                <Users size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">Select a team</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-5 py-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedTeam.name}</h2>
                    <RoleBadge role={selectedTeam.my_role} />
                  </div>
                  {selectedTeam.description && (
                    <p className="text-gray-500 text-sm mt-1">{selectedTeam.description}</p>
                  )}
                </div>
                {selectedTeam.is_owner && (
                  <button
                    onClick={() => deleteTeam(selectedTeam)}
                    className="inline-flex items-center gap-2 text-red-600 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                )}
              </div>

              <div className="p-5">
                {(selectedTeam.is_owner || selectedTeam.my_role === 'admin') && (
                  <form onSubmit={addMember} className="grid gap-3 md:grid-cols-[1fr_150px_auto] md:items-end mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Member email</label>
                      <input
                        type="email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={addingMember}
                      className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {addingMember ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                      Add
                    </button>
                  </form>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Members</h3>
                    {loadingDetails && <Loader2 size={16} className="text-gray-400 animate-spin" />}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {selectedTeam.members?.map((member) => (
                      <div key={member.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{member.username}</p>
                          <p className="text-sm text-gray-500 truncate">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <RoleBadge role={member.role} />
                          {selectedTeam.is_owner && member.role !== 'owner' && (
                            <button
                              onClick={() => removeMember(member)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remove member"
                            >
                              <UserMinus size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
