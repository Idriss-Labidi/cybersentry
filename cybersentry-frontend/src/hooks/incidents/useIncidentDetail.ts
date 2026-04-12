import { useCallback, useEffect, useState } from 'react';
import { closeIncident, getIncident, reopenIncident, type IncidentTicket } from '../../services/incidents';
import { getApiErrorMessage } from '../../utils/api-error';
import { notifyError, notifySuccess } from '../../utils/ui-notify';

export const useIncidentDetail = (incidentId: number) => {
  const [incident, setIncident] = useState<IncidentTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIncident = useCallback(async () => {
    if (!Number.isFinite(incidentId)) {
      setError('Invalid incident id.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getIncident(incidentId);
      setIncident(response.data);
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, [], 'Failed to load incident detail.'));
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    void loadIncident();
  }, [loadIncident]);

  const handleCloseIncident = async () => {
    if (!incident) {
      return;
    }

    setIsUpdatingStatus(true);
    setError(null);
    try {
      const response = await closeIncident(incident.id);
      setIncident(response.data);
      notifySuccess('Incident closed', `${response.data.title} was closed.`);
    } catch (updateError: unknown) {
      const message = getApiErrorMessage(updateError, ['status'], 'Failed to close incident.');
      setError(message);
      notifyError('Incident close failed', message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReopenIncident = async () => {
    if (!incident) {
      return;
    }

    setIsUpdatingStatus(true);
    setError(null);
    try {
      const response = await reopenIncident(incident.id);
      setIncident(response.data);
      notifySuccess('Incident reopened', `${response.data.title} is active again.`);
    } catch (updateError: unknown) {
      const message = getApiErrorMessage(updateError, ['status'], 'Failed to reopen incident.');
      setError(message);
      notifyError('Incident reopen failed', message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return {
    incident,
    isLoading,
    isUpdatingStatus,
    error,
    loadIncident,
    handleCloseIncident,
    handleReopenIncident,
  };
};
