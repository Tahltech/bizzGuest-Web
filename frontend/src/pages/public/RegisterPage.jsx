import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { extractErrorMessage } from '../../api/client.js';

export function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  async function onSubmit(values) {
    setServerError('');
    try {
      await registerUser(values);
      navigate('/account', { replace: true });
    } catch (err) {
      setServerError(extractErrorMessage(err, 'Could not create your account.'));
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-3xl">{t('auth.registerTitle')}</h1>
      <p className="mt-2 text-sm text-ink-soft">{t('auth.registerSub')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="fullName">{t('auth.fullName')}</label>
          <input id="fullName" className="input" {...register('fullName', { required: true, minLength: 2 })} />
          {errors.fullName && <p className="mt-1 text-xs text-status-danger">Enter your full name.</p>}
        </div>
        <div>
          <label className="label" htmlFor="email">{t('auth.email')}</label>
          <input id="email" type="email" className="input" {...register('email', { required: true })} />
          {errors.email && <p className="mt-1 text-xs text-status-danger">Enter a valid email address.</p>}
        </div>
        <div>
          <label className="label" htmlFor="phone">{t('auth.phone')}</label>
          <input id="phone" placeholder="6XXXXXXXX" className="input" {...register('phone')} />
        </div>
        <div>
          <label className="label" htmlFor="password">{t('auth.password')}</label>
          <input id="password" type="password" className="input" {...register('password', { required: true, minLength: 8 })} />
          {errors.password && <p className="mt-1 text-xs text-status-danger">Use at least 8 characters.</p>}
        </div>

        {serverError && <p className="text-sm text-status-danger">{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
          {isSubmitting ? 'Creating account…' : t('auth.submitRegister')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {t('auth.haveAccount')} <Link to="/login" className="text-brass hover:underline">{t('nav.login')}</Link>
      </p>
    </div>
  );
}
