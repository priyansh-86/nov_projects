import React, { useState, useEffect } from 'react';
import { 
  Users, Scissors, ClipboardList, Plus, Trash2, FileText, TrendingDown, 
  Edit2, Check, X, PlusCircle, CalendarDays, Settings, Download, Upload, 
  Save, Printer 
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- INITIAL DATA ---
const INITIAL_STYLES = [
  {
    id: 1,
    name: "Contract No: 06136-37-38-39",
    rates: [
      { name: "COLLAR M", rate: 4.20 },
      { name: "COLLAR ATT", rate: 2.50 },
      { name: "F PATTI", rate: 6.00 },
      { name: "KKP", rate: 1.70 },
      { name: "MUNDA O/L", rate: 1.50 },
      { name: "SLEEV BOTTAM", rate: 1.50 },
      { name: "GHERA 1 O/L", rate: 1.10 },
      { name: "TOTAL", rate: 34.35 }
    ]
  },
  {
    id: 2,
    name: "Style No: 6474 (LADIES SHIRT)",
    rates: [
      { name: "COLLAR M", rate: 4.20 },
      { name: "COLLAR ATT", rate: 2.50 },
      { name: "FRONT PATTI", rate: 2.50 },
      { name: "CUFF M/ATT", rate: 4.00 },
      { name: "TOTAL", rate: 23.20 }
    ]
  }
];

const App = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState(() => JSON.parse(localStorage.getItem('gpms_employees')) || []);
  const [styles, setStyles] = useState(() => JSON.parse(localStorage.getItem('gpms_styles')) || INITIAL_STYLES);
  const [workLogs, setWorkLogs] = useState(() => JSON.parse(localStorage.getItem('gpms_workLogs')) || []);
  const [advances, setAdvances] = useState(() => JSON.parse(localStorage.getItem('gpms_advances')) || []);

  // Form States
  const [selectedEmp, setSelectedEmp] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [pieces, setPieces] = useState('');
  const [workMonth, setWorkMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [advEmp, setAdvEmp] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  // Style Editing State
  const [editingRate, setEditingRate] = useState(null); 
  const [tempRateVal, setTempRateVal] = useState('');
  const [newStyleName, setNewStyleName] = useState('');
  const [newRateName, setNewRateName] = useState('');
  const [newRatePrice, setNewRatePrice] = useState('');
  const [activeStyleForAdd, setActiveStyleForAdd] = useState(null);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('gpms_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('gpms_styles', JSON.stringify(styles)); }, [styles]);
  useEffect(() => { localStorage.setItem('gpms_workLogs', JSON.stringify(workLogs)); }, [workLogs]);
  useEffect(() => { localStorage.setItem('gpms_advances', JSON.stringify(advances)); }, [advances]);

  // --- ACTIONS ---
  const addEmployee = (name) => {
    if (!name) return;
    setEmployees([...employees, { id: Date.now(), name }]);
  };

  const addWorkEntry = () => {
    if (!selectedEmp || !selectedStyle || !selectedComponent || !pieces) return;
    const styleObj = styles.find(s => s.id === parseInt(selectedStyle));
    const rateObj = styleObj.rates.find(r => r.name === selectedComponent);
    const amount = parseInt(pieces) * rateObj.rate;
    setWorkLogs([{ id: Date.now(), date: workMonth, empId: parseInt(selectedEmp), styleName: styleObj.name, component: selectedComponent, rate: rateObj.rate, pieces: parseInt(pieces), amount: amount }, ...workLogs]);
    setPieces('');
  };

  const addAdvance = () => {
    if (!advEmp || !advAmount) return;
    setAdvances([{ id: Date.now(), date: advDate, empId: parseInt(advEmp), amount: parseFloat(advAmount) }, ...advances]);
    setAdvAmount('');
  };

  // --- STYLE ACTIONS ---
  const addNewStyle = () => { if (!newStyleName) return; setStyles([...styles, { id: Date.now(), name: newStyleName, rates: [] }]); setNewStyleName(''); };
  const deleteStyle = (id) => { if(confirm('Delete this Contract?')) setStyles(styles.filter(s => s.id !== id)); };
  const updateRateValue = (styleId, rateIndex) => {
    setStyles(styles.map(s => s.id === styleId ? { ...s, rates: s.rates.map((r, i) => i === rateIndex ? { ...r, rate: parseFloat(tempRateVal) } : r) } : s));
    setEditingRate(null);
  };
  const addNewRateToStyle = (styleId) => {
    if (!newRateName || !newRatePrice) return;
    setStyles(styles.map(s => s.id === styleId ? { ...s, rates: [...s.rates, { name: newRateName, rate: parseFloat(newRatePrice) }] } : s));
    setNewRateName(''); setNewRatePrice(''); setActiveStyleForAdd(null);
  };
  const deleteRateFromStyle = (styleId, rateIndex) => {
    setStyles(styles.map(s => s.id === styleId ? { ...s, rates: s.rates.filter((_, i) => i !== rateIndex) } : s));
  };

  // --- REPORT & PDF ---
  const getSalaryReport = () => {
    return employees.map(emp => {
      const empLogs = workLogs.filter(log => log.empId === emp.id && log.date.startsWith(reportMonth));
      const empAdv = advances.filter(adv => adv.empId === emp.id && adv.date.startsWith(reportMonth));
      const totalWorkAmount = empLogs.reduce((sum, log) => sum + log.amount, 0);
      const totalAdvance = empAdv.reduce((sum, adv) => sum + adv.amount, 0);
      return { ...emp, totalPieces: empLogs.reduce((s, l) => s + l.pieces, 0), totalWorkAmount, totalAdvance, netSalary: totalWorkAmount - totalAdvance };
    });
  };

  const exportReportToPDF = () => {
    const doc = new jsPDF();
    const reportData = getSalaryReport();
    const monthName = new Date(reportMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

    doc.setFontSize(18); doc.text(`Salary Report - ${monthName}`, 14, 22);
    doc.setFontSize(11); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Employee Name", "Total Pieces", "Work Amount (Rs)", "Advance (Rs)", "Net Payable (Rs)"];
    const tableRows = reportData.map(item => [
      item.name, item.totalPieces, item.totalWorkAmount.toFixed(2), item.totalAdvance.toFixed(2), item.netSalary.toFixed(2)
    ]);

    doc.autoTable({
      head: [tableColumn], body: tableRows, startY: 40, theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    doc.save(`Salary_Report_${reportMonth}.pdf`);
  };

  // --- BACKUP/RESTORE ---
  const exportData = () => {
    const data = { employees, styles, workLogs, advances, backupDate: new Date().toISOString() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement('a'); link.href = url; link.download = `garment_data_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (confirm("Overwrite current data with backup?")) {
          if(data.employees) setEmployees(data.employees); if(data.styles) setStyles(data.styles);
          if(data.workLogs) setWorkLogs(data.workLogs); if(data.advances) setAdvances(data.advances);
          alert("Data restored successfully!");
        }
      } catch (err) { alert("Invalid backup file!"); }
    };
    reader.readAsText(file);
  };

  // --- UI COMPONENTS ---
  const GlassCard = ({ children, className = "" }) => (<div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6 ${className}`}>{children}</div>);
  const GlassInput = (props) => (<input {...props} className={`w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${props.className}`} />);
  const GlassSelect = (props) => (<select {...props} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:bg-slate-800">{props.children}</select>);
  const TabButton = ({ id, label, icon: Icon }) => (
    <button onClick={() => setActiveTab(id)} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${activeTab === id ? 'bg-blue-600/80 text-white shadow-lg shadow-blue-500/30 border border-blue-400/30' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-transparent'}`}>
      <Icon size={18} /><span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans selection:bg-blue-500/30 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent drop-shadow-sm">Production Manager</h1>
          <p className="text-gray-400 mt-1">Premium Garment Management System</p>
        </header>

        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <TabButton id="dashboard" label="Work Entry" icon={ClipboardList} />
          <TabButton id="employees" label="Employees" icon={Users} />
          <TabButton id="advances" label="Advances" icon={TrendingDown} />
          <TabButton id="reports" label="Salary Report" icon={FileText} />
          <TabButton id="styles" label="Manage Styles" icon={Scissors} />
          <TabButton id="settings" label="Data & Backup" icon={Settings} />
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="h-fit">
              <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-200"><PlusCircle className="mr-2" /> New Entry</h2>
              <div className="space-y-4">
                <div><label className="text-gray-400 text-xs ml-1 mb-1 block">Production Month</label><GlassInput type="month" value={workMonth} onChange={(e) => setWorkMonth(e.target.value)} /></div>
                <GlassSelect value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</GlassSelect>
                <GlassSelect value={selectedStyle} onChange={(e) => { setSelectedStyle(e.target.value); setSelectedComponent(''); }}><option value="">Select Style</option>{styles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</GlassSelect>
                {selectedStyle && (<GlassSelect value={selectedComponent} onChange={(e) => setSelectedComponent(e.target.value)}><option value="">Select Operation</option>{styles.find(s => s.id === parseInt(selectedStyle))?.rates.map((r, idx) => (<option key={idx} value={r.name}>{r.name} - ₹{r.rate.toFixed(2)}</option>))}</GlassSelect>)}
                <GlassInput type="number" placeholder="Pieces Made" value={pieces} onChange={(e) => setPieces(e.target.value)} />
                <button onClick={addWorkEntry} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2.5 rounded-lg shadow-lg shadow-blue-900/50 transition-all font-medium">Save Monthly Entry</button>
              </div>
            </GlassCard>
            <GlassCard className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-200">Recent Logs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 text-gray-200"><tr><th className="p-3">Month</th><th className="p-3">Employee</th><th className="p-3">Style</th><th className="p-3 text-right">Pcs</th><th className="p-3 text-right">Amount</th><th className="p-3 text-center">Action</th></tr></thead>
                  <tbody className="divide-y divide-white/10">{workLogs.length === 0 ? <tr><td colSpan="6" className="p-4 text-center opacity-50">No data</td></tr> : workLogs.slice(0, 10).map(log => (<tr key={log.id} className="hover:bg-white/5 transition"><td className="p-3 flex items-center gap-2"><CalendarDays size={14} className="text-blue-400"/>{log.date}</td><td className="p-3 text-white font-medium">{employees.find(e => e.id === log.empId)?.name}</td><td className="p-3 opacity-80">{log.styleName} - {log.component}</td><td className="p-3 text-right">{log.pieces}</td><td className="p-3 text-right text-green-400 font-semibold">₹{log.amount.toFixed(2)}</td><td className="p-3 text-center"><button onClick={() => setWorkLogs(workLogs.filter(l => l.id !== log.id))} className="text-red-400 hover:text-red-300 hover:bg-red-400/20 p-1 rounded"><Trash2 size={16} /></button></td></tr>))}</tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'styles' && (
          <div className="space-y-6">
            <GlassCard><div className="flex gap-4 justify-center"><GlassInput placeholder="Enter New Style / Contract Name" value={newStyleName} onChange={(e) => setNewStyleName(e.target.value)} className="max-w-md" /><button onClick={addNewStyle} className="bg-green-600/80 hover:bg-green-600 text-white px-6 rounded-lg whitespace-nowrap transition-all">+ Add Style</button></div></GlassCard>
            <div className="grid gap-6">{styles.map(style => (<GlassCard key={style.id} className="relative overflow-hidden"><div className="flex justify-between items-start mb-4 border-b border-white/10 pb-4"><h3 className="font-bold text-xl text-indigo-300">{style.name}</h3><button onClick={() => deleteStyle(style.id)} className="text-red-400 text-xs hover:bg-red-500/20 px-2 py-1 rounded transition">Delete Style</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{style.rates.map((r, idx) => (<div key={idx} className="bg-black/20 p-3 rounded-lg flex justify-between items-center group"><span className="text-gray-300 text-sm">{r.name}</span><div className="flex items-center gap-3">{editingRate?.styleId === style.id && editingRate?.rateIndex === idx ? (<div className="flex items-center gap-1"><input type="number" value={tempRateVal} onChange={(e) => setTempRateVal(e.target.value)} className="w-20 bg-black/40 border border-blue-500 rounded px-1 py-0.5 text-right text-sm text-white" autoFocus /><button onClick={() => updateRateValue(style.id, idx)} className="text-green-400"><Check size={16}/></button><button onClick={() => setEditingRate(null)} className="text-gray-400"><X size={16}/></button></div>) : (<><span className="font-semibold text-green-400">₹{r.rate.toFixed(2)}</span><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingRate({ styleId: style.id, rateIndex: idx }); setTempRateVal(r.rate); }} className="text-blue-400 hover:text-blue-300"><Edit2 size={14} /></button><button onClick={() => deleteRateFromStyle(style.id, idx)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button></div></>)}</div></div>))}{activeStyleForAdd === style.id ? (<div className="bg-blue-900/20 border border-blue-500/30 p-2 rounded-lg flex gap-2 items-center"><input placeholder="Name" className="w-full bg-transparent border-b border-white/20 text-sm text-white focus:outline-none" value={newRateName} onChange={e => setNewRateName(e.target.value)} /><input placeholder="Rate" type="number" className="w-20 bg-transparent border-b border-white/20 text-sm text-white focus:outline-none" value={newRatePrice} onChange={e => setNewRatePrice(e.target.value)} /><button onClick={() => addNewRateToStyle(style.id)} className="text-green-400"><Check size={18}/></button><button onClick={() => setActiveStyleForAdd(null)} className="text-red-400"><X size={18}/></button></div>) : (<button onClick={() => setActiveStyleForAdd(style.id)} className="border-2 border-dashed border-white/10 text-gray-400 rounded-lg p-2 text-sm hover:border-white/30 hover:text-white transition flex justify-center items-center gap-1"><Plus size={16} /> Add Rate</button>)}</div></GlassCard>))}</div>
          </div>
        )}

        {(activeTab === 'employees' || activeTab === 'advances' || activeTab === 'reports') && (
          <div>
            {activeTab === 'employees' && (
              <GlassCard>
                <div className="flex gap-4 mb-6 justify-center"><GlassInput id="empName" placeholder="New Employee Name" className="max-w-md" /><button onClick={() => {const el = document.getElementById('empName'); addEmployee(el.value); el.value=''}} className="bg-green-600 hover:bg-green-500 text-white px-6 rounded-lg">Add</button></div>
                <div className="grid gap-2 max-w-2xl mx-auto">{employees.map(e => <div key={e.id} className="p-3 bg-white/5 rounded flex justify-between text-gray-300"><span>{e.name}</span><span className="opacity-50 text-xs">#{e.id}</span></div>)}</div>
              </GlassCard>
            )}
            {activeTab === 'advances' && (
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard><h2 className="text-lg font-bold text-red-300 mb-4">Add Advance</h2><div className="space-y-4"><GlassInput type="date" value={advDate} onChange={e => setAdvDate(e.target.value)} /><GlassSelect value={advEmp} onChange={e => setAdvEmp(e.target.value)}><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</GlassSelect><GlassInput type="number" placeholder="Amount" value={advAmount} onChange={e => setAdvAmount(e.target.value)} /><button onClick={addAdvance} className="w-full bg-red-600/80 hover:bg-red-500 text-white py-2 rounded-lg">Save</button></div></GlassCard>
                <GlassCard><h2 className="text-lg font-bold text-gray-300 mb-4">History</h2><div className="space-y-2 max-h-64 overflow-y-auto">{advances.map(a => (<div key={a.id} className="flex justify-between p-2 border-b border-white/10 text-sm"><span className="text-gray-400">{a.date} - {employees.find(e=>e.id===a.empId)?.name}</span><span className="text-red-400 font-mono">-₹{a.amount}</span></div>))}</div></GlassCard>
              </div>
            )}
            {activeTab === 'reports' && (
              <GlassCard>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <h2 className="text-2xl font-bold text-gray-200">Monthly Report</h2>
                  <div className="flex gap-2 items-center">
                    <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="bg-black/20 text-white border border-white/20 rounded p-2 focus:outline-none" />
                    <button onClick={exportReportToPDF} className="bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all" title="Download PDF"><Printer size={18} /><span className="hidden md:inline">Download PDF</span></button>
                  </div>
                </div>
                <div className="overflow-x-auto"><table className="w-full text-left text-gray-300"><thead className="bg-white/10 text-blue-200"><tr><th className="p-3">Name</th><th className="p-3 text-center">Pcs</th><th className="p-3 text-right">Work Amt</th><th className="p-3 text-right">Adv</th><th className="p-3 text-right">Net Pay</th></tr></thead><tbody className="divide-y divide-white/10">{getSalaryReport().map(d => (<tr key={d.id}><td className="p-3 font-medium text-white">{d.name}</td><td className="p-3 text-center"><span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">{d.totalPieces}</span></td><td className="p-3 text-right text-gray-300">₹{d.totalWorkAmount.toFixed(2)}</td><td className="p-3 text-right text-red-400">-₹{d.totalAdvance.toFixed(2)}</td><td className="p-3 text-right font-bold text-green-400 text-lg">₹{d.netSalary.toFixed(2)}</td></tr>))}</tbody></table></div>
              </GlassCard>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <GlassCard className="text-center"><h2 className="text-2xl font-bold text-gray-200 mb-2">Data Backup & Restore</h2><p className="text-gray-400 mb-8">Save your data to a file so you never lose it.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-xl hover:bg-blue-600/20 transition"><Download size={48} className="mx-auto text-blue-400 mb-4" /><h3 className="text-lg font-semibold text-blue-200 mb-2">Download Backup</h3><p className="text-xs text-gray-400 mb-4">Save all data to your computer.</p><button onClick={exportData} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2"><Save size={16} /> Export Data</button></div><div className="bg-green-600/10 border border-green-500/30 p-6 rounded-xl hover:bg-green-600/20 transition"><Upload size={48} className="mx-auto text-green-400 mb-4" /><h3 className="text-lg font-semibold text-green-200 mb-2">Restore Backup</h3><p className="text-xs text-gray-400 mb-4">Upload a previously saved backup file.</p><label className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2 cursor-pointer transition"><Upload size={16} /> Select File<input type="file" accept=".json" onChange={importData} className="hidden" /></label></div></div><div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left"><h4 className="text-red-300 font-bold mb-1 flex items-center gap-2"><Trash2 size={16}/> Danger Zone</h4><p className="text-sm text-gray-400 mb-3">Clear all data and start fresh.</p><button onClick={() => { if(confirm("DANGER: DELETE ALL DATA?")) { localStorage.clear(); window.location.reload(); }}} className="text-red-400 text-sm hover:underline">Reset Everything</button></div></GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;