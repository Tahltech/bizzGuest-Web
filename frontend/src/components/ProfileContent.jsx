import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.js';
import { extractErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../utils/formatCurrency.js';

const ROLE_LABELS = {
  super_admin: 'Super Administrator',
  manager: 'Manager',
  receptionist: 'Receptionist',
  accountant: 'Accountant',
  housekeeper: 'Housekeeper',
  maintenance: 'Maintenance Staff',
  guest: 'Guest'
};

function PersonalInfoForm({ profile }) {
  const queryClient = useQueryClient();
  const { patchUser } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      fullName: profile.fullName,
      phone: profile.phone || '',
      country: profile.guestDetails.country || '',
      address: profile.guestDetails.address || '',
      idType: profile.guestDetails.idType || '',
      idNumber: '',
      emergencyContactName: profile.guestDetails.emergencyContactName || '',
      emergencyContactPhone: profile.guestDetails.emergencyContactPhone || ''
    }
  });

  async function onSubmit(values) {
    setError('');
    setSuccess(false);
    try {
      const updated = await authApi.updateProfile(values);
      patchUser({ fullName: updated.fullName });
      queryClient.setQueryData(['my-profile'], updated);
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save your profile.'));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6" noValidate>
      <h2 className="text-lg">Personal information</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="fullName">Full name</label>
          <input id="fullName" className="input" {...register('fullName', { required: true, minLength: 2 })} />
          {errors.fullName && <p className="mt-1 text-xs text-status-danger">Enter your full name.</p>}
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input bg-cream-muted text-ink-soft" value={profile.email} disabled />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input id="phone" className="input" placeholder="6XXXXXXXX" {...register('phone')} />
        </div>
        <div>
          <label className="label">Roles</label>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {profile.roles.map((r) => (
              <span key={r} className="rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-medium text-navy">{ROLE_LABELS[r] || r}</span>
            ))}
          </div>
        </div>
      </div>

      <h3 className="mt-6 text-sm uppercase tracking-wide text-ink-soft">Guest details</h3>
      <p className="mt-1 text-xs text-ink-soft">Used for check-in and reservations — optional, but speeds up booking.</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="country">Country</label>
          <input id="country" className="input" {...register('country')} />
        </div>
        <div>
          <label className="label" htmlFor="address">Address</label>
          <input id="address" className="input" {...register('address')} />
        </div>
        <div>
          <label className="label" htmlFor="idType">ID type</label>
          <input id="idType" className="input" placeholder="e.g. National ID, Passport" {...register('idType')} />
        </div>
        <div>
          <label className="label" htmlFor="idNumber">ID number</label>
          <input
            id="idNumber"
            className="input"
            placeholder={profile.guestDetails.hasIdNumberOnFile ? '•••• on file — enter a new value to replace it' : 'Not on file'}
            {...register('idNumber')}
          />
        </div>
        <div>
          <label className="label" htmlFor="emergencyContactName">Emergency contact name</label>
          <input id="emergencyContactName" className="input" {...register('emergencyContactName')} />
        </div>
        <div>
          <label className="label" htmlFor="emergencyContactPhone">Emergency contact phone</label>
          <input id="emergencyContactPhone" className="input" placeholder="6XXXXXXXX" {...register('emergencyContactPhone')} />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-status-danger">{error}</p>}
      {success && <p className="mt-4 text-sm text-status-good">Profile saved.</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary mt-6 disabled:opacity-60">
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function ChangePasswordForm() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { applyAuthResult } = useAuth();
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();

  async function onSubmit(values) {
    setError('');
    setSuccess(false);
    try {
      const result = await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      applyAuthResult(result);
      reset();
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not change your password.'));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card mt-6 p-6" noValidate>
      <h2 className="text-lg">Change password</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" type="password" className="input" {...register('currentPassword', { required: true })} />
        </div>
        <div>
          <label className="label" htmlFor="newPassword">New password</label>
          <input id="newPassword" type="password" className="input" {...register('newPassword', { required: true, minLength: 8 })} />
          {errors.newPassword && <p className="mt-1 text-xs text-status-danger">At least 8 characters.</p>}
        </div>
        <div>
          <label className="label" htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            className="input"
            {...register('confirmPassword', { required: true, validate: (v) => v === watch('newPassword') || 'Passwords do not match.' })}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-status-danger">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-status-danger">{error}</p>}
      {success && <p className="mt-4 text-sm text-status-good">Password changed. Your other sessions have been signed out.</p>}

      <button type="submit" disabled={isSubmitting} className="btn-secondary mt-6 disabled:opacity-60">
        {isSubmitting ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}

function DeleteAccountSection() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => authApi.deleteAccount({ password, confirmation }),
    onSuccess: async () => {
      await logout();
      navigate('/', { replace: true });
    },
    onError: (err) => setError(extractErrorMessage(err, 'Could not delete this account.'))
  });

  return (
    <div className="card mt-6 border-status-danger/40 p-6">
      <h2 className="text-lg text-status-danger">Danger zone</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Deleting your account deactivates it immediately and signs you out everywhere. Booking and payment history is kept for records, not erased.
      </p>

      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-secondary mt-4 !border-status-danger !text-status-danger hover:!bg-status-danger hover:!text-white">
          Delete this account
        </button>
      ) : (
        <div className="mt-4 max-w-sm space-y-3">
          <div>
            <label className="label" htmlFor="deletePassword">Confirm your password</label>
            <input id="deletePassword" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="deleteConfirm">Type DELETE to confirm</label>
            <input id="deleteConfirm" className="input" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          </div>
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setError(''); mutation.mutate(); }}
              disabled={mutation.isPending}
              className="btn-primary !bg-status-danger hover:!bg-status-danger/90 disabled:opacity-60"
            >
              {mutation.isPending ? 'Deleting…' : 'Permanently delete'}
            </button>
            <button onClick={() => { setOpen(false); setError(''); setPassword(''); setConfirmation(''); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfileContent() {
  const { data: profile, isLoading } = useQuery({ queryKey: ['my-profile'], queryFn: authApi.getProfile });

  if (isLoading || !profile) {
    return <div className="h-96 animate-pulse rounded-card bg-cream-line/40" />;
  }

  return (
    <div>
      <h1 className="text-2xl">Profile</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Member since {formatDate(profile.createdAt)}{profile.lastLoginAt ? ` · last signed in ${formatDate(profile.lastLoginAt)}` : ''}
      </p>

      <div className="mt-6">
        <PersonalInfoForm profile={profile} />
        <ChangePasswordForm />
        {profile.isSuperAdmin && <DeleteAccountSection />}
      </div>
    </div>
  );
}
