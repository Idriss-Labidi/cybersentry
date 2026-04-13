import { useEffect, useMemo, useState } from 'react';
import {
  createIncident,
  deleteIncident,
  getIncidents,
  updateIncident,
  type IncidentPriority,
  type IncidentSlaState,
  type IncidentStatus,
  type IncidentTicket,
} from '../../services/incidents';
import { getApiErrorMessage } from '../../utils/api-error';
import { notifyError, notifySuccess } from '../../utils/ui-notify';
import { useAuth } from '../../context/auth/useAuth';
import {
  buildIncidentPayload,
  defaultIncidentForm,
  incidentToFormState,
  validateIncidentForm,
  type IncidentFormErrors,
  type IncidentFormState,
} from '../../utils/incidents/incidentForm';

export const useIncidents = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<IncidentTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<IncidentPriority | 'all'>('all');
  const [slaFilter, setSlaFilter] = useState<IncidentSlaState | 'all'>('all');
  const [filterByCurrentUser, setFilterByCurrentUser] = useState(true);

  const [form, setForm] = useState<IncidentFormState>(defaultIncidentForm);
  const [formErrors, setFormErrors] = useState<IncidentFormErrors>({});
  const [modalOpened, setModalOpened] = useState(false);
  const [editingIncidentId, setEditingIncidentId] = useState<number | null>(null);
  const [deleteModalIncident, setDeleteModalIncident] = useState<IncidentTicket | null>(null);

  const loadIncidents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getIncidents();
      setIncidents(response.data);
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, [], 'Failed to load incidents.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadIncidents();
  }, []);

  const metrics = useMemo(() => {
    const breached = incidents.filter((incident) => incident.sla_state === 'breached').length;
    const critical = incidents.filter((incident) => incident.priority === 'critical').length;
    const active = incidents.filter((incident) => !['resolved', 'closed'].includes(incident.status)).length;

    return [
      { label: 'Open incidents', value: String(active), hint: 'Not resolved or closed yet' },
      { label: 'Critical priority', value: String(critical), hint: 'Immediate analyst attention needed' },
      { label: 'SLA breached', value: String(breached), hint: 'Tickets that exceeded due date' },
    ];
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const currentUserId = user?.profile?.sub;

    return incidents.filter((incident) => {
      const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter;
      const matchesSla = slaFilter === 'all' || incident.sla_state === slaFilter;
      const matchesSearch =
        !normalizedSearch ||
        incident.title.toLowerCase().includes(normalizedSearch) ||
        incident.description.toLowerCase().includes(normalizedSearch) ||
        incident.category.toLowerCase().includes(normalizedSearch) ||
        incident.affected_asset.toLowerCase().includes(normalizedSearch);

      // Filter by current user if enabled
      const matchesUserFilter = !filterByCurrentUser || (
        (incident.created_by?.id != null && String(incident.created_by.id) === currentUserId) ||
        (incident.assigned_to?.id != null && String(incident.assigned_to.id) === currentUserId)
      );

      return matchesStatus && matchesPriority && matchesSla && matchesSearch && matchesUserFilter;
    });
  }, [filterByCurrentUser, incidents, priorityFilter, searchTerm, slaFilter, statusFilter, user?.profile?.sub]);

  const updateForm = <K extends keyof IncidentFormState>(field: K, value: IncidentFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'title' || field === 'due_at' || field === 'reporter_email') {
      setFormErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const openCreateModal = () => {
    setEditingIncidentId(null);
    setForm(defaultIncidentForm);
    setFormErrors({});
    setModalOpened(true);
  };

  const openEditModal = (incident: IncidentTicket) => {
    setEditingIncidentId(incident.id);
    setForm(incidentToFormState(incident));
    setFormErrors({});
    setModalOpened(true);
  };

  const closeEditorModal = () => {
    setModalOpened(false);
    setFormErrors({});
  };

  const handleSubmit = async () => {
    const errors = validateIncidentForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = buildIncidentPayload(form);
      if (editingIncidentId) {
        await updateIncident(editingIncidentId, payload);
        notifySuccess('Incident updated', `Changes to ${payload.title} were saved.`);
      } else {
        await createIncident(payload);
        notifySuccess('Incident created', `${payload.title} was added to the queue.`);
      }
      closeEditorModal();
      await loadIncidents();
    } catch (submitError: unknown) {
      const message = getApiErrorMessage(
        submitError,
        [
          'title',
          'short_code',
          'incident_type',
          'category',
          'subcategory',
          'affected_asset',
          'status',
          'priority',
          'severity',
          'impact',
          'urgency',
          'sla_policy',
          'due_at',
          'reporter_email',
          'environment',
          'tags',
          'assigned_to',
          'non_field_errors',
          'detail',
        ],
        'Failed to save incident ticket.'
      );
      setError(message);
      notifyError('Incident save failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDeleteIncident = (incident: IncidentTicket) => {
    setDeleteModalIncident(incident);
  };

  const confirmDeleteIncident = async () => {
    if (!deleteModalIncident) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteIncident(deleteModalIncident.id);
      notifySuccess('Incident deleted', `${deleteModalIncident.title} was removed.`);
      setDeleteModalIncident(null);
      await loadIncidents();
    } catch (deleteError: unknown) {
      const message = getApiErrorMessage(deleteError, [], 'Failed to delete incident ticket.');
      setError(message);
      notifyError('Incident deletion failed', message);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    incidents,
    filteredIncidents,
    metrics,
    isLoading,
    isSubmitting,
    isDeleting,
    error,
    searchTerm,
    statusFilter,
    priorityFilter,
    slaFilter,
    filterByCurrentUser,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    setSlaFilter,
    setFilterByCurrentUser,
    form,
    formErrors,
    modalOpened,
    editingIncidentId,
    deleteModalIncident,
    setDeleteModalIncident,
    updateForm,
    openCreateModal,
    openEditModal,
    closeEditorModal,
    handleSubmit,
    requestDeleteIncident,
    confirmDeleteIncident,
    loadIncidents,
  };
};

