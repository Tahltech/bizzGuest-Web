import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apartmentsApi, apartmentTypesApi, amenitiesApi } from '../../../api/apartments.js';
import { extractErrorMessage } from '../../../api/client.js';
import { MediaManager } from './MediaManager.jsx';

export function ApartmentFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState('');

  const { data: apartment } = useQuery({
    queryKey: ['apartment', 'admin', id],
    queryFn: () => apartmentsApi.detail(id),
    enabled: isEditing
  });

  const { data: types } = useQuery({ queryKey: ['apartment-types'], queryFn: apartmentTypesApi.list });
  const { data: amenities } = useQuery({ queryKey: ['amenities'], queryFn: amenitiesApi.list });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (apartment) {
      reset({
        apartmentTypeId: apartment.apartmentType?.id,
        code: apartment.code,
        name: apartment.name,
        description: apartment.description || '',
        priceNightMinor: apartment.pricing?.nightMinor,
        priceWeekMinor: apartment.pricing?.weekMinor || '',
        priceMonthMinor: apartment.pricing?.monthMinor || '',
        maxGuests: apartment.maxGuests,
        beds: apartment.beds,
        bathrooms: apartment.bathrooms,
        floor: apartment.floor || '',
        isFeatured: apartment.isFeatured,
        isActive: apartment.isActive,
        status: apartment.status,
        amenityIds: apartment.amenities?.map((a) => a.id) || []
      });
    }
  }, [apartment, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEditing ? apartmentsApi.update(id, payload) : apartmentsApi.create(payload)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'apartments'] });
      if (!isEditing) navigate(`/dashboard/apartments/${saved.id}`, { replace: true });
    }
  });

  function onSubmit(values) {
    setServerError('');
    const amenityIds = Array.isArray(values.amenityIds) ? values.amenityIds.map(Number) : values.amenityIds ? [Number(values.amenityIds)] : [];
    saveMutation.mutate(
      { ...values, amenityIds },
      { onError: (err) => setServerError(extractErrorMessage(err, 'Could not save this apartment.')) }
    );
  }

  return (
    <div className="max-w-3xl p-8">
      <h1 className="text-2xl">{isEditing ? `Edit ${apartment?.name || 'apartment'}` : 'New apartment'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="code">Code</label>
            <input id="code" className="input" {...register('code', { required: true })} />
            {errors.code && <p className="mt-1 text-xs text-status-danger">Required.</p>}
          </div>
          <div>
            <label className="label" htmlFor="apartmentTypeId">Type</label>
            <select id="apartmentTypeId" className="input" {...register('apartmentTypeId', { required: true })}>
              <option value="">Select a type…</option>
              {types?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" className="input" {...register('name', { required: true, minLength: 2 })} />
          {errors.name && <p className="mt-1 text-xs text-status-danger">Required.</p>}
        </div>

        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" rows={4} className="input" {...register('description')} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="priceNightMinor">Price / night (XAF)</label>
            <input id="priceNightMinor" type="number" className="input" {...register('priceNightMinor', { required: true, min: 0 })} />
          </div>
          <div>
            <label className="label" htmlFor="priceWeekMinor">Price / week (XAF)</label>
            <input id="priceWeekMinor" type="number" className="input" {...register('priceWeekMinor')} />
          </div>
          <div>
            <label className="label" htmlFor="priceMonthMinor">Price / month (XAF)</label>
            <input id="priceMonthMinor" type="number" className="input" {...register('priceMonthMinor')} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="maxGuests">Max guests</label>
            <input id="maxGuests" type="number" min="1" className="input" {...register('maxGuests', { required: true, min: 1 })} />
          </div>
          <div>
            <label className="label" htmlFor="beds">Beds</label>
            <input id="beds" type="number" min="1" className="input" {...register('beds', { required: true, min: 1 })} />
          </div>
          <div>
            <label className="label" htmlFor="bathrooms">Bathrooms</label>
            <input id="bathrooms" type="number" min="1" className="input" {...register('bathrooms', { required: true, min: 1 })} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="floor">Floor</label>
          <input id="floor" className="input" {...register('floor')} />
        </div>

        {amenities?.length > 0 && (
          <div>
            <span className="label">Amenities</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {amenities.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm text-ink-soft">
                  <input type="checkbox" value={a.id} {...register('amenityIds')} />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {isEditing && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" className="input" {...register('status')}>
                {['available', 'reserved', 'occupied', 'cleaning', 'maintenance', 'out_of_service'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-6 pb-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('isFeatured')} /> Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('isActive')} /> Published</label>
            </div>
          </div>
        )}

        {serverError && <p className="text-sm text-status-danger">{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
          {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create apartment'}
        </button>
      </form>

      {isEditing && apartment && (
        <div className="mt-10 border-t border-cream-line pt-8">
          <MediaManager apartmentId={id} media={apartment.media || []} />
        </div>
      )}
    </div>
  );
}
