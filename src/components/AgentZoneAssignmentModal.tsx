import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, Radio, FormControlLabel, CircularProgress, Snackbar, Alert } from '@mui/material';

interface GeographicZone {
  id: string;
  name: string;
  description?: string;
}

interface ZoneAssignment {
  zone_id: string;
  is_primary: boolean;
}

interface AgentZoneAssignmentModalProps {
  agentId: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const AgentZoneAssignmentModal: React.FC<AgentZoneAssignmentModalProps> = ({ agentId, open, onClose, onSaved }) => {
  const [zones, setZones] = useState<GeographicZone[]>([]);
  const [assigned, setAssigned] = useState<ZoneAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Fetch all zones
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch('/api/settings/geographic-zones')
      .then(res => res.json())
      .then(data => {
        setZones(data || []);
        setLoading(false);
      })
      .catch(() => {
        setError('فشل تحميل المناطق');
        setLoading(false);
      });
  }, [open]);

  // Fetch agent's assigned zones
  useEffect(() => {
    if (!open || !agentId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/agents/${agentId}/zones`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAssigned(
            data
              .map((item: { geographic_zone?: GeographicZone; is_primary: boolean }) => ({
                zone_id: item.geographic_zone?.id,
                is_primary: item.is_primary,
              }))
              .filter((a): a is ZoneAssignment => typeof a.zone_id === 'string')
          );
        } else {
          setAssigned([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('فشل تحميل ربط المناطق');
        setLoading(false);
      });
  }, [open, agentId]);

  // Helpers
  const isZoneAssigned = (zoneId: string) => assigned.some(a => a.zone_id === zoneId);
  const getPrimaryZoneId = () => assigned.find(a => a.is_primary)?.zone_id;

  // Handlers
  const handleZoneCheck = (zoneId: string, checked: boolean) => {
    setAssigned(prev => {
      if (checked) {
        // Add as secondary if not present
        if (!prev.some(a => a.zone_id === zoneId)) {
          return [...prev, { zone_id: zoneId, is_primary: false }];
        }
        return prev;
      } else {
        // Remove assignment
        return prev.filter(a => a.zone_id !== zoneId);
      }
    });
  };

  const handlePrimaryChange = (zoneId: string) => {
    setAssigned(prev =>
      prev.map(a => ({ ...a, is_primary: a.zone_id === zoneId }))
    );
    // If not already assigned, add as assigned
    if (!assigned.some(a => a.zone_id === zoneId)) {
      setAssigned(prev => [...prev, { zone_id: zoneId, is_primary: true }]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await fetch(`/api/agents/${agentId}/zones`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assigned),
      }).then(async res => {
        if (!res.ok) {
          const err: { error?: string } = await res.json();
          throw new Error(err.error || 'فشل الحفظ');
        }
      });
      setSaving(false);
      setSnackbar({ open: true, message: 'تم الحفظ بنجاح', severity: 'success' });
      if (onSaved) onSaved();
      setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
        onClose();
      }, 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل الحفظ');
      setSaving(false);
      setSnackbar({ open: true, message: e instanceof Error ? e.message : 'فشل الحفظ', severity: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>تعيين المناطق الجغرافية للمندوب</DialogTitle>
      <DialogContent>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}><CircularProgress /></div>
        ) : error ? (
          <div style={{ color: 'red', margin: 8 }}>{error}</div>
        ) : (
          <>
            {zones.length === 0 ? (
              <div>لا توجد مناطق متاحة</div>
            ) : (
              <div>
                {zones.map(zone => (
                  <div key={zone.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <Checkbox
                      checked={isZoneAssigned(zone.id)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleZoneCheck(zone.id, e.target.checked)}
                      color="primary"
                    />
                    <span style={{ flex: 1 }}>{zone.name}</span>
                    <FormControlLabel
                      control={
                        <Radio
                          checked={getPrimaryZoneId() === zone.id}
                          onChange={() => handlePrimaryChange(zone.id)}
                          disabled={!isZoneAssigned(zone.id)}
                          color="secondary"
                        />
                      }
                      label="أساسي"
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={saving || loading}>
          {saving ? 'جارٍ الحفظ...' : 'حفظ'}
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default AgentZoneAssignmentModal; 