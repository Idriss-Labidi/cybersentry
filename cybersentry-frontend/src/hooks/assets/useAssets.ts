import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  createAsset,
  deleteAsset,
  getAssets,
  getAssetSummary,
  updateAsset,
  type Asset,
  type AssetPayload,
} from '../../services/assets';
import { getApiErrorMessage } from '../../utils/api-error';
import { notifyError, notifySuccess } from '../../utils/ui-notify';
import {
  assetTypeMeta,
  buildPayload,
  defaultFormState,
  emptySummary,
  type AssetFormErrors,
  type AssetFormState,
  type AssetsLocationState,
  validateForm,
} from '../../utils/assets/assetForm';

export function useAssets() {
  const location = useLocation();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalAsset, setDeleteModalAsset] = useState<Asset | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [form, setForm] = useState<AssetFormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<AssetFormErrors>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadAssets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [assetsResponse, summaryResponse] = await Promise.all([getAssets(), getAssetSummary()]);
      setAssets(assetsResponse.data);
      setSummary(summaryResponse.data);
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, [], 'Failed to load assets.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAssets();
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: 'Managed assets',
        value: String(summary.total_assets),
        hint: 'All authenticated assets in the current organization',
      },
      {
        label: 'High risk',
        value: String(summary.high_risk_assets),
        hint: 'Assets currently scored at 70/100 or above',
      },
      {
        label: 'Average baseline risk',
        value: `${summary.average_risk_score}/100`,
        hint: 'Average manual baseline across tracked assets',
      },
    ],
    [summary]
  );

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        !normalizedSearch ||
        asset.name.toLowerCase().includes(normalizedSearch) ||
        asset.value.toLowerCase().includes(normalizedSearch) ||
        asset.description.toLowerCase().includes(normalizedSearch) ||
        asset.tags.some((tag) => tag.name.toLowerCase().includes(normalizedSearch));

      const matchesType = typeFilter === 'all' || asset.asset_type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;

      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
  }, [assets, categoryFilter, searchTerm, statusFilter, typeFilter]);

  const updateForm = <K extends keyof AssetFormState>(field: K, value: AssetFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'name' || field === 'value' || field === 'risk_score') {
      setFormErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const closeEditorModal = () => {
    setModalOpened(false);
    setFormErrors({});
  };

  const openCreateModal = (prefill?: Partial<AssetPayload>) => {
    setEditingAssetId(null);
    setForm({
      name: prefill?.name ?? defaultFormState.name,
      asset_type: prefill?.asset_type ?? defaultFormState.asset_type,
      value: prefill?.value ?? defaultFormState.value,
      category: prefill?.category ?? defaultFormState.category,
      status: prefill?.status ?? defaultFormState.status,
      description: prefill?.description ?? defaultFormState.description,
      risk_score: prefill?.risk_score ?? defaultFormState.risk_score,
      tags: prefill?.tag_names ?? defaultFormState.tags,
    });
    setFormErrors({});
    setModalOpened(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAssetId(asset.id);
    setForm({
      name: asset.name,
      asset_type: asset.asset_type,
      value: asset.value,
      category: asset.category,
      status: asset.status,
      description: asset.description,
      risk_score: asset.risk_score,
      tags: asset.tags.map((tag) => tag.name),
    });
    setFormErrors({});
    setModalOpened(true);
  };

  const handleSubmit = async () => {
    const errors = validateForm(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = buildPayload(form);
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingAssetId) {
        await updateAsset(editingAssetId, payload);
        notifySuccess('Asset updated', `Changes to ${payload.name} were saved.`);
      } else {
        await createAsset(payload);
        notifySuccess('Asset created', `${payload.name} was added to the inventory.`);
      }

      closeEditorModal();
      setForm(defaultFormState);
      await loadAssets();
    } catch (submitError: unknown) {
      const message = getApiErrorMessage(
        submitError,
        ['name', 'value', 'risk_score', 'organization', 'non_field_errors'],
        'Failed to save asset.'
      );
      setError(message);
      notifyError('Asset save failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDeleteAsset = (asset: Asset) => {
    setDeleteModalAsset(asset);
  };

  const confirmDeleteAsset = async () => {
    if (!deleteModalAsset) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAsset(deleteModalAsset.id);
      notifySuccess('Asset deleted', `${deleteModalAsset.name} was removed from the inventory.`);
      setDeleteModalAsset(null);
      await loadAssets();
    } catch (deleteError: unknown) {
      const message = getApiErrorMessage(deleteError, [], 'Failed to delete asset.');
      setError(message);
      notifyError('Asset deletion failed', message);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const routeState = location.state as AssetsLocationState | null;
    if (!routeState?.prefillAsset) {
      return;
    }

    openCreateModal(routeState.prefillAsset);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  return {
    summary,
    metrics,
    filteredAssets,
    isLoading,
    isSubmitting,
    isDeleting,
    error,
    modalOpened,
    deleteModalAsset,
    editingAssetId,
    form,
    formErrors,
    assetTypeConfig: assetTypeMeta[form.asset_type],
    searchTerm,
    typeFilter,
    categoryFilter,
    statusFilter,
    setSearchTerm,
    setTypeFilter,
    setCategoryFilter,
    setStatusFilter,
    updateForm,
    openCreateModal,
    openEditModal,
    closeEditorModal,
    handleSubmit,
    requestDeleteAsset,
    confirmDeleteAsset,
    setDeleteModalAsset,
  };
}
