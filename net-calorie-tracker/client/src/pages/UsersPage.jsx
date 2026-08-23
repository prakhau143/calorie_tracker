import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { StatusPanel } from '../components/StatusPanel.jsx';

const emptyForm = { name: '', age: '', weightKg: '', heightCm: '', sex: 'male' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!(Number(form.age) > 0)) errors.age = 'Age must be a positive number.';
  if (!(Number(form.weightKg) > 0)) errors.weightKg = 'Weight must be a positive number.';
  if (!(Number(form.heightCm) > 0)) errors.heightCm = 'Height must be a positive number.';
  if (form.sex !== 'male' && form.sex !== 'female') errors.sex = 'Sex is required.';
  return errors;
}

export function UsersPage({ onSelectUser }) {
  const [status, setStatus] = useState('loading');
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  function fetchUsers(isCancelled = () => false) {
    return api
      .listUsers()
      .then((data) => {
        if (isCancelled()) return;
        setUsers(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!isCancelled()) setStatus('error');
      });
  }

  function reloadUsers() {
    setStatus('loading');
    return fetchUsers();
  }

  useEffect(() => {
    // Guard against a slow response resolving after unmount.
    let cancelled = false;
    fetchUsers(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.createUser({
        name: form.name.trim(),
        age: Number(form.age),
        weightKg: Number(form.weightKg),
        heightCm: Number(form.heightCm),
        sex: form.sex,
      });
      setForm(emptyForm);
      reloadUsers();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteUser(pendingDelete._id);
      setPendingDelete(null);
      reloadUsers();
    } catch (err) {
      // Without this the rejection was unhandled and the dialog silently
      // reopened, leaving the user with no idea the delete had failed.
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="users-page">
      <section className="glass-panel form-panel" aria-labelledby="create-user-heading">
        <h2 id="create-user-heading">Create User</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                className="input"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <span id="name-error" className="field-error">
                  {errors.name}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="age">Age (years)</label>
              <input
                id="age"
                className="input"
                type="number"
                min="1"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                aria-invalid={Boolean(errors.age)}
                aria-describedby={errors.age ? 'age-error' : undefined}
              />
              {errors.age && (
                <span id="age-error" className="field-error">
                  {errors.age}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="weightKg">Weight (kg)</label>
              <input
                id="weightKg"
                className="input"
                type="number"
                min="1"
                step="0.1"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                aria-invalid={Boolean(errors.weightKg)}
                aria-describedby={errors.weightKg ? 'weightKg-error' : undefined}
              />
              {errors.weightKg && (
                <span id="weightKg-error" className="field-error">
                  {errors.weightKg}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="heightCm">Height (cm)</label>
              <input
                id="heightCm"
                className="input"
                type="number"
                min="1"
                step="0.1"
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                aria-invalid={Boolean(errors.heightCm)}
                aria-describedby={errors.heightCm ? 'heightCm-error' : undefined}
              />
              {errors.heightCm && (
                <span id="heightCm-error" className="field-error">
                  {errors.heightCm}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="sex">Sex</label>
              <select
                id="sex"
                className="input"
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          {submitError && <p className="field-error">{submitError}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create User'}
          </button>
        </form>
      </section>

      <section className="glass-panel list-panel" aria-labelledby="users-heading">
        <h2 id="users-heading">Users</h2>
        {status === 'loading' && <StatusPanel kind="loading" message="Loading users…" />}
        {status === 'error' && <StatusPanel kind="error" message="Could not load users." />}
        {status === 'ready' && users.length === 0 && (
          <StatusPanel kind="empty" message="No users yet. Create your first profile to start tracking calories." />
        )}
        {status === 'ready' && users.length > 0 && (
          <>
            <div className="user-table-header user-table-columns eyebrow" aria-hidden="true">
              <span>User</span>
              <span>Age</span>
              <span>Weight</span>
              <span>Height</span>
              <span>Sex</span>
              <span>Actions</span>
            </div>
            <ul className="user-list">
              {users.map((user) => (
                <li key={user._id} className="user-row user-table-columns glass-panel glass-panel--strong">
                  <div className="user-row__cell user-row__cell--name">{user.name}</div>
                  <div className="user-row__cell mono">
                    <span className="user-row__cell-label eyebrow">Age</span>
                    {user.age}y
                  </div>
                  <div className="user-row__cell mono">
                    <span className="user-row__cell-label eyebrow">Weight</span>
                    {user.weightKg} kg
                  </div>
                  <div className="user-row__cell mono">
                    <span className="user-row__cell-label eyebrow">Height</span>
                    {user.heightCm} cm
                  </div>
                  <div className="user-row__cell mono">
                    <span className="user-row__cell-label eyebrow">Sex</span>
                    {user.sex === 'male' ? 'Male' : 'Female'}
                  </div>
                  <div className="user-row__actions">
                    <button type="button" className="btn btn-secondary" onClick={() => onSelectUser(user._id)}>
                      View Detail
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setPendingDelete(user)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this user?"
        description={
          deleteError
            ? `Could not delete this user: ${deleteError}`
            : "This will also remove the user's saved daily calorie logs."
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={confirmDelete}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
