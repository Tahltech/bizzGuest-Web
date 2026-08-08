import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { extractErrorMessage } from '../../api/client.js';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  async function onSubmit(values) {
    setServerError('');
    try {
      await login(values);
      navigate(location.state?.from?.pathname || '/account', { replace: true });
    } catch (err) {
      setServerError(extractErrorMessage(err, 'Incorrect email or password.'));
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-3xl">{t('auth.loginTitle')}</h1>
      <p className="mt-2 text-sm text-ink-soft">{t('auth.loginSub')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="email">{t('auth.email')}</label>
          <input id="email" type="email" className="input" {...register('email', { required: true })} />
          {errors.email && <p className="mt-1 text-xs text-status-danger">Enter your email address.</p>}
        </div>
        <div>
          <label className="label" htmlFor="password">{t('auth.password')}</label>
          <input id="password" type="password" className="input" {...register('password', { required: true })} />
          {errors.password && <p className="mt-1 text-xs text-status-danger">Enter your password.</p>}
        </div>

        {serverError && <p className="text-sm text-status-danger">{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
          {isSubmitting ? 'Signing in…' : t('auth.submitLogin')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {t('auth.noAccount')} <Link to="/register" className="text-brass hover:underline">{t('nav.signup')}</Link>
      </p>
    </div>
  );
}
