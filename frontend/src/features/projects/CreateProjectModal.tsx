import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createProject } from '../../api/projects';
import { ApiException } from '../../api/client';
import { Project } from '../../types/project';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

export const CreateProjectModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedKey = projectKey.trim().toUpperCase();
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    if (!/^[A-Z0-9]{2,10}$/.test(trimmedKey)) {
      setError('Project key must be 2-10 uppercase alphanumeric characters (e.g. DEV, WEB, API).');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createProject({
        name: name.trim(),
        projectKey: trimmedKey,
        description: description.trim() || undefined,
      });
      setName('');
      setProjectKey('');
      setDescription('');
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create project.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Create New Project</h2>
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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="projectName">Project Name *</label>
            <input
              id="projectName"
              type="text"
              className="form-input"
              placeholder="e.g. Web Platform"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Auto-suggest project key from name if key is empty
                if (!projectKey && e.target.value.trim().length >= 2) {
                  const suggested = e.target.value
                    .trim()
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .substring(0, 4)
                    .toUpperCase();
                  if (suggested.length >= 2) setProjectKey(suggested);
                }
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="projectKey">Project Key *</label>
            <input
              id="projectKey"
              type="text"
              className="form-input font-mono"
              placeholder="e.g. WEB"
              maxLength={10}
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
              required
            />
            <span className="form-help">2-10 uppercase letters or numbers used as issue prefix (e.g. WEB-1).</span>
          </div>

          <div className="form-group">
            <label htmlFor="projectDesc">Description (Optional)</label>
            <textarea
              id="projectDesc"
              className="form-input form-textarea"
              rows={3}
              placeholder="Brief summary of the project goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
