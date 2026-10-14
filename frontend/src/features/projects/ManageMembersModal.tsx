import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, AlertCircle, Shield, User as UserIcon } from 'lucide-react';
import { addProjectMember, listProjectMembers, removeProjectMember } from '../../api/projects';
import { Project, ProjectMember, ProjectRole } from '../../types/project';
import { ApiException } from '../../api/client';

interface Props {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
  onMembersUpdated: () => void;
}

export const ManageMembersModal: React.FC<Props> = ({
  isOpen,
  project,
  onClose,
  onMembersUpdated,
}) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('MEMBER');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, project.id]);

  const loadMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listProjectMembers(project.id);
      setMembers(data);
    } catch (err: unknown) {
      if (err instanceof ApiException) setError(err.message);
      else setError('Failed to load project members.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    setIsAdding(true);
    try {
      await addProjectMember(project.id, {
        email: email.trim().toLowerCase(),
        role,
      });
      setEmail('');
      setRole('MEMBER');
      await loadMembers();
      onMembersUpdated();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add member.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }
    setError(null);
    try {
      await removeProjectMember(project.id, userId);
      await loadMembers();
      onMembersUpdated();
    } catch (err: unknown) {
      if (err instanceof ApiException) setError(err.message);
      else setError('Failed to remove member.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-md">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Project Members</h2>
            <p className="modal-subtitle">{project.name} ({project.projectKey})</p>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Member Form (OWNER only) */}
        {project.currentUserRole === 'OWNER' && (
          <form onSubmit={handleAddMember} className="add-member-form">
            <div className="add-member-fields">
              <input
                type="email"
                className="form-input"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isAdding}
                required
              />
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as ProjectRole)}
                disabled={isAdding}
              >
                <option value="MEMBER">Member</option>
                <option value="OWNER">Owner</option>
              </select>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isAdding}>
                <UserPlus size={16} /> {isAdding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}

        {/* Member List */}
        <div className="members-list-container">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner-sm"></div>
              <span>Loading members...</span>
            </div>
          ) : (
            <ul className="members-list">
              {members.map((member) => (
                <li key={member.id} className="member-item">
                  <div className="member-info">
                    <div className="member-avatar">
                      <UserIcon size={16} />
                    </div>
                    <div>
                      <div className="member-name">{member.user.name}</div>
                      <div className="member-email">{member.user.email}</div>
                    </div>
                  </div>

                  <div className="member-actions">
                    <span className={`badge ${member.role === 'OWNER' ? 'badge-primary' : 'badge-subtle'}`}>
                      {member.role === 'OWNER' && <Shield size={12} />}
                      {member.role}
                    </span>

                    {project.currentUserRole === 'OWNER' && member.user.id !== project.owner.id && (
                      <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        title="Remove member"
                        onClick={() => handleRemoveMember(member.user.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
