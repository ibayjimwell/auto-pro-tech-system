// ─── In-memory store for service tracking data ───────────────────────────────
// Each appointment gets a "service session" with: inspection findings, tasks, products

const uid = () => Math.random().toString(36).slice(2, 10);
const delay = (ms = 80) => new Promise(r => setTimeout(r, ms));

// Default task templates per service type
const SERVICE_TASK_TEMPLATES = {
  'st-1': [ // Oil Change
    { title: 'Drain old engine oil', subtasks: ['Position drain pan', 'Remove drain plug', 'Wait for full drain'] },
    { title: 'Replace oil filter', subtasks: ['Remove old filter', 'Apply fresh oil to gasket', 'Install new filter'] },
    { title: 'Refill with new oil', subtasks: ['Add correct amount', 'Check oil level', 'Check for leaks'] },
    { title: 'Reset oil life indicator', subtasks: [] },
  ],
  'st-2': [ // Tire Rotation
    { title: 'Loosen lug nuts (all wheels)', subtasks: [] },
    { title: 'Lift vehicle on jack stands', subtasks: [] },
    { title: 'Rotate tires per pattern', subtasks: ['Front-to-rear swap', 'Check tire pressure', 'Inspect tread depth'] },
    { title: 'Torque lug nuts to spec', subtasks: [] },
  ],
  'st-3': [ // Brake Inspection
    { title: 'Remove wheels', subtasks: [] },
    { title: 'Inspect brake pads', subtasks: ['Measure pad thickness', 'Check for uneven wear', 'Inspect caliper pins'] },
    { title: 'Inspect rotors', subtasks: ['Measure rotor thickness', 'Check for scoring/warping'] },
    { title: 'Replace worn components', subtasks: [] },
    { title: 'Reinstall wheels and test', subtasks: ['Torque lugs', 'Pump brakes', 'Road test'] },
  ],
  'st-4': [ // A/C Service
    { title: 'Check refrigerant level', subtasks: [] },
    { title: 'Inspect for leaks', subtasks: ['UV dye test', 'Check hose connections', 'Check condenser'] },
    { title: 'Recharge refrigerant', subtasks: ['Evacuate system', 'Add correct refrigerant amount'] },
    { title: 'Test A/C performance', subtasks: ['Check vent temp', 'Verify compressor operation'] },
  ],
  'st-5': [ // Engine Tune-Up
    { title: 'Inspect and replace spark plugs', subtasks: ['Check gap', 'Remove old plugs', 'Install new plugs'] },
    { title: 'Replace air filter', subtasks: [] },
    { title: 'Replace fuel filter', subtasks: [] },
    { title: 'Check ignition wires', subtasks: [] },
    { title: 'Scan for fault codes', subtasks: ['Clear old codes', 'Verify no new codes'] },
    { title: 'Test drive and verify', subtasks: [] },
  ],
  'st-6': [ // Wheel Alignment
    { title: 'Mount vehicle on alignment rack', subtasks: [] },
    { title: 'Check and adjust caster', subtasks: [] },
    { title: 'Check and adjust camber', subtasks: [] },
    { title: 'Check and adjust toe', subtasks: [] },
    { title: 'Print alignment report', subtasks: [] },
  ],
  'st-7': [ // Battery Replacement
    { title: 'Test current battery', subtasks: ['Load test', 'Check voltage', 'Check terminals'] },
    { title: 'Remove old battery', subtasks: ['Disconnect negative first', 'Disconnect positive', 'Remove hold-down'] },
    { title: 'Install new battery', subtasks: ['Clean tray', 'Secure hold-down', 'Connect positive first', 'Connect negative'] },
    { title: 'Test electrical systems', subtasks: ['Check charging voltage', 'Verify accessories work'] },
  ],
  'st-8': [ // Transmission Service
    { title: 'Drain transmission fluid', subtasks: [] },
    { title: 'Remove and clean pan', subtasks: ['Inspect for metal debris', 'Clean magnet'] },
    { title: 'Replace transmission filter', subtasks: [] },
    { title: 'Reinstall pan with new gasket', subtasks: [] },
    { title: 'Refill with correct fluid', subtasks: ['Add fluid', 'Check level', 'Check for leaks'] },
    { title: 'Test drive and verify shifts', subtasks: [] },
  ],
};

// sessions: { [appointmentId]: ServiceSession }
let sessions = {};

export const serviceTrackingStore = {
  getSession: async (appointmentId, appointment) => {
    await delay();
    if (!sessions[appointmentId]) {
      // Create a new session with template tasks if available
      const templates = SERVICE_TASK_TEMPLATES[appointment?.serviceTypeId] || [];
      sessions[appointmentId] = {
        appointmentId,
        inspectionNotes: appointment?.notes || '',
        findings: [],
        tasks: templates.map(t => ({
          id: uid(),
          title: t.title,
          completed: false,
          subtasks: t.subtasks.map(s => ({ id: uid(), title: s, completed: false })),
          addedProducts: [],
          requiresApproval: false,
          approvalStatus: null, // null | 'PENDING' | 'APPROVED' | 'REJECTED'
          notes: '',
        })),
        products: [],
        additionalItems: [], // items added mid-service needing customer approval
        createdAt: new Date().toISOString(),
      };
    }
    return { ...sessions[appointmentId] };
  },

  updateSession: async (appointmentId, data) => {
    await delay();
    sessions[appointmentId] = { ...sessions[appointmentId], ...data };
    return { ...sessions[appointmentId] };
  },

  addTask: async (appointmentId, taskData) => {
    await delay();
    const task = {
      id: uid(),
      title: taskData.title,
      completed: false,
      subtasks: (taskData.subtasks || []).map(s => ({ id: uid(), title: s, completed: false })),
      addedProducts: [],
      requiresApproval: false,
      approvalStatus: null,
      notes: '',
    };
    sessions[appointmentId].tasks = [...(sessions[appointmentId].tasks || []), task];
    return task;
  },

  updateTask: async (appointmentId, taskId, data) => {
    await delay();
    sessions[appointmentId].tasks = sessions[appointmentId].tasks.map(t =>
      t.id === taskId ? { ...t, ...data } : t
    );
    return sessions[appointmentId].tasks.find(t => t.id === taskId);
  },

  deleteTask: async (appointmentId, taskId) => {
    await delay();
    sessions[appointmentId].tasks = sessions[appointmentId].tasks.filter(t => t.id !== taskId);
  },

  addSubtask: async (appointmentId, taskId, title) => {
    await delay();
    const subtask = { id: uid(), title, completed: false };
    sessions[appointmentId].tasks = sessions[appointmentId].tasks.map(t =>
      t.id === taskId ? { ...t, subtasks: [...t.subtasks, subtask] } : t
    );
    return subtask;
  },

  toggleSubtask: async (appointmentId, taskId, subtaskId) => {
    await delay();
    sessions[appointmentId].tasks = sessions[appointmentId].tasks.map(t =>
      t.id === taskId
        ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) }
        : t
    );
  },

  addAdditionalItem: async (appointmentId, item) => {
    await delay();
    const rec = { id: uid(), ...item, approvalStatus: 'PENDING', createdAt: new Date().toISOString() };
    sessions[appointmentId].additionalItems = [...(sessions[appointmentId].additionalItems || []), rec];
    return rec;
  },

  updateAdditionalItem: async (appointmentId, itemId, data) => {
    await delay();
    sessions[appointmentId].additionalItems = sessions[appointmentId].additionalItems.map(i =>
      i.id === itemId ? { ...i, ...data } : i
    );
  },
};