import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function HomePage() {
  const { t } = useTranslation();

  const whyItems = [
    { title: t('home.why1Title'), body: t('home.why1Body') },
    { title: t('home.why2Title'), body: t('home.why2Body') },
    { title: t('home.why3Title'), body: t('home.why3Body') }
  ];

  return (
    <div>
      <section className="border-b border-stone-line bg-ink text-stone">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Yaoundé, Cameroon</p>
          <h1 className="max-w-2xl text-4xl leading-tight md:text-6xl">{t('home.heroHeadline')}</h1>
          <p className="mt-6 max-w-xl text-lg text-stone/75">{t('home.heroSub')}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/apartments" className="btn-primary">{t('home.ctaBook')}</Link>
            <Link to="/apartments" className="inline-flex items-center justify-center gap-2 rounded-card border border-stone/30 px-5 py-2.5 text-sm font-medium text-stone transition hover:border-stone hover:bg-white/5">
              {t('home.ctaExplore')}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-10 text-3xl">{t('home.whyTitle')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {whyItems.map((item) => (
            <div key={item.title} className="card p-6">
              <h3 className="mb-2 text-xl">{item.title}</h3>
              <p className="text-sm text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
