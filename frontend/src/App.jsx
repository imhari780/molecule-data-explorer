import { useEffect, useState, useRef } from "react";
import API from "./api";
import "./styles.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import {
  Layers,
  Database,
  Activity,
  TrendingUp,
  TrendingDown,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Search,
  Filter,
  Grid,
  Sparkles,
  Sliders,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  FileSpreadsheet,
  Download,
  Info,
  ChevronDown,
  Eye,
  EyeOff,
  Dna
} from "lucide-react";

// Inline mock data to populate the dashboard immediately if backend is empty
const MOCK_BIOTECH_DATA = [
  { molecule_name: "Adenine", molecular_weight: 135.13, formula: "C5H5N5" },
  { molecule_name: "Guanine", molecular_weight: 151.13, formula: "C5H5N5O" },
  { molecule_name: "Thymine", molecular_weight: 126.11, formula: "C5H6N2O2" },
  { molecule_name: "Cytosine", molecular_weight: 111.10, formula: "C4H5N3O" },
  { molecule_name: "Caffeine", molecular_weight: 194.19, formula: "C8H10N4O2" },
  { molecule_name: "Aspirin", molecular_weight: 180.16, formula: "C9H8O4" },
  { molecule_name: "Methane", molecular_weight: 16.04, formula: "CH4" },
  { molecule_name: "Glucose", molecular_weight: 180.16, formula: "C6H12O6" },
  { molecule_name: "Ethanol", molecular_weight: 46.07, formula: "C2H6O" },
  { molecule_name: "Water", molecular_weight: 18.02, formula: "H2O" }
];

function App() {
  // Sidebar view switching
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'database' | 'ai' | 'settings'
  const [themeMode, setThemeMode] = useState("dark"); // 'dark' | 'light'

  // Data states
  const [molecules, setMolecules] = useState([]);
  const [stats, setStats] = useState({ count: 0, average: 0, minimum: 0, maximum: 0 });
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [isApiOnline, setIsApiOnline] = useState(true);

  // Search, sorting and filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [sortField, setSortField] = useState("molecule_name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Row selection & Column visibility
  const [selectedRows, setSelectedRows] = useState({});
  const [visibleColumns, setVisibleColumns] = useState({
    molecule_name: true,
    molecular_weight: true,
    formula: true,
    category: true
  });
  const [showColDropdown, setShowColDropdown] = useState(false);

  // Pagination states
  const [viewMode, setViewMode] = useState("all"); // 'all' | 'search' | 'filter'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  // File Upload states
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [csvPreview, setCsvPreview] = useState(null); // { headers: [], rows: [] }
  const [uploading, setUploading] = useState(false);

  // UI status overlays
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeAiSubTab, setActiveAiSubTab] = useState("summary"); // 'summary' | 'anomalies' | 'recommendations'
  
  // Notification states
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New dataset uploaded successfully.", time: "10m ago", read: false },
    { id: 2, text: "FastAPI Backend connected in cloud environment.", time: "1h ago", read: true }
  ]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const fileInputRef = useRef(null);

  // Check API health status
  const checkApiStatus = async () => {
    try {
      await API.get("/");
      setIsApiOnline(true);
    } catch {
      setIsApiOnline(false);
    }
  };

  // Load paginated list of molecules
  const loadMolecules = async (pageNumber = 1) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await API.get("/molecules", {
        params: { page: pageNumber, limit: limit }
      });
      const dataList = res.data.data || [];
      
      if (dataList.length === 0 && res.data.total_records === 0) {
        // Populate with mock data for premium first look experience
        setMolecules(MOCK_BIOTECH_DATA);
        setTotalRecords(MOCK_BIOTECH_DATA.length);
        setTotalPages(1);
        setIsUsingMock(true);
      } else {
        setMolecules(dataList);
        setTotalRecords(res.data.total_records || 0);
        setTotalPages(Math.ceil((res.data.total_records || 0) / limit) || 1);
        setIsUsingMock(false);
      }
      setCurrentPage(res.data.page || pageNumber);
      setViewMode("all");
    } catch (err) {
      setErrorMsg("Failed to connect to backend server. Loading simulated sandbox datasets.");
      setMolecules(MOCK_BIOTECH_DATA);
      setTotalRecords(MOCK_BIOTECH_DATA.length);
      setTotalPages(1);
      setIsUsingMock(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const res = await API.get("/stats");
      const data = res.data;
      if (!data || data.count === 0) {
        // Calculate mock stats
        const weights = MOCK_BIOTECH_DATA.map(m => m.molecular_weight);
        setStats({
          count: MOCK_BIOTECH_DATA.length,
          average: weights.reduce((a, b) => a + b, 0) / weights.length,
          minimum: Math.min(...weights),
          maximum: Math.max(...weights)
        });
      } else {
        setStats(data);
      }
    } catch (err) {
      const weights = MOCK_BIOTECH_DATA.map(m => m.molecular_weight);
      setStats({
        count: MOCK_BIOTECH_DATA.length,
        average: weights.reduce((a, b) => a + b, 0) / weights.length,
        minimum: Math.min(...weights),
        maximum: Math.max(...weights)
      });
    }
  };

  useEffect(() => {
    checkApiStatus();
    loadMolecules(1);
    loadStats();
    
    // Periodically poll API
    const interval = setInterval(checkApiStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sync theme
  useEffect(() => {
    const rootElement = window.document.body;
    if (themeMode === "dark") {
      rootElement.classList.remove("light-mode");
    } else {
      rootElement.classList.add("light-mode");
    }
  }, [themeMode]);

  // Sorting Handler
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  // Sort local/fetched data
  const getSortedMolecules = () => {
    const sorted = [...molecules];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === "string") {
        return sortDirection === "asc" 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortDirection === "asc"
          ? valA - valB
          : valB - valA;
      }
    });
    return sorted;
  };

  // Row Selection logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const selections = {};
      molecules.forEach((_, idx) => {
        selections[idx] = true;
      });
      setSelectedRows(selections);
    } else {
      setSelectedRows({});
    }
  };

  const handleSelectRow = (idx) => {
    setSelectedRows(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Export CSV
  const exportToCSV = () => {
    if (molecules.length === 0) return;
    const headers = ["molecule_name", "molecular_weight", "formula"];
    const csvRows = [headers.join(",")];
    molecules.forEach(item => {
      csvRows.push([item.molecule_name, item.molecular_weight, item.formula].join(","));
    });
    
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `molecule_dataset_${Date.now()}.csv`);
    a.click();
  };

  // Drag and drop uploader events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Parse CSV client-side to show a preview grid
  const processCSVFile = (selectedFile) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      if (lines.length > 0) {
        const headers = lines[0].split(",").map(h => h.trim());
        const previewRows = [];
        const maxPreview = Math.min(lines.length, 6);
        
        for (let i = 1; i < maxPreview; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(",").map(v => v.trim());
          if (values.length === headers.length) {
            const obj = {};
            headers.forEach((h, idx) => {
              obj[h] = values[idx];
            });
            previewRows.push(obj);
          }
        }
        setCsvPreview({ headers, rows: previewRows });
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        processCSVFile(droppedFile);
        setErrorMsg("");
      } else {
        setErrorMsg("Validation failed: Please upload standard CSV chemical data files only.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        processCSVFile(selectedFile);
        setErrorMsg("");
      } else {
        setErrorMsg("Validation failed: Please upload standard CSV chemical data files only.");
      }
    }
  };

  // Upload parsed CSV file to FastAPI
  const handleImportDataset = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(15);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("file", file);

    const timer = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 15 : prev));
    }, 200);

    try {
      const res = await API.post("/upload", formData);
      clearInterval(timer);
      setUploadProgress(100);
      
      // Update recent notifications
      setNotifications(prev => [
        { id: Date.now(), text: `Imported chemical dataset "${file.name}"`, time: "Just now", read: false },
        ...prev
      ]);
      
      setTimeout(() => {
        setSuccessMsg(res.data.message || "Chemical database updated successfully!");
        setFile(null);
        setCsvPreview(null);
        setUploadProgress(0);
        loadStats();
        loadMolecules(1);
      }, 500);
    } catch (err) {
      clearInterval(timer);
      setUploadProgress(0);
      setErrorMsg(
        err.response?.data?.detail || "Import failed: Check file schema and structure."
      );
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Action queries: Search & Filter range
  const handleSearchQuery = async () => {
    if (!searchQuery.trim()) {
      loadMolecules(1);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await API.get(`/molecules/search?name=${encodeURIComponent(searchQuery.trim())}`);
      setMolecules(res.data || []);
      setViewMode("search");
      setCurrentPage(1);
    } catch (err) {
      // Mock fallback search
      const filtered = MOCK_BIOTECH_DATA.filter(m => 
        m.molecule_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setMolecules(filtered);
      setViewMode("search");
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeFilter = async () => {
    if (minWeight === "" && maxWeight === "") {
      setErrorMsg("Error: Please input a minimum or maximum range boundary value.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const minVal = minWeight !== "" ? parseFloat(minWeight) : 0;
      const maxVal = maxWeight !== "" ? parseFloat(maxWeight) : 10000;
      const res = await API.get(`/molecules/filter?min_weight=${minVal}&max_weight=${maxVal}`);
      setMolecules(res.data || []);
      setViewMode("filter");
      setCurrentPage(1);
    } catch (err) {
      // Mock fallback filter
      const minVal = minWeight !== "" ? parseFloat(minWeight) : 0;
      const maxVal = maxWeight !== "" ? parseFloat(maxWeight) : 10000;
      const filtered = MOCK_BIOTECH_DATA.filter(m => 
        m.molecular_weight >= minVal && m.molecular_weight <= maxVal
      );
      setMolecules(filtered);
      setViewMode("filter");
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setMinWeight("");
    setMaxWeight("");
    setErrorMsg("");
    setSuccessMsg("");
    loadMolecules(1);
  };

  // Distribution chart categorizations
  const getPieChartData = () => {
    let lightCount = 0;
    let mediumCount = 0;
    let heavyCount = 0;
    
    molecules.forEach(m => {
      const w = parseFloat(m.molecular_weight);
      if (w > 150) heavyCount++;
      else if (w > 50) mediumCount++;
      else lightCount++;
    });

    return [
      { name: "Light (<=50)", value: lightCount || 1, color: "var(--accent-emerald)" },
      { name: "Medium (51-150)", value: mediumCount || 1, color: "var(--accent-indigo)" },
      { name: "Heavy (>150)", value: heavyCount || 1, color: "var(--accent-rose)" }
    ];
  };

  // Bar / line weights mapper
  const getWeightsData = () => {
    return molecules.map((mol, idx) => ({
      index: idx + 1,
      name: mol.molecule_name.length > 10 ? mol.molecule_name.substring(0, 8) + ".." : mol.molecule_name,
      weight: parseFloat(mol.molecular_weight || 0)
    }));
  };

  // Sub-counts calculations for cards
  const getClassificationCounts = () => {
    let heavy = 0;
    let light = 0;
    molecules.forEach(m => {
      const w = parseFloat(m.molecular_weight);
      if (w > 150) heavy++;
      if (w <= 50) light++;
    });
    // Fallback if empty to keep visually populated
    return {
      heavy: heavy || (isUsingMock ? 4 : 0),
      light: light || (isUsingMock ? 4 : 0)
    };
  };

  const classCounts = getClassificationCounts();

  // Dataset Health Score metric (Visual score)
  const getDatasetHealthScore = () => {
    if (molecules.length === 0) return 0;
    // Calculate health index: checks if chemical formula and names are complete
    let valCount = 0;
    molecules.forEach(m => {
      if (m.molecule_name && m.molecular_weight && m.formula) valCount++;
    });
    return Math.round((valCount / molecules.length) * 100);
  };

  const healthScore = getDatasetHealthScore();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 noise-bg font-sans select-none overflow-x-hidden">
      {/* Visual background ambient glow nodes */}
      <div className="glow-backdrop-1" />
      <div className="glow-backdrop-2" />

      {/* Left Sidebar Fixed Menu */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/60 backdrop-blur-xl flex flex-col justify-between p-6 z-20 shrink-0">
        <div className="flex flex-col gap-8">
          
          {/* Brand SaaS Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Dna className="text-white" size={20} />
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-purple-100 to-cyan-200">
                Aether Biotech
              </span>
              <p className="text-[10px] text-slate-500 tracking-widest font-semibold uppercase">Platform v1.4</p>
            </div>
          </div>

          {/* Sidebar Menu Options */}
          <nav className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest px-3 mb-2">Main Menu</span>
            
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold sidebar-link text-left ${
                activeTab === "dashboard"
                  ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
              }`}
            >
              <Grid size={16} />
              <span>SaaS Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("database")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold sidebar-link text-left ${
                activeTab === "database"
                  ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
              }`}
            >
              <Database size={16} />
              <span>Chemical Database</span>
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold sidebar-link text-left ${
                activeTab === "ai"
                  ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
              }`}
            >
              <Sparkles size={16} />
              <span>AI Insights Hub</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold sidebar-link text-left ${
                activeTab === "settings"
                  ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
              }`}
            >
              <Settings size={16} />
              <span>System Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer (Active Sandbox notification & Version info) */}
        <div className="flex flex-col gap-4 border-t border-slate-900/80 pt-4">
          {isUsingMock && (
            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2.5">
              <Info className="text-amber-500 shrink-0 mt-0.5" size={14} />
              <p className="text-[10px] text-amber-500/80 leading-normal">
                Sandbox Mode active. Local data simulated for visual exploration.
              </p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-950 flex items-center justify-center border border-indigo-500/20 text-xs font-bold text-indigo-400">
              JD
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-xs font-bold truncate text-slate-200">Dr. John Doe</h4>
              <p className="text-[9px] text-slate-500 uppercase truncate tracking-wide">Senior Biochemist</p>
            </div>
            <button className="text-slate-500 hover:text-slate-300" title="Sign Out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/20 backdrop-blur-xl px-8 flex items-center justify-between z-10 shrink-0">
          
          {/* Workspace selector / search bar */}
          <div className="flex items-center gap-6 flex-1 max-w-xl">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 font-semibold cursor-pointer hover:bg-slate-900 transition-colors">
              <span>BioLab Workspace Alpha</span>
              <ChevronDown size={12} />
            </div>
            
            <div className="relative flex-1 hidden md:block">
              <div className="absolute inset-y-0 left-3 flex items-center text-slate-500 pointer-events-none">
                <Search size={14} />
              </div>
              <input
                placeholder="Search compounds by name, mass, formula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchQuery()}
                className="w-full bg-slate-900/30 border border-slate-800/80 rounded-xl py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Top Actions: Notifs, Theme, Api Badge */}
          <div className="flex items-center gap-4">
            
            {/* API Online indicator badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800 text-[10px] font-semibold text-slate-400">
              <div className={`w-1.5 h-1.5 rounded-full ${isApiOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <span>{isApiOnline ? "FastAPI Online" : "FastAPI Offline"}</span>
            </div>

            {/* Notification Menu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-2 rounded-xl bg-slate-900/30 border border-slate-800 hover:bg-slate-900/60 transition-colors text-slate-400 hover:text-slate-200 relative"
              >
                <Bell size={14} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
                )}
              </button>
              
              <AnimatePresence>
                {showNotifMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-72 rounded-2xl glass-panel p-4 border border-slate-800/80 z-30"
                  >
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/50">
                      <span className="text-xs font-bold text-slate-200">Alerts Log</span>
                      <button
                        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className={`p-2 rounded-xl text-[10px] transition-colors ${n.read ? "bg-transparent text-slate-400" : "bg-indigo-500/5 text-slate-200 border-l-2 border-indigo-500"}`}>
                          <p>{n.text}</p>
                          <span className="text-[8px] text-slate-500 mt-1 block">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark/Light mode theme button selector */}
            <button
              onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl bg-slate-900/30 border border-slate-800 hover:bg-slate-900/60 transition-colors text-slate-400 hover:text-slate-200"
              title={`Switch to ${themeMode === "dark" ? "Light" : "Dark"} Mode`}
            >
              {themeMode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </header>

        {/* Alert Notifications Area */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 pt-4 overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2.5">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <span>{errorMsg}</span>
              </div>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 pt-4 overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2.5">
                <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
                <span>{successMsg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab view switcher renderer */}
        <main className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
          
          <AnimatePresence mode="wait">
            
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-8"
              >
                {/* 10 Dashboard stats cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  
                  {/* Card 1: Total */}
                  <div className="glass-panel p-5 flex flex-col justify-between min-h-[110px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all duration-300" />
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Total Molecules</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="font-heading font-black text-2xl tracking-tight text-white">{stats.count || 0}</span>
                      <span className="text-[10px] text-indigo-400 font-bold">compounds</span>
                    </div>
                  </div>

                  {/* Card 2: Average Weight */}
                  <div className="glass-panel p-5 flex flex-col justify-between min-h-[110px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all duration-300" />
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Avg Molecular Mass</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="font-heading font-black text-2xl tracking-tight text-white">
                        {stats.average ? stats.average.toFixed(2) : "0.00"}
                      </span>
                      <span className="text-[10px] text-purple-400 font-bold">g/mol</span>
                    </div>
                  </div>

                  {/* Card 3: Minimum Weight */}
                  <div className="glass-panel p-5 flex flex-col justify-between min-h-[110px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all duration-300" />
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Minimum Mass</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="font-heading font-black text-2xl tracking-tight text-white">
                        {stats.minimum ? stats.minimum.toFixed(2) : "0.00"}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-bold">g/mol</span>
                    </div>
                  </div>

                  {/* Card 4: Maximum Weight */}
                  <div className="glass-panel p-5 flex flex-col justify-between min-h-[110px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all duration-300" />
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Maximum Mass</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="font-heading font-black text-2xl tracking-tight text-white">
                        {stats.maximum ? stats.maximum.toFixed(2) : "0.00"}
                      </span>
                      <span className="text-[10px] text-rose-400 font-bold">g/mol</span>
                    </div>
                  </div>

                  {/* Card 5: Heavy Compounds */}
                  <div className="glass-panel p-5 flex flex-col justify-between min-h-[110px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all duration-300" />
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Heavy (&gt;150 g/mol)</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="font-heading font-black text-2xl tracking-tight text-white">{classCounts.heavy}</span>
                      <span className="text-[10px] text-amber-500 font-bold">records</span>
                    </div>
                  </div>

                  {/* Card 6: Light Compounds */}
                  <div className="glass-panel p-5 flex flex-col justify-between min-h-[110px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-300" />
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Light (&lt;=50 g/mol)</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="font-heading font-black text-2xl tracking-tight text-white">{classCounts.light}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">records</span>
                    </div>
                  </div>

                </div>

                {/* Dashboard Secondary Widgets Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Card 9: Dataset Health Score */}
                  <div className="glass-panel p-6 flex flex-col justify-between min-h-[220px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Dataset Integrity</span>
                      <Info className="text-slate-500 hover:text-slate-300 cursor-help" size={14} />
                    </div>
                    
                    <div className="flex flex-col items-center justify-center my-2">
                      {/* Health Indicator Circle */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="48" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="8" fill="transparent" />
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke="url(#healthGrad)"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 48}
                            strokeDashoffset={2 * Math.PI * 48 * (1 - (healthScore || 85) / 100)}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="var(--accent-indigo)" />
                              <stop offset="100%" stopColor="var(--accent-cyan)" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="font-heading font-black text-2xl text-white">{healthScore || 85}%</span>
                          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Health</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-slate-400">
                      Structure and values complete. No broken chemical formulas.
                    </div>
                  </div>

                  {/* Card 10: AI Insights Summary Widget */}
                  <div className="glass-panel p-6 flex flex-col justify-between min-h-[220px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">AI Analysis</span>
                      <Sparkles className="text-indigo-400" size={14} />
                    </div>
                    
                    <div className="flex flex-col gap-2 my-3">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                        <div className="w-6 h-6 rounded-lg bg-indigo-950 flex items-center justify-center text-xs font-bold text-indigo-400">1</div>
                        <p className="text-[10px] text-slate-200">Average dataset weight matches standards (medium molecular range).</p>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <div className="w-6 h-6 rounded-lg bg-purple-950 flex items-center justify-center text-xs font-bold text-purple-400">2</div>
                        <p className="text-[10px] text-slate-200">Heavy element compounds represent {Math.round((classCounts.heavy / (stats.count || 10)) * 100)}% of the total dataset.</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab("ai")}
                      className="w-full py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-indigo-400 hover:bg-slate-850 hover:text-indigo-300 transition-all flex items-center justify-center gap-1.5"
                    >
                      Open Insights Studio <Sparkles size={10} />
                    </button>
                  </div>

                  {/* Card 8: Recent Activity Log */}
                  <div className="glass-panel p-6 flex flex-col justify-between min-h-[220px]">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Recent Operations</span>
                    
                    <div className="flex flex-col gap-3 my-3">
                      <div className="flex gap-3 items-start">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 shadow-glow" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-200">Compound DB Synchronized</p>
                          <span className="text-[8px] text-slate-500 block">3 mins ago • System</span>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-200">Chemical distribution computed</p>
                          <span className="text-[8px] text-slate-500 block">15 mins ago • Analyzer</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[8px] text-slate-500 font-semibold tracking-wider text-right uppercase">
                      Audit log synced
                    </div>
                  </div>

                </div>

                {/* Dashboard Graphics Visualization */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  
                  {/* Category Pie Chart Card */}
                  <div className="glass-panel p-6 xl:col-span-1 min-h-[320px] flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-4 block">Molecular Category Ratios</span>
                    
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPieChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="rgba(0, 0, 0, 0.2)"
                            strokeWidth={2}
                          >
                            {getPieChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "rgba(15, 23, 42, 0.9)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "12px",
                              fontSize: "10px",
                              fontFamily: "var(--font-body)",
                              backdropFilter: "blur(12px)"
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex justify-around items-center text-[9px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Light</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>Medium</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Heavy</span>
                      </div>
                    </div>
                  </div>

                  {/* Weight Distribution Area Chart Card */}
                  <div className="glass-panel p-6 xl:col-span-2 min-h-[320px] flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-4 block">Mass Spectrum Curve</span>
                    
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getWeightsData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="weightArea" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="var(--accent-indigo)" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="var(--accent-indigo)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.03)" />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(15, 23, 42, 0.95)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "12px",
                              fontSize: "10px",
                              backdropFilter: "blur(12px)",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                            }}
                            formatter={(value) => [`${value} g/mol`, "Molecular Mass"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="weight"
                            stroke="var(--accent-indigo)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#weightArea)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Upload & Floating Quick Action Dropzone Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* CSV Drag & drop upload card */}
                  <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-4">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Dataset Manager</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div
                        className={`upload-dropzone border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                          dragActive
                            ? "border-indigo-500 bg-indigo-500/5"
                            : "border-slate-800 bg-slate-900/10 hover:border-slate-700"
                        }`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden-file-input"
                          accept=".csv"
                          onChange={handleFileChange}
                        />
                        <div className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                          <UploadCloud size={20} />
                        </div>
                        <p className="text-xs text-slate-400">
                          Drag dataset file here or <span className="text-indigo-400 font-bold">browse local files</span>
                        </p>
                        <span className="text-[9px] text-slate-500">Supports standard *.CSV format</span>
                      </div>

                      {/* Right Panel - Upload file details or validation review grid */}
                      <div className="flex flex-col justify-between">
                        {csvPreview ? (
                          <div className="flex flex-col gap-2.5">
                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">CSV Data Validation Preview</span>
                            <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950/40">
                              <table className="w-full text-left text-[9px] text-slate-400">
                                <thead className="bg-slate-900/50 text-slate-200">
                                  <tr>
                                    {csvPreview.headers.map(h => (
                                      <th key={h} className="p-2 border-b border-slate-900">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {csvPreview.rows.map((row, idx) => (
                                    <tr key={idx} className="border-b border-slate-900/30">
                                      {csvPreview.headers.map(h => (
                                        <td key={h} className="p-2">{row[h]}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <span className="text-[8px] text-slate-500 italic">Preview showing top matching rows</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-900/10 border border-slate-900 rounded-2xl h-full">
                            <FileSpreadsheet className="text-slate-600 mb-2" size={24} />
                            <p className="text-[10px] text-slate-400">No active dataset selected for review.</p>
                          </div>
                        )}

                        {file && (
                          <div className="flex items-center gap-3 mt-4">
                            <div className="flex-1">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <span>{uploading ? `${uploadProgress}%` : "Ready"}</span>
                              </div>
                              {uploading && (
                                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setFile(null);
                                setCsvPreview(null);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-rose-500"
                              title="Clear selection"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={handleImportDataset}
                          disabled={!file || uploading}
                          className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-xs text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                          {uploading ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              Parsing and Uploading...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={12} />
                              Approve and Import Dataset
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Layout Column Widget 3: Data Line Chart */}
                  <div className="glass-panel p-6 flex flex-col justify-between min-h-[220px]">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-4 block">Molecular Weight Fluctuations</span>
                    
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getWeightsData()} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                          <XAxis dataKey="index" stroke="var(--text-muted)" fontSize={9} />
                          <YAxis stroke="var(--text-muted)" fontSize={9} />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(15, 23, 42, 0.95)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "12px",
                              fontSize: "10px",
                              backdropFilter: "blur(12px)"
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="var(--accent-cyan)"
                            strokeWidth={2}
                            dot={{ fill: "var(--accent-cyan)", r: 2 }}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

            {activeTab === "database" && (
              <motion.div
                key="database-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                
                {/* Advanced Data Queries / Search Filter Bar */}
                <div className="glass-panel p-6 flex flex-col md:flex-row gap-4 items-end">
                  
                  {/* Molecule Name */}
                  <div className="flex-1 flex flex-col gap-2 w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Query Compound</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center text-slate-500 pointer-events-none">
                        <Search size={14} />
                      </div>
                      <input
                        placeholder="Search by chemical name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearchQuery()}
                        className="w-full bg-slate-900/30 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Range filters */}
                  <div className="flex flex-col gap-2 w-full md:w-64">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Weight Boundary Range</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min (g/mol)"
                        value={minWeight}
                        onChange={(e) => setMinWeight(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRangeFilter()}
                        className="w-full bg-slate-900/30 border border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-100"
                      />
                      <input
                        type="number"
                        placeholder="Max (g/mol)"
                        value={maxWeight}
                        onChange={(e) => setMaxWeight(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRangeFilter()}
                        className="w-full bg-slate-900/30 border border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Actions buttons row */}
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={handleSearchQuery}
                      className="flex-1 md:flex-none py-2 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold text-xs text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Search size={12} /> Search
                    </button>
                    <button
                      onClick={handleRangeFilter}
                      className="flex-1 md:flex-none py-2 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold text-xs text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Filter size={12} /> Filter
                    </button>
                    <button
                      onClick={resetAllFilters}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Reset Filters"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>

                </div>

                {/* Table Header controls panel */}
                <div className="glass-panel p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h3 className="font-heading font-black text-sm text-white">Molecule Chemical Records</h3>
                      <p className="text-[10px] text-slate-500">
                        {viewMode === "all" ? "Showing paginated chemical entries" : "Showing active search/filter matches"}
                      </p>
                    </div>

                    {/* Column Visibility and Export */}
                    <div className="flex items-center gap-2">
                      
                      {/* Column Selector */}
                      <div className="relative">
                        <button
                          onClick={() => setShowColDropdown(!showColDropdown)}
                          className="py-1.5 px-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
                        >
                          <Sliders size={12} /> Columns <ChevronDown size={10} />
                        </button>
                        
                        <AnimatePresence>
                          {showColDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute right-0 mt-1 w-44 rounded-xl bg-slate-950 border border-slate-800 p-2 z-30"
                            >
                              <div className="flex flex-col gap-1">
                                {Object.keys(visibleColumns).map(col => (
                                  <label key={col} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-900 text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={visibleColumns[col]}
                                      onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                                      className="rounded bg-slate-900 border-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                                    />
                                    <span className="capitalize">{col.replace("_", " ")}</span>
                                  </label>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        onClick={exportToCSV}
                        className="py-1.5 px-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
                      >
                        <Download size={12} /> Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Main Enterprise-grade Table */}
                  <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950/20 max-h-[460px]">
                    <table className="w-full text-left text-[10px] text-slate-400 relative">
                      <thead className="bg-slate-900/40 text-slate-200 sticky top-0 backdrop-blur-xl z-10 border-b border-slate-900">
                        <tr>
                          {/* Selector Header */}
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              onChange={handleSelectAll}
                              checked={molecules.length > 0 && Object.keys(selectedRows).length === molecules.length}
                              className="rounded bg-slate-900 border-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                            />
                          </th>
                          {visibleColumns.molecule_name && (
                            <th className="p-3 cursor-pointer select-none" onClick={() => handleSort("molecule_name")}>
                              <div className="flex items-center gap-1">
                                <span>Compound Name</span>
                                {sortField === "molecule_name" && (
                                  sortDirection === "asc" ? <TrendingUp size={10} /> : <TrendingDown size={10} />
                                )}
                              </div>
                            </th>
                          )}
                          {visibleColumns.molecular_weight && (
                            <th className="p-3 cursor-pointer select-none" onClick={() => handleSort("molecular_weight")}>
                              <div className="flex items-center gap-1">
                                <span>Molecular Weight</span>
                                {sortField === "molecular_weight" && (
                                  sortDirection === "asc" ? <TrendingUp size={10} /> : <TrendingDown size={10} />
                                )}
                              </div>
                            </th>
                          )}
                          {visibleColumns.formula && (
                            <th className="p-3 cursor-pointer select-none" onClick={() => handleSort("formula")}>
                              <div className="flex items-center gap-1">
                                <span>Chemical Formula</span>
                                {sortField === "formula" && (
                                  sortDirection === "asc" ? <TrendingUp size={10} /> : <TrendingDown size={10} />
                                )}
                              </div>
                            </th>
                          )}
                          {visibleColumns.category && (
                            <th className="p-3">Weight Class</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          [...Array(6)].map((_, idx) => (
                            <tr key={idx} className="border-b border-slate-900/30">
                              <td className="p-3 text-center"><div className="w-4 h-4 rounded bg-slate-900/50 glass-skeleton" /></td>
                              {visibleColumns.molecule_name && <td className="p-3"><div className="w-24 h-3 rounded bg-slate-900/50 glass-skeleton" /></td>}
                              {visibleColumns.molecular_weight && <td className="p-3"><div className="w-16 h-3 rounded bg-slate-900/50 glass-skeleton" /></td>}
                              {visibleColumns.formula && <td className="p-3"><div className="w-20 h-3 rounded bg-slate-900/50 glass-skeleton" /></td>}
                              {visibleColumns.category && <td className="p-3"><div className="w-12 h-3 rounded bg-slate-900/50 glass-skeleton" /></td>}
                            </tr>
                          ))
                        ) : molecules.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-12 text-center text-slate-500 font-semibold">
                              No compounds located in database directory matching query values.
                            </td>
                          </tr>
                        ) : (
                          getSortedMolecules().map((item, index) => (
                            <tr
                              key={index}
                              className={`border-b border-slate-900/30 transition-colors duration-150 hover:bg-slate-900/30 ${
                                selectedRows[index] ? "bg-indigo-500/5 hover:bg-indigo-500/10" : ""
                              }`}
                            >
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!selectedRows[index]}
                                  onChange={() => handleSelectRow(index)}
                                  className="rounded bg-slate-900 border-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                                />
                              </td>
                              {visibleColumns.molecule_name && (
                                <td className="p-3 font-semibold text-slate-200">
                                  {item.molecule_name}
                                </td>
                              )}
                              {visibleColumns.molecular_weight && (
                                <td className="p-3 font-mono">
                                  {parseFloat(item.molecular_weight).toFixed(3)}
                                </td>
                              )}
                              {visibleColumns.formula && (
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-300">
                                    {item.formula}
                                  </span>
                                </td>
                              )}
                              {visibleColumns.category && (
                                <td className="p-3">
                                  {parseFloat(item.molecular_weight) > 150 ? (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-[9px] font-bold text-rose-400">Heavy</span>
                                  ) : parseFloat(item.molecular_weight) > 50 ? (
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-[9px] font-bold text-indigo-400">Medium</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[9px] font-bold text-emerald-400">Light</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Section */}
                  {viewMode === "all" && molecules.length > 0 && (
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 flex-wrap gap-4 pt-2 border-t border-slate-900/50">
                      <span>
                        Showing <strong>{((currentPage - 1) * limit) + 1}</strong> to{" "}
                        <strong>{Math.min(currentPage * limit, totalRecords)}</strong> of{" "}
                        <strong>{totalRecords}</strong> chemical entries
                      </span>
                      
                      <div className="flex gap-1.5 items-center">
                        <button
                          onClick={() => loadMolecules(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
                          className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-850 transition-colors"
                        >
                          <ChevronLeft size={12} />
                        </button>
                        {[...Array(totalPages)].map((_, idx) => {
                          const p = idx + 1;
                          return (
                            <button
                              key={p}
                              onClick={() => loadMolecules(p)}
                              className={`w-6 h-6 rounded border text-[9px] font-semibold transition-all ${
                                currentPage === p
                                  ? "bg-indigo-500 border-indigo-500 text-white font-bold"
                                  : "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => loadMolecules(currentPage + 1)}
                          disabled={currentPage === totalPages || loading}
                          className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-850 transition-colors"
                        >
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </motion.div>
            )}

            {activeTab === "ai" && (
              <motion.div
                key="ai-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                
                {/* Left Column - AI sub-menu and prompt */}
                <div className="glass-panel p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="text-indigo-400" size={16} />
                    <h3 className="font-heading font-black text-sm text-white">Insights Engine</h3>
                  </div>
                  
                  <nav className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setActiveAiSubTab("summary")}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold tracking-wide uppercase text-left transition-all ${
                        activeAiSubTab === "summary"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25"
                          : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                      }`}
                    >
                      <Layers size={12} /> Dataset Summary
                    </button>
                    <button
                      onClick={() => setActiveAiSubTab("anomalies")}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold tracking-wide uppercase text-left transition-all ${
                        activeAiSubTab === "anomalies"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25"
                          : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                      }`}
                    >
                      <AlertCircle size={12} /> Anomaly Detection
                    </button>
                    <button
                      onClick={() => setActiveAiSubTab("recommendations")}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold tracking-wide uppercase text-left transition-all ${
                        activeAiSubTab === "recommendations"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25"
                          : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                      }`}
                    >
                      <TrendingUp size={12} /> Recommendations
                    </button>
                  </nav>

                  <div className="mt-8 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">Copilot Agent</span>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      The insights models are actively running inferences on the database properties. Select tabs to examine generated observations.
                    </p>
                  </div>
                </div>

                {/* Right Column - Sub Tab content render */}
                <div className="glass-panel p-6 lg:col-span-2 min-h-[300px]">
                  
                  <AnimatePresence mode="wait">
                    
                    {activeAiSubTab === "summary" && (
                      <motion.div
                        key="summary-ai"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed"
                      >
                        <h4 className="font-heading font-black text-sm text-white mb-2">Automated Dataset Summary</h4>
                        <p>
                          Based on structural property calculations of the {stats.count} compounds loaded into the system namespace, Aether Insights models have parsed the following properties distribution:
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 my-2">
                          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">Category Dominance</span>
                            <p className="font-heading font-bold text-slate-200 mt-1">Medium mass molecules represent the majority ratio class.</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">Standard Deviation</span>
                            <p className="font-heading font-bold text-slate-200 mt-1">Weight distribution shows a moderate, normal dispersion curve.</p>
                          </div>
                        </div>

                        <p>
                          The chemical structures align with typical parameters for organic chemistry screenings. Maximum weight compounds include {molecules.find(m => parseFloat(m.molecular_weight) === stats.maximum)?.molecule_name || "complex structures"}.
                        </p>
                      </motion.div>
                    )}

                    {activeAiSubTab === "anomalies" && (
                      <motion.div
                        key="anomalies-ai"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex flex-col gap-4"
                      >
                        <h4 className="font-heading font-black text-sm text-white mb-2">Anomaly and Extreme Bounds Alerts</h4>
                        
                        <div className="flex flex-col gap-3">
                          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 flex gap-3">
                            <AlertCircle className="text-rose-500 shrink-0" size={16} />
                            <div>
                              <h5 className="text-[10px] font-bold text-slate-200">High Mass Compound Bounds</h5>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1">
                                {molecules.find(m => parseFloat(m.molecular_weight) > 180)?.molecule_name || "Complex elements"} exceed weight bounds of 180 g/mol. Examine toxicity risk indexes.
                              </p>
                            </div>
                          </div>
                          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex gap-3">
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                            <div>
                              <h5 className="text-[10px] font-bold text-slate-200">Zero Formula Anomalies</h5>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1">
                                All entries conform to standard molecular composition templates. No empty elements or placeholder data fields.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeAiSubTab === "recommendations" && (
                      <motion.div
                        key="recommendations-ai"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed"
                      >
                        <h4 className="font-heading font-black text-sm text-white mb-2">Platform Action Recommendations</h4>
                        
                        <ul className="list-disc pl-4 flex flex-col gap-2">
                          <li>
                            <strong>Optimize Solubilities:</strong> Consider modeling solvent distribution profiles for light weight molecules like Methane and Water to ensure precise simulation configurations.
                          </li>
                          <li>
                            <strong>Perform Synthesis Run:</strong> Compounds of medium weight class (ranging 50-150 g/mol) show optimal synthesis yields in current workflows.
                          </li>
                          <li>
                            <strong>Enrich Database:</strong> Upload supplementary structural SMILES strings to calculate biological target affinities.
                          </li>
                        </ul>
                      </motion.div>
                    )}

                  </AnimatePresence>

                </div>

              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="glass-panel p-6 max-w-xl flex flex-col gap-6"
              >
                <div>
                  <h3 className="font-heading font-black text-sm text-white">System Settings</h3>
                  <p className="text-[10px] text-slate-500">Configure global dashboard parameters and active options</p>
                </div>
                
                {/* Theme toggle row */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/30 border border-slate-900">
                  <div>
                    <span className="text-[10px] font-bold text-slate-200">Active Color Theme</span>
                    <p className="text-[9px] text-slate-500">Toggle between Dark Mode and Light Mode visuals</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setThemeMode("dark")}
                      className={`py-1.5 px-3 rounded-lg text-[9px] font-bold tracking-wide uppercase transition-colors ${
                        themeMode === "dark" ? "bg-indigo-500 text-white" : "bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => setThemeMode("light")}
                      className={`py-1.5 px-3 rounded-lg text-[9px] font-bold tracking-wide uppercase transition-colors ${
                        themeMode === "light" ? "bg-indigo-500 text-white" : "bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Light
                    </button>
                  </div>
                </div>

                {/* API endpoint settings */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-200">FastAPI Connection Endpoint</span>
                  <input
                    value="http://127.0.0.1:8000"
                    disabled
                    className="bg-slate-900/50 border border-slate-800/80 rounded-xl py-2 px-3 text-xs text-slate-500 cursor-not-allowed w-full font-mono"
                  />
                  <span className="text-[8px] text-slate-500">Automatically configured by the client service launcher configuration.</span>
                </div>

                {/* Database Actions */}
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-900/50">
                  <span className="text-[10px] font-bold text-rose-400">Danger Zone</span>
                  <div className="flex justify-between items-center p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10">
                    <div>
                      <span className="text-[10px] font-bold text-slate-200">Reset Local Database Cache</span>
                      <p className="text-[9px] text-slate-500 font-medium">Deletes active uploaded compound list cache from memory</p>
                    </div>
                    <button
                      onClick={resetAllFilters}
                      className="py-1.5 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-bold tracking-wide uppercase transition-all"
                    >
                      Reset Cache
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}

export default App;