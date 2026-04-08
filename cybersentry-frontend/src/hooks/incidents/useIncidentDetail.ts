import { useCallback, useEffect, useState } from 'react';
import { closeIncident, getIncident, reopenIncident, type IncidentTicket } from '../../services/incidents';
import { getApiErrorMessage } from '../../utils/api-error';

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
    } catch (updateError: unknown) {
      setError(getApiErrorMessage(updateError, ['status'], 'Failed to close incident.'));
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
    } catch (updateError: unknown) {
      setError(getApiErrorMessage(updateError, ['status'], 'Failed to reopen incident.'));
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
