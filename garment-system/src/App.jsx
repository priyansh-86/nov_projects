import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Scissors, ClipboardList, Plus, Trash2, FileText, TrendingDown, 
  Edit2, Check, X, PlusCircle, CalendarDays, Settings, Download, Upload, 
  Save, Printer, Cloud, LogIn, LogOut, ChevronDown, ChevronUp
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { auth, googleProvider, db } from './firebase'; 
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// --- IMPORT DATA FROM SEPARATE FILE ---
import { INITIAL_STYLES } from './garmentData'; 

// --- HELPER FUNCTIONS ---
const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

const mergeStylesWithInitial = (currentStyles) => {
  const merged = [...currentStyles];
  INITIAL_STYLES.forEach(initStyle => {
    const exists = merged.some(s => s.name.toLowerCase() === initStyle.name.toLowerCase());
    if (!exists) {
      merged.push({ ...initStyle, id: Date.now() + Math.random() });
    }
  });
  return merged;
};

// --- HELPER COMPONENTS ---
const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6 ${className}`}>
    {children}
  </div>
);

const GlassInput = React.forwardRef(({ className = "", ...props }, ref) => (
  <input 
    ref={ref}
    {...props} 
    className={`w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 select-text capitalize ${className}`} 
  />
));

const GlassSelect = React.forwardRef(({ children, ...props }, ref) => (
  <select 
    ref={ref}
    {...props} 
    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:bg-slate-800 select-text"
  >
    {children}
  </select>
));

// --- SEARCHABLE DROPDOWN ---
const SearchableDropdown = React.forwardRef(({ options, value, onChange, placeholder, onSelectionComplete, className = "" }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const selectedOption = options.find(opt => opt.id === value);
    if (selectedOption) {
      setSearchTerm(selectedOption.name);
    } else if (!value) {
      setSearchTerm('');
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        const selectedOption = options.find(opt => opt.id === value);
        setSearchTerm(selectedOption ? selectedOption.name : '');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value, options]);

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.id);
    setSearchTerm(option.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onSelectionComplete) onSelectionComplete();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const activeItem = listRef.current.children[highlightedIndex];
      if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      <input
        ref={ref}
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onClick={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          setSearchTerm(toTitleCase(e.target.value)); 
          setIsOpen(true);
          setHighlightedIndex(0);
          if (e.target.value === '') onChange('');
        }}
        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 select-text capitalize"
      />
      {isOpen && (
        <ul ref={listRef} className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl scrollbar-thin scrollbar-thumb-gray-600">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <li
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className={`px-4 py-2 cursor-pointer border-b border-white/5 last:border-0 capitalize transition-colors text-sm ${
                  index === highlightedIndex ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-blue-600/50'
                }`}
              >
                {opt.name}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-500 italic text-sm">No matches found</li>
          )}
        </ul>
      )}
    </div>
  );
});

const TabButton = ({ id, label, activeTab, setActiveTab, icon: Icon }) => (
  <button onClick={() => setActiveTab(id)} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${activeTab === id ? 'bg-blue-600/80 text-white shadow-lg shadow-blue-500/30 border border-blue-400/30' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-transparent'}`}>
    <Icon size={18} /><span>{label}</span>
  </button>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState(() => JSON.parse(localStorage.getItem('gpms_employees')) || []);
  const [styles, setStyles] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('gpms_styles'));
    return saved ? mergeStylesWithInitial(saved) : INITIAL_STYLES;
  });
  const [workLogs, setWorkLogs] = useState(() => JSON.parse(localStorage.getItem('gpms_workLogs')) || []);
  const [advances, setAdvances] = useState(() => JSON.parse(localStorage.getItem('gpms_advances')) || []);
  const [user, setUser] = useState(null); 

  // Report Expansion State
  const [expandedReportRow, setExpandedReportRow] = useState(null);

  const [selectedEmp, setSelectedEmp] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [pieces, setPieces] = useState('');
  const [workMonth, setWorkMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [advEmp, setAdvEmp] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newEmpName, setNewEmpName] = useState(''); 

  const [editingRate, setEditingRate] = useState(null); 
  const [tempRateVal, setTempRateVal] = useState('');
  const [newStyleName, setNewStyleName] = useState('');
  const [newRateName, setNewRateName] = useState('');
  const [newRatePrice, setNewRatePrice] = useState('');
  const [activeStyleForAdd, setActiveStyleForAdd] = useState(null);

  const ratePriceInputRef = useRef(null);
  const rateNameInputRef = useRef(null);
  const operationInputRef = useRef(null); 
  const piecesInputRef = useRef(null); 

  useEffect(() => { localStorage.setItem('gpms_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('gpms_styles', JSON.stringify(styles)); }, [styles]);
  useEffect(() => { localStorage.setItem('gpms_workLogs', JSON.stringify(workLogs)); }, [workLogs]);
  useEffect(() => { localStorage.setItem('gpms_advances', JSON.stringify(advances)); }, [advances]);

  useEffect(() => { const unsubscribe = auth.onAuthStateChanged((currentUser) => { setUser(currentUser); }); return () => unsubscribe(); }, []);

  const handleGoogleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (error) { alert("Login Failed: " + error.message); } };
  const handleLogout = async () => { await signOut(auth); };
  const uploadToCloud = async () => { if(!user) return alert("Login first!"); try { await setDoc(doc(db, "users", user.uid), { employees, styles, workLogs, advances, lastUpdated: new Date().toISOString() }); alert("✅ Uploaded!"); } catch (error) { alert("Failed: " + error.message); } };
  const downloadFromCloud = async () => {
    if(!user) return alert("Please login first!");
    if(!confirm("⚠️ Local data will be merged with Cloud data. Continue?")) return;
    try {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if(data.employees) setEmployees(data.employees);
        if(data.styles) setStyles(mergeStylesWithInitial(data.styles || []));
        if(data.workLogs) setWorkLogs(data.workLogs);
        if(data.advances) setAdvances(data.advances);
        alert("✅ Data Restored & Merged!");
      } else { alert("No Cloud data found."); }
    } catch (error) { alert("Download Failed: " + error.message); }
  };

  const handleEnterKey = (e, action) => { if (e.key === 'Enter') { e.preventDefault(); action(); } };
  const handleTextChange = (setter) => (e) => { setter(toTitleCase(e.target.value)); };

  const addEmployee = () => { if (!newEmpName.trim()) return; setEmployees([...employees, { id: Date.now(), name: newEmpName }]); setNewEmpName(''); };

  const addWorkEntry = () => {
    if (!selectedEmp || !selectedStyle || !selectedComponent || !pieces) return;
    const styleObj = styles.find(s => s.id === parseInt(selectedStyle));
    const rateObj = styleObj.rates.find(r => r.name === selectedComponent);
    const amount = parseInt(pieces) * rateObj.rate;
    
    setWorkLogs([{ id: Date.now(), date: workMonth, empId: parseInt(selectedEmp), styleName: styleObj.name, component: selectedComponent, rate: rateObj.rate, pieces: parseInt(pieces), amount: amount }, ...workLogs]);
    
    setPieces(''); 
    setSelectedComponent(''); 
    setTimeout(() => { if(operationInputRef.current) operationInputRef.current.focus(); }, 10);
  };

  const addAdvance = () => { if (!advEmp || !advAmount) return; setAdvances([{ id: Date.now(), date: advDate, empId: parseInt(advEmp), amount: parseFloat(advAmount) }, ...advances]); setAdvAmount(''); };
  const addNewStyle = () => { const cleanName = newStyleName.trim(); if (!cleanName) return; if (styles.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) { alert("⚠️ Style Exists!"); return; } setStyles([...styles, { id: Date.now(), name: cleanName, rates: [] }]); setNewStyleName(''); };
  const deleteStyle = (id) => { if(confirm('Delete?')) setStyles(styles.filter(s => s.id !== id)); };
  const updateRateValue = (styleId, rateIndex) => { setStyles(styles.map(s => s.id === styleId ? { ...s, rates: s.rates.map((r, i) => i === rateIndex ? { ...r, rate: parseFloat(tempRateVal) } : r) } : s)); setEditingRate(null); };
  const addNewRateToStyle = (styleId) => { if (!newRateName || newRatePrice === '') { alert("Enter Name"); return; } const currentStyle = styles.find(s => s.id === styleId); if (currentStyle.rates.some(r => r.name.toLowerCase() === newRateName.toLowerCase())) { alert("⚠️ Rate Exists!"); return; } setStyles(styles.map(s => s.id === styleId ? { ...s, rates: [...s.rates, { name: newRateName, rate: parseFloat(newRatePrice) }] } : s)); setNewRateName(''); setNewRatePrice(''); if(rateNameInputRef.current) rateNameInputRef.current.focus(); };
  const deleteRateFromStyle = (styleId, rateIndex) => { setStyles(styles.map(s => s.id === styleId ? { ...s, rates: s.rates.filter((_, i) => i !== rateIndex) } : s)); };

  const getSalaryReport = () => { return employees.map(emp => { const empLogs = workLogs.filter(log => log.empId === emp.id && log.date.startsWith(reportMonth)); const empAdv = advances.filter(adv => adv.empId === emp.id && adv.date.startsWith(reportMonth)); const totalWorkAmount = empLogs.reduce((sum, log) => sum + log.amount, 0); const totalAdvance = empAdv.reduce((sum, adv) => sum + adv.amount, 0); return { ...emp, totalPieces: empLogs.reduce((s, l) => s + l.pieces, 0), totalWorkAmount, totalAdvance, netSalary: totalWorkAmount - totalAdvance }; }); };
  const exportReportToPDF = () => { const doc = new jsPDF(); const reportData = getSalaryReport(); const monthName = new Date(reportMonth).toLocaleString('default', { month: 'long', year: 'numeric' }); doc.setFontSize(18); doc.text(`Salary Report - ${monthName}`, 14, 22); const tableRows = reportData.map(item => [item.name, item.totalPieces, item.totalWorkAmount.toFixed(2), item.totalAdvance.toFixed(2), item.netSalary.toFixed(2)]); autoTable(doc, { head: [["Name", "Pieces", "Work Amt", "Adv", "Net Pay"]], body: tableRows, startY: 40, theme: 'grid' }); doc.save(`Salary_${reportMonth}.pdf`); };
  const exportData = () => { const data = { employees, styles, workLogs, advances }; const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" })); const link = document.createElement('a'); link.href = url; link.download = `backup.json`; link.click(); };
  const importData = (e) => { const file = e.target.files[0]; const reader = new FileReader(); reader.onload = (ev) => { try { const data = JSON.parse(ev.target.result); if(confirm("Overwrite?")) { setEmployees(data.employees||[]); setStyles(mergeStylesWithInitial(data.styles||[])); setWorkLogs(data.workLogs||[]); setAdvances(data.advances||[]); } } catch(err) { alert("Error"); } }; if(file) reader.readAsText(file); };

  const operationOptions = selectedStyle ? styles.find(s => s.id === parseInt(selectedStyle))?.rates.map(r => ({ id: r.name, name: `${r.name} - ₹${r.rate.toFixed(2)}` })) || [] : [];

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans selection:bg-blue-500/30 flex flex-col items-center select-none">
      <div className="w-full max-w-6xl">
        <header className="mb-8 text-center"><h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">Production Manager</h1></header>
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {['dashboard', 'employees', 'advances', 'reports', 'styles', 'settings'].map(id => (
            <TabButton key={id} id={id} label={id.charAt(0).toUpperCase() + id.slice(1)} icon={ClipboardList} activeTab={activeTab} setActiveTab={setActiveTab} />
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="h-fit">
              <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-200"><PlusCircle className="mr-2" /> New Entry</h2>
              <div className="space-y-4">
                <div><label className="text-gray-400 text-xs ml-1 mb-1 block">Production Month</label><GlassInput type="month" value={workMonth} onChange={(e) => setWorkMonth(e.target.value)} /></div>
                
                <GlassSelect value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</GlassSelect>
                
                <SearchableDropdown options={styles} value={selectedStyle} onChange={(val) => { setSelectedStyle(val); setSelectedComponent(''); }} placeholder="Search Style..." />
                
                {selectedStyle && (
                  <SearchableDropdown
                    ref={operationInputRef}
                    options={operationOptions}
                    value={selectedComponent}
                    onChange={(val) => setSelectedComponent(val)}
                    onSelectionComplete={() => setTimeout(() => piecesInputRef.current?.focus(), 50)} 
                    placeholder="Search Operation..."
                  />
                )}
                
                <GlassInput 
                  ref={piecesInputRef} 
                  type="number" 
                  placeholder="Pieces Made" 
                  value={pieces} 
                  onChange={(e) => setPieces(e.target.value)}
                  onKeyDown={(e) => handleEnterKey(e, addWorkEntry)} 
                />
                <button onClick={addWorkEntry} className="w-full bg-blue-600 text-white py-2 rounded-lg">Save Entry</button>
              </div>
            </GlassCard>
            
            <GlassCard className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-200">Recent Logs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 text-gray-200">
                    <tr>
                      <th className="p-3">Month</th>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Style</th>
                      <th className="p-3 text-right">Pcs</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {workLogs.length === 0 ? (
                      <tr><td colSpan="6" className="p-4 text-center opacity-50">No data found</td></tr>
                    ) : (
                      workLogs.slice(0, 10).map(log => (
                        <tr key={log.id} className="hover:bg-white/5 transition">
                          <td className="p-3 flex items-center gap-2"><CalendarDays size={14} className="text-blue-400"/>{log.date}</td>
                          <td className="p-3 text-white font-medium">{employees.find(e => e.id === log.empId)?.name}</td>
                          <td className="p-3 opacity-80">{log.styleName} - {log.component}</td>
                          <td className="p-3 text-right">{log.pieces}</td>
                          <td className="p-3 text-right text-green-400 font-semibold">₹{log.amount.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => setWorkLogs(workLogs.filter(l => l.id !== log.id))} className="text-red-400 hover:text-red-300 hover:bg-red-400/20 p-1 rounded">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}

        {/* --- EMPLOYEES TAB --- */}
        {activeTab === 'employees' && (<GlassCard><div className="flex gap-4 mb-6 justify-center"><GlassInput value={newEmpName} onChange={handleTextChange(setNewEmpName)} onKeyDown={(e) => handleEnterKey(e, addEmployee)} placeholder="New Employee Name" className="max-w-md" /><button onClick={addEmployee} className="bg-green-600 hover:bg-green-500 text-white px-6 rounded-lg">Add</button></div><div className="grid gap-2 max-w-2xl mx-auto">{employees.map(e => <div key={e.id} className="p-3 bg-white/5 rounded flex justify-between text-gray-300"><span>{e.name}</span><span className="opacity-50 text-xs">#{e.id}</span></div>)}</div></GlassCard>)}
        {activeTab === 'advances' && (<div className="grid md:grid-cols-2 gap-6"><GlassCard><h2 className="text-lg font-bold text-red-300 mb-4">Add Advance</h2><div className="space-y-4"><GlassInput type="date" value={advDate} onChange={e => setAdvDate(e.target.value)} /><GlassSelect value={advEmp} onChange={e => setAdvEmp(e.target.value)}><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</GlassSelect><GlassInput type="number" placeholder="Amount" value={advAmount} onChange={e => setAdvAmount(e.target.value)} onKeyDown={(e) => handleEnterKey(e, addAdvance)} /><button onClick={addAdvance} className="w-full bg-red-600/80 hover:bg-red-500 text-white py-2 rounded-lg">Save</button></div></GlassCard><GlassCard><h2 className="text-lg font-bold text-gray-300 mb-4">History</h2><div className="space-y-2 max-h-64 overflow-y-auto">{advances.map(a => (<div key={a.id} className="flex justify-between p-2 border-b border-white/10 text-sm"><span className="text-gray-400">{a.date} - {employees.find(e=>e.id===a.empId)?.name}</span><span className="text-red-400 font-mono">-₹{a.amount}</span></div>))}</div></GlassCard></div>)}
        
        {/* --- SALARY REPORT TAB (UPDATED WITH DRILL DOWN) --- */}
        {activeTab === 'reports' && (
          <GlassCard>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-200">Monthly Report</h2>
              <div className="flex gap-2 items-center">
                <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="bg-black/20 text-white border border-white/20 rounded p-2 focus:outline-none" />
                <button onClick={exportReportToPDF} className="bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all" title="Download PDF"><Printer size={18} /><span className="hidden md:inline">Download PDF</span></button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-300 border-collapse">
                <thead className="bg-white/10 text-blue-200">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Name</th>
                    <th className="p-3 text-center">Total Pcs</th>
                    <th className="p-3 text-right">Work Amt</th>
                    <th className="p-3 text-right">Adv</th>
                    <th className="p-3 text-right rounded-tr-lg">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {getSalaryReport().map(d => (
                    <React.Fragment key={d.id}>
                      <tr 
                        onClick={() => setExpandedReportRow(expandedReportRow === d.id ? null : d.id)}
                        className={`cursor-pointer hover:bg-white/5 transition ${expandedReportRow === d.id ? 'bg-white/5' : ''}`}
                      >
                        <td className="p-3 font-medium text-white flex items-center gap-2">
                          {expandedReportRow === d.id ? <ChevronUp size={16} className="text-blue-400"/> : <ChevronDown size={16} className="text-gray-500"/>}
                          {d.name}
                        </td>
                        <td className="p-3 text-center"><span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">{d.totalPieces}</span></td>
                        <td className="p-3 text-right text-gray-300">₹{d.totalWorkAmount.toFixed(2)}</td>
                        <td className="p-3 text-right text-red-400">-₹{d.totalAdvance.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-green-400 text-lg">₹{d.netSalary.toFixed(2)}</td>
                      </tr>
                      
                      {/* --- EXPANDED DETAILS ROW --- */}
                      {expandedReportRow === d.id && (
                        <tr>
                          <td colSpan="5" className="p-0">
                            <div className="bg-slate-900/50 p-4 border-y border-white/10 inset-shadow">
                              <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Detailed Work Logs ({reportMonth})</h4>
                              <table className="w-full text-xs text-gray-400">
                                <thead className="border-b border-white/5 text-gray-500">
                                  <tr>
                                    <th className="py-1">Date</th>
                                    <th className="py-1">Style</th>
                                    <th className="py-1">Operation</th>
                                    <th className="py-1 text-right">Rate</th>
                                    <th className="py-1 text-right">Pcs</th>
                                    <th className="py-1 text-right">Amt</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {workLogs
                                    .filter(log => log.empId === d.id && log.date.startsWith(reportMonth))
                                    .map(log => (
                                      <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                                        <td className="py-1">{log.date}</td>
                                        <td className="py-1 text-blue-300">{log.styleName}</td>
                                        <td className="py-1 text-white">{log.component}</td>
                                        <td className="py-1 text-right">₹{log.rate}</td>
                                        <td className="py-1 text-right">{log.pieces}</td>
                                        <td className="py-1 text-right font-medium text-green-500">₹{log.amount.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* --- MANAGE STYLES TAB --- */}
        {activeTab === 'styles' && (<div className="space-y-6"><GlassCard><div className="flex gap-4 justify-center"><GlassInput value={newStyleName} onChange={handleTextChange(setNewStyleName)} onKeyDown={(e) => handleEnterKey(e, addNewStyle)} className="max-w-md" placeholder="Enter New Style / Contract Name" /><button onClick={addNewStyle} className="bg-green-600/80 hover:bg-green-600 text-white px-6 rounded-lg whitespace-nowrap transition-all">+ Add Style</button></div></GlassCard><div className="grid gap-6">{styles.map(style => (<GlassCard key={style.id} className="relative overflow-hidden"><div className="flex justify-between items-start mb-4 border-b border-white/10 pb-4"><h3 className="font-bold text-xl text-indigo-300">{style.name}</h3><button onClick={() => deleteStyle(style.id)} className="text-red-400 text-xs hover:bg-red-500/20 px-2 py-1 rounded transition">Delete Style</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{style.rates.map((r, idx) => (<div key={idx} className="bg-black/20 p-3 rounded-lg flex justify-between items-center group"><span className="text-gray-300 text-sm">{r.name}</span><div className="flex items-center gap-3">{editingRate?.styleId === style.id && editingRate?.rateIndex === idx ? (<div className="flex items-center gap-1"><input type="number" value={tempRateVal} onChange={(e) => setTempRateVal(e.target.value)} onKeyDown={(e) => handleEnterKey(e, () => updateRateValue(style.id, idx))} className="w-20 bg-black/40 border border-blue-500 rounded px-1 py-0.5 text-right text-sm text-white" autoFocus /><button onClick={() => updateRateValue(style.id, idx)} className="text-green-400"><Check size={16}/></button><button onClick={() => setEditingRate(null)} className="text-gray-400"><X size={16}/></button></div>) : (<><span className="font-semibold text-green-400">₹{r.rate.toFixed(2)}</span><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingRate({ styleId: style.id, rateIndex: idx }); setTempRateVal(r.rate); }} className="text-blue-400 hover:text-blue-300"><Edit2 size={14} /></button><button onClick={() => deleteRateFromStyle(style.id, idx)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button></div></>)}</div></div>))}{activeStyleForAdd === style.id ? (<div className="bg-blue-900/20 border border-blue-500/30 p-2 rounded-lg flex gap-2 items-center"><GlassInput ref={rateNameInputRef} placeholder="Name (Required)" className="w-full bg-transparent border-b border-white/20 text-sm text-white focus:outline-none" value={newRateName} onChange={handleTextChange(setNewRateName)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); if(ratePriceInputRef.current) ratePriceInputRef.current.focus(); }}} autoFocus /><GlassInput ref={ratePriceInputRef} placeholder="Rate (0 Allowed)" type="number" className="w-24 bg-transparent border-b border-white/20 text-sm text-white focus:outline-none" value={newRatePrice} onChange={e => setNewRatePrice(e.target.value)} onKeyDown={(e) => handleEnterKey(e, () => addNewRateToStyle(style.id))} /><button onClick={() => addNewRateToStyle(style.id)} className="text-green-400"><Check size={18}/></button><button onClick={() => setActiveStyleForAdd(null)} className="text-red-400"><X size={18}/></button></div>) : (<button onClick={() => setActiveStyleForAdd(style.id)} className="border-2 border-dashed border-white/10 text-gray-400 rounded-lg p-2 text-sm hover:border-white/30 hover:text-white transition flex justify-center items-center gap-1"><Plus size={16} /> Add Rate</button>)}</div></GlassCard>))}</div></div>)}
        {activeTab === 'settings' && (<GlassCard className="text-center"><h2 className="text-2xl font-bold text-gray-200 mb-6">Cloud & Data Management</h2><div className="mb-8 bg-indigo-900/30 border border-indigo-500/30 p-6 rounded-xl"><Cloud size={48} className="mx-auto text-indigo-400 mb-2" /><h3 className="text-xl font-semibold text-indigo-200 mb-4">Google Cloud Sync</h3>{!user ? (<button onClick={handleGoogleLogin} className="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 mx-auto hover:bg-gray-100 transition"><LogIn size={20} /> Login with Google</button>) : (<div className="space-y-4"><p className="text-indigo-300">Logged in: <span className="font-bold text-white">{user.displayName}</span></p><div className="flex gap-4 justify-center flex-wrap"><button onClick={uploadToCloud} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg flex items-center gap-2"><Upload size={18} /> Upload to Cloud</button><button onClick={downloadFromCloud} className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-lg flex items-center gap-2"><Download size={18} /> Download from Cloud</button></div><button onClick={handleLogout} className="text-red-400 text-sm hover:underline mt-2 flex items-center justify-center gap-1 mx-auto"><LogOut size={14} /> Logout</button></div>)}</div><h3 className="text-lg font-semibold text-gray-400 mb-4">Local File Backup</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-xl hover:bg-blue-600/20 transition"><h3 className="font-semibold text-blue-200 mb-2">Save to File</h3><button onClick={exportData} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg w-full flex items-center justify-center gap-2"><Save size={16} /> Export JSON</button></div><div className="bg-green-600/10 border border-green-500/30 p-4 rounded-xl hover:bg-green-600/20 transition"><h3 className="font-semibold text-green-200 mb-2">Load from File</h3><label className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg w-full flex items-center justify-center gap-2 cursor-pointer transition"><Upload size={16} /> Select JSON<input type="file" accept=".json" onChange={importData} className="hidden" /></label></div></div><div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left"><h4 className="text-red-300 font-bold mb-1 flex items-center gap-2"><Trash2 size={16}/> Danger Zone</h4><p className="text-sm text-gray-400 mb-3">Clear all data and start fresh.</p><button onClick={() => { if(confirm("DANGER: DELETE ALL DATA?")) { localStorage.clear(); window.location.reload(); }}} className="text-red-400 text-sm hover:underline">Reset Everything</button></div></GlassCard>)}
      </div>
    </div>
  );
};

export default App;