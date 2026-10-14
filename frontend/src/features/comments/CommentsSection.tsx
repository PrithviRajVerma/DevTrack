import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react';
import { commentsApi } from '../../api/comments';
import { Comment } from '../../types/comment';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../../components/common/Avatar';

interface Props {
  issueId: number;
  isProjectOwner?: boolean;
}

export const CommentsSection: React.FC<Props> = ({ issueId, isProjectOwner = false }) => {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New comment input state
  const [newBody, setNewBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await commentsApi.getComments(issueId);
      setComments(data);
    } catch {
      setError('Failed to load comments.');
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await commentsApi.addComment(issueId, { body: newBody.trim() });
      setComments((prev) => [...prev, created]);
      setNewBody('');
    } catch {
      setError('Failed to post comment. Check project permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditBody('');
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editBody.trim() || isSavingEdit) return;

    setIsSavingEdit(true);
    setError(null);
    try {
      const updated = await commentsApi.updateComment(commentId, { body: editBody.trim() });
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
      setEditBody('');
    } catch {
      setError('Failed to update comment.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      setError('Failed to delete comment.');
    }
  };

  return (
    <div className="comments-container">
      {error && (
        <div className="alert alert-error mb-4" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Comment list */}
      <div className="comments-list space-y-3 mb-6">
        {isLoading ? (
          <div className="py-8 text-center text-secondary">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-secondary">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthor = currentUser?.id === comment.author.id;
            const canDelete = isAuthor || isProjectOwner;
            const isEditing = editingId === comment.id;

            return (
              <div key={comment.id} className="comment-card p-3 rounded border border-border bg-card">
                <div className="comment-header flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Avatar name={comment.author.name} email={comment.author.email} size="xs" />
                    <span className="font-semibold text-sm">{comment.author.name}</span>
                    <span className="text-xs text-secondary">
                      {new Date(comment.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-xs text-secondary italic">(edited)</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="comment-actions flex items-center space-x-1">
                      {isAuthor && (
                        <button
                          type="button"
                          className="btn-icon p-1 text-secondary hover:text-foreground"
                          title="Edit comment"
                          onClick={() => handleStartEdit(comment)}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          className="btn-icon p-1 text-secondary hover:text-destructive"
                          title="Delete comment"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="comment-edit-box">
                    <textarea
                      className="form-input form-textarea w-full text-sm mb-2"
                      rows={3}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={handleCancelEdit}
                        disabled={isSavingEdit}
                      >
                        <X size={14} className="mr-1" /> Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={isSavingEdit || !editBody.trim()}
                      >
                        <Check size={14} className="mr-1" /> {isSavingEdit ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="comment-body text-sm whitespace-pre-wrap">{comment.body}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleAddComment} className="comment-form border-t border-border pt-4">
        <label htmlFor="newCommentText" className="block text-xs font-medium text-secondary mb-1">
          Add a comment
        </label>
        <textarea
          id="newCommentText"
          className="form-input form-textarea w-full text-sm mb-2"
          rows={3}
          placeholder="Share progress or feedback..."
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-sm btn-primary"
            disabled={isSubmitting || !newBody.trim()}
          >
            <Send size={14} className="mr-1" />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
};
