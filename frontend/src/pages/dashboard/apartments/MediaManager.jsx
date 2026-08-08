import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apartmentsApi } from '../../../api/apartments.js';
import { extractErrorMessage } from '../../../api/client.js';

export function MediaManager({ apartmentId, media }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['apartment', 'admin', apartmentId] });
  }

  const uploadMutation = useMutation({
    mutationFn: (files) => apartmentsApi.uploadMedia(apartmentId, files),
    onSuccess: invalidate,
    onError: (err) => setError(extractErrorMessage(err, 'Upload failed.'))
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId) => apartmentsApi.deleteMedia(apartmentId, mediaId),
    onSuccess: invalidate
  });

  const featureMutation = useMutation({
    mutationFn: (mediaId) => apartmentsApi.updateMedia(apartmentId, mediaId, { isFeatured: true }),
    onSuccess: invalidate
  });

  function onFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError('');
    uploadMutation.mutate(files);
    e.target.value = '';
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg">Photos &amp; videos</h2>
        <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
          {uploadMutation.isPending ? 'Uploading…' : 'Upload media'}
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" className="hidden" onChange={onFilesSelected} />
      </div>

      {error && <p className="mt-2 text-sm text-status-danger">{error}</p>}

      {media.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No photos or videos uploaded yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {media.map((m) => (
            <div key={m.id} className={`relative overflow-hidden rounded-md border-2 ${m.isFeatured ? 'border-gold' : 'border-transparent'}`}>
              {m.type === 'image' ? (
                <img src={m.url} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <video src={m.url} className="aspect-square w-full object-cover" muted />
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-ink/70 p-1.5">
                {!m.isFeatured && (
                  <button type="button" onClick={() => featureMutation.mutate(m.id)} className="rounded bg-white/90 px-2 py-0.5 text-[11px] text-ink hover:bg-white">
                    Set cover
                  </button>
                )}
                {m.isFeatured && <span className="rounded bg-gold px-2 py-0.5 text-[11px] text-navy">Cover</span>}
                <button type="button" onClick={() => deleteMutation.mutate(m.id)} className="rounded bg-white/90 px-2 py-0.5 text-[11px] text-status-danger hover:bg-white">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
