import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../api/axios';
import Seo from '../components/Seo';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import SectionHeading from '../components/ui/SectionHeading';
import { imageUrl } from '../utils/format';

export default function GalleryPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null); // { project, index }

  useEffect(() => {
    api.get('/projects').then(({ data }) => setProjects(data.projects || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const move = useCallback((step) => {
    setLightbox((cur) => {
      if (!cur) return cur;
      const total = cur.project.images.length;
      return { ...cur, index: (cur.index + step + total) % total };
    });
  }, []);

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowLeft') move(1);
      if (e.key === 'ArrowRight') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, move]);

  const categories = ['all', ...new Set(projects.map((p) => p.category).filter(Boolean))];
  const visible = filter === 'all' ? projects : projects.filter((p) => p.category === filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Seo title="معرض أعمالنا" description="شاهد مشاريع Wattar Chair المنفذة من كراسي ومجالس ومفروشات." />
      <SectionHeading title="معرض أعمالنا" subtitle="مشاريع حقيقية نفذناها لعملائنا" />

      {categories.length > 2 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <button key={c} type="button" onClick={() => setFilter(c)} className={`rounded-full px-4 py-2 text-sm font-medium ${filter === c ? 'bg-brand-700 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-200 dark:ring-stone-700'}`}>
              {c === 'all' ? 'الكل' : c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : visible.length === 0 ? (
        <EmptyState text="لم تُضف مشاريع للمعرض بعد." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <button key={project._id} type="button" onClick={() => setLightbox({ project, index: 0 })} className="group overflow-hidden rounded-3xl bg-white text-right shadow-soft dark:bg-stone-900">
              <div className="relative overflow-hidden">
                <img src={imageUrl(project.images?.[0])} alt={project.title} loading="lazy" className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
                {project.images.length > 1 && <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">{project.images.length} صور</span>}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-stone-900 dark:text-stone-100">{project.title}</h3>
                {project.description && <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">{project.description}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button type="button" aria-label="إغلاق" onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-white/15 p-3 text-white"><X size={22} /></button>
          {lightbox.project.images.length > 1 && (
            <>
              <button type="button" aria-label="السابق" onClick={(e) => { e.stopPropagation(); move(-1); }} className="absolute right-4 top-1/2 rounded-full bg-white/15 p-3 text-white"><ChevronRight size={24} /></button>
              <button type="button" aria-label="التالي" onClick={(e) => { e.stopPropagation(); move(1); }} className="absolute left-4 top-1/2 rounded-full bg-white/15 p-3 text-white"><ChevronLeft size={24} /></button>
            </>
          )}
          <figure className="max-h-full max-w-4xl text-center" onClick={(e) => e.stopPropagation()}>
            <img src={imageUrl(lightbox.project.images[lightbox.index])} alt={lightbox.project.title} className="mx-auto max-h-[80vh] rounded-2xl object-contain" />
            <figcaption className="mt-3 text-white">{lightbox.project.title}{lightbox.project.description ? ` — ${lightbox.project.description}` : ''}</figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
