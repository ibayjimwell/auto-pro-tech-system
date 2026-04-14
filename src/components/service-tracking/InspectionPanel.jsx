import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X, Save } from 'lucide-react';

export default function InspectionPanel({ session, onUpdate }) {
  const [notes, setNotes] = useState(session.inspectionNotes || '');
  const [findings, setFindings] = useState(session.findings || []);
  const [newFinding, setNewFinding] = useState('');
  const [dirty, setDirty] = useState(false);

  const addFinding = () => {
    if (!newFinding.trim()) return;
    const updated = [...findings, { id: Date.now().toString(), text: newFinding.trim(), severity: 'MEDIUM' }];
    setFindings(updated);
    setNewFinding('');
    setDirty(true);
  };

  const removeFinding = (id) => {
    const updated = findings.filter(f => f.id !== id);
    setFindings(updated);
    setDirty(true);
  };

  const cycleSeverity = (id) => {
    const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const updated = findings.map(f => {
      if (f.id !== id) return f;
      const next = order[(order.indexOf(f.severity) + 1) % order.length];
      return { ...f, severity: next };
    });
    setFindings(updated);
    setDirty(true);
  };

  const severityColor = (s) => ({
    LOW: 'bg-green-100 text-green-700 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  }[s] || '');

  const save = () => {
    onUpdate({ inspectionNotes: notes, findings });
    setDirty(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" /> Inspection Report
          </CardTitle>
          {dirty && (
            <Button size="sm" onClick={save} className="h-7 text-xs bg-primary hover:bg-primary/90">
              <Save className="w-3 h-3 mr-1" /> Save
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Inspection Notes</label>
          <Textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); setDirty(true); }}
            placeholder="Describe the car's condition, customer complaints, visual findings..."
            rows={3}
            className="text-sm resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Identified Issues / Findings ({findings.length})
          </label>
          <div className="space-y-2 mb-3">
            {findings.map(f => (
              <div key={f.id} className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg border border-border">
                <span className="flex-1 text-xs">{f.text}</span>
                <button
                  onClick={() => cycleSeverity(f.id)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border cursor-pointer ${severityColor(f.severity)}`}
                >
                  {f.severity}
                </button>
                <button onClick={() => removeFinding(f.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {findings.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-3">No findings added yet</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newFinding}
              onChange={e => setNewFinding(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFinding()}
              placeholder="e.g. Front brake pads worn below 3mm..."
              className="text-xs h-8"
            />
            <Button size="sm" onClick={addFinding} className="h-8 px-3 bg-primary hover:bg-primary/90 flex-shrink-0">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}