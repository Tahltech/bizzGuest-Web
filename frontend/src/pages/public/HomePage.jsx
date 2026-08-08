import { useTranslation } from 'react-i18next';
import { SearchWidget } from '../../components/SearchWidget.jsx';

export function HomePage() {
  const { t } = useTranslation();

  const whyItems = [
    { title: t('home.why1Title'), body: t('home.why1Body') },
    { title: t('home.why2Title'), body: t('home.why2Body') },
    { title: t('home.why3Title'), body: t('home.why3Body') }
  ];

  return (
    <div>
      <section className="bg-navy pb-20 pt-24 text-cream md:pb-28 md:pt-32">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-gold">Yaoundé, Cameroon</p>
          <h1 className="max-w-2xl text-4xl leading-tight md:text-6xl">{t('home.heroHeadline')}</h1>
          <p className="mt-6 max-w-xl text-lg text-cream/75">{t('home.heroSub')}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6">
        <SearchWidget className="-mt-12 md:-mt-16" />
      </div>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-10 text-3xl">{t('home.whyTitle')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {whyItems.map((item) => (
            <div key={item.title} className="card p-6">
              <span className="mb-3 block h-0.5 w-8 bg-gold" />
              <h3 className="mb-2 text-xl">{item.title}</h3>
              <p className="text-sm text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
