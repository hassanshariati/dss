import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowLeft, ArrowUpLeft, BarChart3, Building2, CalendarDays, CheckCircle2,
  ChevronDown, ChevronLeft, Database, Eye, EyeOff, FileBarChart2, Files, FileSpreadsheet,
  FolderOpen, LayoutDashboard, LineChart, LockKeyhole, LogOut, Menu, PieChart, Plus, RefreshCw,
  Search, Settings2, ShieldCheck, Sparkles, Table2, UploadCloud, Users, X, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, AreaChart, Area, LineChart as ReLineChart, Line,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { api, setCsrf } from './api';

const num = value => Number(value || 0).toLocaleString('fa-IR');
const shortDate = raw => raw ? new Date(raw).toLocaleDateString('fa-IR') : '—';
const colors = ['#26d6ad', '#7c8bff', '#fcbf69', '#f472b6', '#46b9ef', '#bb8ff3'];
const permissions = { employee: 'کارمند', manager: 'مدیر', admin: 'مدیر سامانه' };

function Brand({ brand, small = false }) {
  return <div className={'brand ' + (small ? 'brand-small' : '')}>
    <div className="brand-symbol">{brand?.logo ? <img alt="لوگوی شرکت" src={brand.logo}/> : <Activity size={small ? 21 : 30} strokeWidth={2.3}/>}</div>
    <div className="brand-label"><strong>{brand?.company_name || 'DSS Studio'}</strong><span>Decision Support System</span></div>
  </div>;
}
function Message({ children, type = 'error' }) {
  return children ? <div className={'message message-' + type}><AlertCircle size={17}/><span>{children}</span></div> : null;
}
function Spinner({ label = 'در حال دریافت اطلاعات...' }) {
  return <div className="loading"><RefreshCw className="spinning" size={23}/><span>{label}</span></div>;
}
function PortalLogin({ area, onLogin }) {
  const nav = useNavigate();
  const [brand, setBrand] = useState(null);
  const [captcha, setCaptcha] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [answer, setAnswer] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const management = area === 'management';
  async function refreshCaptcha() {
    try { setCaptcha(await api('/auth/captcha', { method: 'POST' })); setAnswer(''); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => {
    let active = true;
    api('/branding/' + area).then(v => { if (active) setBrand(v); }).catch(() => {});
    refreshCaptcha();
    return () => { active = false; };
  }, [area]);
  async function submit(e) {
    e.preventDefault();
    if (!captcha) return;
    setBusy(true); setError('');
    try {
      const result = await api('/auth/login', { method: 'POST',
        body: { email, password, captcha_id: captcha.id, captcha_answer: answer } });
      setCsrf(result.csrf);
      onLogin(result.user);
      nav(result.user.role === 'employee' ? '/employee' : (management ? '/management' : '/employee'), { replace: true });
    } catch (ex) { setError(ex.message); await refreshCaptcha(); }
    finally { setBusy(false); }
  }
  return <div className="login-screen">
    <section className="login-hero">
      <div className="hero-grid"/>
      <div className="hero-orb orb-one"/><div className="hero-orb orb-two"/>
      <div className="hero-content">
        <div className="hero-top"><span className="eyebrow"><span className="live-dot"/> نسل جدید تحلیل سازمانی</span></div>
        <div className="hero-middle">
          <div className="hero-icon"><Sparkles size={34}/></div>
          <h1>داده‌های پراکنده.<br/><em>تصمیم‌های هوشمند.</em></h1>
          <p>یک فضای یکپارچه برای تبدیل فایل‌های Excel به بینش‌های روشن، نمودارهای تعاملی و تصمیم‌های مستند.</p>
          <div className="feature-list"><span><CheckCircle2 size={17}/> تحلیل داده‌های واقعی</span><span><CheckCircle2 size={17}/> داشبوردهای کاربردی</span><span><CheckCircle2 size={17}/> دسترسی امن سازمانی</span></div>
        </div>
        <div className="hero-bottom">DSS STUDIO <span>•</span> POWERED BY DATA</div>
      </div>
    </section>
    <section className="login-main">
      <div className="login-header"><Brand brand={brand} small/><div className="login-badge"><ShieldCheck size={15}/> فضای امن سازمانی</div></div>
      <div className="login-form-wrap">
        <div className="login-title">
          <div className="section-mark">{management ? <BarChart3 size={20}/> : <UploadCloud size={20}/>}</div>
          <span className="overline">{management ? 'MANAGEMENT PORTAL' : 'EMPLOYEE PORTAL'}</span>
          <h2>خوش آمدید <span className="wave">✦</span></h2>
          <p>{management ? 'برای مشاهده تحلیل‌ها و داشبورد مدیریتی وارد شوید.' : 'برای ثبت داده‌ها و مدیریت فایل‌ها وارد شوید.'}</p>
        </div>
        <Message>{error}</Message>
        <form onSubmit={submit} className="login-form">
          <label>ایمیل سازمانی<input dir="ltr" type="email" value={email} required autoComplete="username" placeholder="name@company.com" onChange={e => setEmail(e.target.value)}/></label>
          <label>رمز عبور<div className="password-input"><input dir="ltr" type={visible ? 'text':'password'} required value={password} autoComplete="current-password" placeholder="••••••••••••" onChange={e => setPassword(e.target.value)}/><button type="button" aria-label="نمایش رمز عبور" className="inline-icon" onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div></label>
          <label>کد امنیتی<div className="captcha-row"><div className="captcha-picture">{captcha ? <img src={captcha.image} alt="تصویر کد امنیتی" /> : <span>در حال بارگذاری</span>}<button type="button" title="کد جدید" onClick={refreshCaptcha}><RefreshCw size={17}/></button></div><input dir="ltr" value={answer} maxLength={5} required autoComplete="off" placeholder="کد تصویر" onChange={e => setAnswer(e.target.value.toUpperCase())}/></div></label>
          <button type="submit" className="primary-btn full-btn" disabled={busy || !captcha}>{busy ? 'در حال ورود...' : 'ورود به پنل'} <ArrowLeft size={18}/></button>
        </form>
        <div className="portal-link">ورود به <button onClick={() => nav(management ? '/login/employee' : '/login/management')}>{management ? 'پنل کارکنان' : 'پنل مدیران'} <ArrowUpLeft size={14}/></button></div>
      </div>
      <div className="login-footer">© DSS Studio · اطلاعات سازمان شما محرمانه است.</div>
    </section>
  </div>;
}

function Layout({ area, user, onLogout }) {
  const nav = useNavigate();
  const isManager = area === 'management';
  const [brand, setBrand] = useState(null);
  const [tab, setTab] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  async function refresh() {
    try {
      const result = await api('/datasets');
      setDatasets(result);
      if (isManager) setDashboard(await api('/dashboard'));
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { api('/branding/' + area).then(setBrand).catch(() => {}); refresh(); }, [area]);
  const menus = isManager ? [
    {id:'overview',name:'نمای کلی', icon: LayoutDashboard},
    {id:'explore',name:'تحلیل داده‌ها', icon: BarChart3},
    {id:'files',name:'مرکز داده‌ها', icon: Database},
    ...(user.role === 'admin' ? [{id:'users',name:'مدیریت کاربران',icon:Users},{id:'branding',name:'برند سازمان',icon:Settings2}] : [])
  ] : [
    {id:'overview',name:'نمای کلی',icon:LayoutDashboard},
    {id:'upload',name:'بارگذاری فایل',icon:UploadCloud},
    {id:'files',name:'فایل‌های من',icon:Files},
    {id:'explore',name:'مشاهده داده‌ها',icon:BarChart3}
  ];
  const title = menus.find(m=>m.id === tab)?.name || 'داشبورد';
  function selectTab(next) { setTab(next); setMobileOpen(false); }
  function explore(id) { setSelectedId(id); selectTab('explore'); }
  async function logout() {
    try { await api('/auth/logout', {method:'POST'}); } catch {}
    setCsrf(''); onLogout(); nav('/login/' + area, {replace:true});
  }
  return <div className="app-shell">
    {mobileOpen && <div className="mobile-shade" onClick={() => setMobileOpen(false)} />}
    <aside className={'sidebar ' + (mobileOpen ? 'sidebar-open' : '')}>
      <div className="sidebar-brand"><Brand brand={brand} small/><button className="mobile-close" onClick={()=>setMobileOpen(false)}><X size={20}/></button></div>
      <div className="workspace-label">WORKSPACE / {isManager ? 'MANAGEMENT' : 'EMPLOYEE'}</div>
      <div className="sidebar-menu"><div className="side-group-title">فضای کار</div>
        {menus.map(item => <button key={item.id} className={'side-link ' + (tab===item.id ? 'active':'')} onClick={()=>selectTab(item.id)}><item.icon size={19}/><span>{item.name}</span>{tab===item.id && <span className="active-indicator"/>}</button>)}
      </div>
      <div className="sidebar-bottom">
        <div className="secure-box"><ShieldCheck size={19}/><div><strong>داده‌های امن</strong><span>دسترسی براساس نقش سازمانی</span></div></div>
        <button className="account-box" onClick={logout}><div className="avatar">{(user.name || 'ک').slice(0,1)}</div><div className="account-details"><strong>{user.name}</strong><span>{permissions[user.role]}</span></div><LogOut size={18}/></button>
      </div>
    </aside>
    <div className="app-main">
      <header className="topbar"><div className="topbar-title"><button className="menu-toggle" onClick={()=>setMobileOpen(true)}><Menu size={21}/></button><span className="breadcrumb">فضای کار <ChevronLeft size={15}/> {isManager ? 'مدیریت' : 'کارکنان'}</span><h2>{title}</h2></div><div className="topbar-actions"><span className="live-tag"><span className="live-dot"/> سامانه فعال</span><div className="avatar top-avatar">{(user.name || 'ک').slice(0,1)}</div></div></header>
      <main className="content">
        {notice && <div className="toast success"><CheckCircle2 size={18}/>{notice}<button onClick={()=>setNotice('')}><X size={16}/></button></div>}
        {error && <div className="toast failure"><AlertCircle size={18}/>{error}<button onClick={()=>setError('')}><X size={16}/></button></div>}
        {tab === 'overview' && <Overview area={area} user={user} datasets={datasets} dashboard={dashboard} onExplore={explore} onChange={selectTab}/>}
        {tab === 'upload' && <Uploader onDone={async name=>{setNotice('فایل «' + name + '» با موفقیت تحلیل و ثبت شد.'); await refresh(); selectTab('files');}}/>}
        {tab === 'files' && <FilesPage datasets={datasets} area={area} onExplore={explore} onUpload={()=>selectTab('upload')}/>}
        {tab === 'explore' && <Explorer datasets={datasets} selectedId={selectedId} onSelect={setSelectedId} canAI={isManager}/>}
        {tab === 'users' && user.role === 'admin' && <UsersPage/>}
        {tab === 'branding' && user.role === 'admin' && <BrandingPage onSaved={()=>api('/branding/' + area).then(setBrand)}/>}
      </main>
    </div>
  </div>;
}

function Stat({ title, value, icon: Icon, hint, tone = 'mint' }) {
  return <div className="stat-card"><div className="stat-top"><span>{title}</span><div className={'stat-icon ' + tone}><Icon size={20}/></div></div><div className="stat-value">{num(value)}</div><div className="stat-foot">{hint}</div></div>;
}

function Overview({area,user,datasets,dashboard,onExplore,onChange}) {
  const manager = area === 'management';
  const sum = datasets.reduce((a,d)=>a+d.row_count,0);
  const newest = datasets.slice(0,5);
  return <>
    <div className="page-intro"><div><div className="overline">DSS / PERFORMANCE INTELLIGENCE</div><h1>سلام، {user.name.split(' ')[0]} <span className="hello">✳</span></h1><p>{manager ? 'دیدی جامع از داده‌ها، شاخص‌ها و جریان فعالیت سازمان در یک نگاه.' : 'فایل‌های عملکردی را بارگذاری کنید و خروجی پردازش را مشاهده کنید.'}</p></div><span className="date-tag"><CalendarDays size={16}/>{new Date().toLocaleDateString('fa-IR', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span></div>
    <div className="stats-grid">
      <Stat title="فایل‌های ثبت‌شده" value={manager ? dashboard?.datasets : datasets.length} icon={FolderOpen} hint="فایل‌های Excel و CSV"/>
      <Stat title="رکوردهای پردازش‌شده" value={manager ? dashboard?.records : sum} icon={Database} hint="ردیف‌های قابل تحلیل" tone="violet"/>
      <Stat title={manager ? 'کارکنان ثبت‌شده' : 'فایل‌های اخیر'} value={manager ? dashboard?.employees : newest.length} icon={manager ? Users : FileSpreadsheet} hint={manager ? 'حساب‌های کارمندی' : 'در فهرست فعالیت‌ها'} tone="amber"/>
      <Stat title="موتور تحلیل" value={datasets.length ? datasets.length : 0} icon={Activity} hint="منابع آماده برای نمودار" tone="blue"/>
    </div>
    <div className="overview-grid">
      <section className="panel recent-panel"><div className="panel-head"><div><span className="panel-eyebrow">DATA SOURCES</span><h3>آخرین فایل‌های ثبت‌شده</h3></div><button className="text-button" onClick={()=>onChange('files')}>مشاهده همه <ArrowLeft size={16}/></button></div>
        {newest.length ? <div className="file-list">{newest.map(d => <button className="file-entry" key={d.id} onClick={()=>onExplore(d.id)}><div className="file-icon"><FileSpreadsheet size={20}/></div><div className="file-meta"><strong dir="auto">{d.filename}</strong><span>{num(d.row_count)} رکورد · {num(d.sheet_count)} شیت</span></div><span className="file-date">{shortDate(d.created_at)}</span><ChevronLeft size={17}/></button>)}</div>
          : <Empty title="هنوز هیچ فایلی ثبت نشده است" subtitle={manager ? 'بعد از بارگذاری فایل توسط کارکنان، اطلاعات در این بخش نمایش داده می‌شود.' : 'اولین فایل Excel خود را بارگذاری کنید.'} action={manager ? null : ()=>onChange('upload')}/>}
      </section>
      <section className="panel insight-panel"><div className="insight-glow"/><div className="panel-eyebrow">SMART INSIGHTS</div><div className="insight-symbol"><Sparkles size={25}/></div><h3>از داده تا تصمیم،<br/>تنها چند کلیک.</h3><p>با انتخاب هر فایل، شاخص‌های عددی، کیفیت داده، مقایسه گروه‌ها و نمودارهای قابل تنظیم را مشاهده کنید.</p><button className="outline-light-btn" onClick={()=>onChange('explore')}>شروع تحلیل <ArrowLeft size={16}/></button><div className="insight-decoration"><span/><span/><span/><span/><span/><span/><span/></div></section>
    </div>
    <div className="quick-actions"><div><strong>دسترسی سریع</strong><span>فرایند بعدی خود را انتخاب کنید</span></div><div className="quick-buttons">{!manager && <button onClick={()=>onChange('upload')}><UploadCloud size={19}/> فایل جدید</button>}<button onClick={()=>onChange('explore')}><BarChart3 size={19}/> ساخت نمودار</button><button onClick={()=>onChange('files')}><Table2 size={19}/> مرور داده‌ها</button></div></div>
  </>;
}
function Empty({title,subtitle,action}) {
  return <div className="empty"><div className="empty-symbol"><Database size={32}/></div><h4>{title}</h4><p>{subtitle}</p>{action && <button className="primary-btn" onClick={action}>بارگذاری فایل <ArrowLeft size={17}/></button>}</div>;
}
function Uploader({onDone}) {
  const [file, setFile] = useState(null);
  const [dragging,setDragging] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const input = useRef();
  async function upload() {
    if (!file) return;
    setError('');setBusy(true);
    const body = new FormData();body.append('file',file);
    try { await api('/datasets',{method:'POST',body});onDone(file.name);setFile(null); }
    catch(ex){setError(ex.message);}
    finally{setBusy(false);}
  }
  function setIncoming(candidate){if(candidate){setFile(candidate);setError('');}}
  return <div className="subpage"><div className="page-intro"><div><div className="overline">DATA INGESTION</div><h1>بارگذاری داده‌های جدید</h1><p>فایل‌های Excel و CSV را به فضای کاری سازمان اضافه کنید.</p></div></div>
    <section className="panel uploader-panel"><div className="panel-head"><div><span className="panel-eyebrow">UPLOAD CENTER</span><h3>انتخاب فایل</h3></div><div className="mini-badge"><ShieldCheck size={15}/> پردازش امن</div></div>
      <div className={'dropzone ' + (dragging ? 'dragging' : '')} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);setIncoming(e.dataTransfer.files?.[0]);}} onClick={()=>input.current?.click()} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')input.current?.click();}}>
        <div className="upload-symbol"><UploadCloud size={35}/></div><h3>فایل خود را اینجا رها کنید</h3><p>یا برای انتخاب از سیستم خود کلیک کنید</p><span className="upload-types">XLSX و CSV · حداکثر ۱۲ مگابایت · ۴۰ هزار ردیف</span><input ref={input} type="file" hidden accept=".xlsx,.csv" onChange={e=>setIncoming(e.target.files?.[0])}/>
      </div>
      {file && <div className="pending-file"><div className="file-icon"><FileSpreadsheet size={22}/></div><div><strong dir="auto">{file.name}</strong><span>{(file.size/1024/1024).toFixed(2)} MB</span></div><button className="icon-button" onClick={()=>setFile(null)}><X size={18}/></button></div>}
      <Message>{error}</Message>
      <div className="upload-bottom"><p><ShieldCheck size={16}/> فقط اطلاعات مجاز سازمان را بارگذاری کنید. فایل پس از اعتبارسنجی ثبت می‌شود.</p><button className="primary-btn" disabled={!file||busy} onClick={upload}>{busy ? 'در حال پردازش...' : 'پردازش و ثبت فایل'} <ArrowLeft size={17}/></button></div>
    </section>
    <div className="steps-row"><div><span>01</span><strong>انتخاب فایل</strong><p>Excel یا CSV</p></div><div><span>02</span><strong>تشخیص ساختار</strong><p>ستون‌ها و شیت‌ها</p></div><div><span>03</span><strong>آماده تحلیل</strong><p>نمایش در داشبورد</p></div></div>
  </div>;
}
function FilesPage({datasets,area,onExplore,onUpload}) {
  const [query,setQuery] = useState('');
  const found = datasets.filter(d=>d.filename.toLowerCase().includes(query.toLowerCase()) || (d.owner||'').includes(query));
  return <div className="subpage"><div className="page-intro"><div><div className="overline">DATA LIBRARY</div><h1>{area==='management'?'مرکز داده‌های سازمان':'فایل‌های بارگذاری‌شده'}</h1><p>مرور منابع ثبت‌شده، مشاهده شیت‌ها و شروع تحلیل اطلاعات.</p></div>{area!=='management' && <button className="primary-btn" onClick={onUpload}><Plus size={17}/> افزودن فایل</button>}</div>
    <section className="panel table-panel"><div className="panel-head"><div><span className="panel-eyebrow">DATASETS</span><h3>فهرست فایل‌ها <span className="count-pill">{num(found.length)}</span></h3></div><div className="search-field"><Search size={17}/><input placeholder="جست‌وجو در فایل‌ها..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
      {found.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>نام فایل</th><th>ثبت‌کننده</th><th>ردیف‌ها</th><th>شیت‌ها</th><th>تاریخ</th><th>عملیات</th></tr></thead><tbody>{found.map(d=><tr key={d.id}><td><div className="table-file"><span className="file-icon tiny"><FileSpreadsheet size={17}/></span><strong dir="auto">{d.filename}</strong></div></td><td>{d.owner}</td><td>{num(d.row_count)}</td><td>{num(d.sheet_count)}</td><td>{shortDate(d.created_at)}</td><td><button className="table-action" onClick={()=>onExplore(d.id)}>تحلیل فایل <ArrowLeft size={15}/></button></td></tr>)}</tbody></table></div> : <Empty title="فایلی پیدا نشد" subtitle="پس از بارگذاری، فایل‌ها در اینجا نمایش داده می‌شوند." action={area==='management'?null:onUpload}/>}
    </section>
  </div>;
}
function Plot({data,type,unit}) {
  const common = {data,margin:{top:12,right:10,bottom:6,left:2}};
  const tooltip = <Tooltip contentStyle={{background:'#1a253c',border:'1px solid #39465f',borderRadius:12,color:'#e5edfa',fontSize:12}} labelStyle={{color:'#e5edfa'}}/>;
  if (!data?.length) return <Empty title="داده‌ای برای این نمودار نیست" subtitle="ستون یا نوع محاسبه دیگری انتخاب کنید."/>;
  return <div className="plot" dir="ltr"><ResponsiveContainer width="100%" height={320}>
    {type==='pie' ? <RePieChart><Pie data={data} nameKey="name" dataKey="value" innerRadius={72} outerRadius={118} paddingAngle={3} label={({percent})=>((percent||0)*100).toFixed(0)+'%'}>{data.map((d,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie>{tooltip}<Legend/></RePieChart>
    :type==='line' ? <ReLineChart {...common}><CartesianGrid stroke="#26334b" strokeDasharray="4 6"/><XAxis dataKey="name" tick={{fill:'#9eaac2',fontSize:11}} interval="preserveStartEnd"/><YAxis tick={{fill:'#9eaac2',fontSize:12}} width={50}/>{tooltip}<Line type="monotone" dataKey="value" name={unit} stroke="#29d9ac" strokeWidth={3} dot={{r:4,fill:'#29d9ac'}}/></ReLineChart>
    :type==='area' ? <AreaChart {...common}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#29d9ac" stopOpacity=".4"/><stop offset="95%" stopColor="#29d9ac" stopOpacity=".02"/></linearGradient></defs><CartesianGrid stroke="#26334b" strokeDasharray="4 6"/><XAxis dataKey="name" tick={{fill:'#9eaac2',fontSize:11}} interval="preserveStartEnd"/><YAxis tick={{fill:'#9eaac2',fontSize:12}} width={50}/>{tooltip}<Area type="monotone" dataKey="value" name={unit} stroke="#29d9ac" fill="url(#chartFill)" strokeWidth={3}/></AreaChart>
    : <BarChart {...common}><CartesianGrid stroke="#26334b" strokeDasharray="4 6"/><XAxis dataKey="name" tick={{fill:'#9eaac2',fontSize:11}} interval="preserveStartEnd"/><YAxis tick={{fill:'#9eaac2',fontSize:12}} width={50}/>{tooltip}<Bar dataKey="value" name={unit} fill="#29d9ac" maxBarSize={55} radius={[7,7,0,0]}/></BarChart>}</ResponsiveContainer></div>;
}
function Explorer({datasets,selectedId,onSelect,canAI}) {
  const [detail,setDetail] = useState(null);
  const [sheetId,setSheetId] = useState('');
  const [group,setGroup] = useState('');
  const [metric,setMetric] = useState('');
  const [operation,setOperation] = useState('count');
  const [type,setType] = useState('bar');
  const [plot,setPlot] = useState(null);
  const [analysis,setAnalysis] = useState(null);
  const [processing,setProcessing] = useState(false);
  const [error,setError] = useState('');
  const id = selectedId || datasets[0]?.id;
  useEffect(()=>{
    if(!id){setDetail(null);return;}
    let active = true;
    setDetail(null);setAnalysis(null);setPlot(null);
    api('/datasets/'+id).then(d=>{if(active){setDetail(d);setSheetId(String(d.sheets[0]?.id||''));}}).catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;};
  },[id]);
  const sheet = detail?.sheets.find(s=>String(s.id)===String(sheetId));
  useEffect(()=>{
    if(!sheet)return;
    const cats = sheet.columns.filter(c=>!sheet.preview.length||typeof sheet.preview[0]?.[c] !== 'number');
    setGroup(cats[0] || sheet.columns[0] || '');
    setMetric(sheet.columns.find(c=>typeof sheet.preview.find(r=>r[c]!==null)?.[c] === 'number') || sheet.columns[0] || '');
    setOperation('count');
    setAnalysis(null);
  },[sheetId, detail]);
  useEffect(()=>{
    if(!sheet)return;
    let active = true;
    api('/datasets/'+id+'/analysis?sheet_id='+sheet.id).then(v=>{if(active)setAnalysis(v);}).catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;};
  },[id,sheetId,detail]);
  useEffect(()=>{
    if(!sheet || !group)return;
    let active=true;
    const qs = new URLSearchParams({sheet_id: String(sheet.id),group,metric,operation});
    api('/datasets/'+id+'/chart?'+qs).then(v=>{if(active)setPlot(v);}).catch(e=>{if(active){setError(e.message);setPlot(null);}});
    return()=>{active=false;};
  },[id,sheetId,group,metric,operation,detail]);
  async function runAi(){
    if(!sheet)return;
    setProcessing(true);setError('');
    try{setAnalysis(await api('/datasets/'+id+'/analysis?sheet_id='+sheet.id+'&ai=true'));}
    catch(e){setError(e.message);}
    finally{setProcessing(false);}
  }
  const numericColumns = (analysis?.columns || []).filter(c=>c.kind==='numeric');
  return <div className="subpage">
    <div className="page-intro"><div><div className="overline">ANALYTICS LAB</div><h1>آزمایشگاه تحلیل داده <span className="hello">✧</span></h1><p>هر ستون را به شاخص، نمودار یا گزارش تحلیلی تبدیل کنید.</p></div></div>
    {!datasets.length ? <section className="panel"><Empty title="هنوز منبعی برای تحلیل وجود ندارد" subtitle="با اولین فایل بارگذاری‌شده، امکان ساخت نمودار فعال می‌شود."/></section> : <>
      <div className="filter-bar"><label>منبع داده<select value={id||''} onChange={e=>onSelect(Number(e.target.value))}>{datasets.map(d=><option value={d.id} key={d.id}>{d.filename}</option>)}</select></label><label>شیت<select value={sheetId} onChange={e=>setSheetId(e.target.value)}>{detail?.sheets.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><div className="filter-summary"><Database size={18}/>{num(sheet?.row_count)} رکورد</div></div>
      <Message>{error}</Message>
      {!detail ? <Spinner/> : !sheet ? <Empty title="شیتی وجود ندارد" subtitle="ساختار فایل را بررسی کنید."/> : <>
        <section className="panel chart-builder"><div className="panel-head"><div><span className="panel-eyebrow">CHART BUILDER</span><h3>طراح نمودار تعاملی</h3></div><span className="mini-badge"><Activity size={15}/> براساس داده‌های واقعی</span></div>
          <div className="chart-toolbar"><label>گروه‌بندی<select value={group} onChange={e=>setGroup(e.target.value)}>{sheet.columns.map(c=><option key={c} value={c}>{c}</option>)}</select></label><label>عملیات<select value={operation} onChange={e=>setOperation(e.target.value)}><option value="count">تعداد رکوردها</option><option value="sum">مجموع</option><option value="avg">میانگین</option></select></label>{operation!=='count' && <label>شاخص عددی<select value={metric} onChange={e=>setMetric(e.target.value)}>{sheet.columns.map(c=><option key={c} value={c}>{c}</option>)}</select></label>}</div>
          <div className="chart-topline"><div><strong>{operation==='count'?'تعداد رکوردها':operation==='sum'?'مجموع':'میانگین'} براساس {group}</strong><span>{num(plot?.data?.length)} گروه قابل نمایش</span></div><div className="chart-types">{[{id:'bar',icon:BarChart3},{id:'line',icon:LineChart},{id:'area',icon:Activity},{id:'pie',icon:PieChart}].map(i=><button key={i.id} title={i.id} className={type===i.id?'selected':''} onClick={()=>setType(i.id)}><i.icon size={17}/></button>)}</div></div>
          <Plot data={plot?.data} type={type} unit={operation==='count'?'تعداد':metric}/>
        </section>
        <div className="analysis-grid"><section className="panel"><div className="panel-head"><div><span className="panel-eyebrow">AUTOMATIC ANALYSIS</span><h3>یافته‌های داده</h3></div><Sparkles size={20} color="#29d9ac"/></div>{analysis ? <><div className="finding-list">{analysis.notes.map((note,i)=><div key={i} className="finding"><span className="finding-index">{String(i+1).padStart(2,'0')}</span><p>{note}</p></div>)}</div>{canAI && <button className="subtle-btn" disabled={processing} onClick={runAi}><Sparkles size={17}/>{processing?'در حال تحلیل...':'تفسیر تکمیلی با AI (در صورت تنظیم سرویس)'}</button>}{analysis.ai_text && <div className="ai-answer">{analysis.ai_text}</div>}</> : <Spinner/>}</section>
          <section className="panel"><div className="panel-head"><div><span className="panel-eyebrow">DATA QUALITY</span><h3>پروفایل ستون‌ها</h3></div><span className="count-pill">{num(analysis?.columns.length)}</span></div><div className="column-profiles">{analysis?.columns.map(c=><div className="column-profile" key={c.name}><div><strong>{c.name}</strong><span>{c.kind==='numeric'?'عددی':'دسته‌ای'}</span></div><div><b>{c.kind==='numeric'?num(c.avg):num(c.unique)}</b><small>{c.kind==='numeric'?'میانگین':'مقدار متمایز'}</small></div><div className="missing-pill">{num(c.missing)} خالی</div></div>)}</div></section></div>
        <section className="panel preview-panel"><div className="panel-head"><div><span className="panel-eyebrow">SOURCE PREVIEW</span><h3>پیش‌نمایش داده خام</h3></div><span className="mini-badge"><Table2 size={16}/> ۱۰ سطر اول</span></div><div className="table-scroll"><table className="data-table"><thead><tr>{sheet.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{sheet.preview.map((row,i)=><tr key={i}>{sheet.columns.map(c=><td key={c}>{row[c]===null?'—':String(row[c])}</td>)}</tr>)}</tbody></table></div></section>
      </>}
    </>}
  </div>;
}
function UsersPage(){
  const [users,setUsers]=useState([]);
  const [open,setOpen]=useState(false);
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [role,setRole]=useState('employee');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  async function load(){try{setUsers(await api('/users'));}catch(e){setError(e.message);}}
  useEffect(()=>{load();},[]);
  async function create(e){e.preventDefault();setBusy(true);setError('');
    try{await api('/users',{method:'POST',body:{name,email,password,role}});setOpen(false);setName('');setEmail('');setPassword('');await load();}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <div className="subpage"><div className="page-intro"><div><div className="overline">ACCESS MANAGEMENT</div><h1>مدیریت کاربران</h1><p>حساب‌های سازمانی را ایجاد و نقش دسترسی را تعیین کنید.</p></div><button className="primary-btn" onClick={()=>setOpen(true)}><Plus size={18}/> کاربر جدید</button></div><Message>{error}</Message><section className="panel table-panel"><div className="panel-head"><div><span className="panel-eyebrow">TEAM DIRECTORY</span><h3>کاربران سازمان <span className="count-pill">{num(users.length)}</span></h3></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>کاربر</th><th>ایمیل</th><th>سطح دسترسی</th><th>وضعیت</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td><div className="table-file"><span className="avatar small-avatar">{u.name.slice(0,1)}</span><strong>{u.name}</strong></div></td><td dir="ltr">{u.email}</td><td>{permissions[u.role]}</td><td><span className={'status-pill '+(u.active?'online':'offline')}>{u.active?'فعال':'غیرفعال'}</span></td></tr>)}</tbody></table></div></section>
    {open && <div className="modal-overlay" onClick={()=>setOpen(false)}><div className="modal-card" onClick={e=>e.stopPropagation()}><div className="modal-header"><div><span className="overline">ADD TEAM MEMBER</span><h2>ایجاد حساب کاربری</h2></div><button className="icon-button" onClick={()=>setOpen(false)}><X size={20}/></button></div><Message>{error}</Message><form className="settings-form" onSubmit={create}><label>نام و نام خانوادگی<input required value={name} onChange={e=>setName(e.target.value)} minLength={2}/></label><label>آدرس ایمیل<input type="email" dir="ltr" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>رمز عبور (حداقل ۱۴ کاراکتر)<input type="password" dir="ltr" minLength={14} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>نقش سازمانی<select value={role} onChange={e=>setRole(e.target.value)}><option value="employee">کارمند</option><option value="manager">مدیر</option><option value="admin">مدیر سامانه</option></select></label><button disabled={busy} className="primary-btn full-btn" type="submit">{busy?'در حال ایجاد...':'ایجاد کاربر'} <ArrowLeft size={18}/></button></form></div></div>}
  </div>;
}
function BrandingPage({onSaved}){
  const [area,setArea]=useState('employee');
  const [name,setName]=useState('');
  const [existing,setExisting]=useState(null);
  const [upload,setUpload]=useState(null);
  const [clear,setClear]=useState(false);
  const [error,setError]=useState('');
  const [saved,setSaved]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{setSaved('');setUpload(null);setClear(false);api('/branding/'+area).then(data=>{setExisting(data);setName(data.company_name);}).catch(e=>setError(e.message));},[area]);
  async function save(e){e.preventDefault();setBusy(true);setError('');setSaved('');
    try{const form = new FormData();form.append('company_name',name);form.append('clear_logo',String(clear));if(upload)form.append('logo',upload);const data=await api('/settings/branding/'+area,{method:'PUT',body:form});setExisting(data);setUpload(null);setClear(false);setSaved('تنظیمات برند با موفقیت ذخیره شد.');onSaved();}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  const image = clear ? null : upload ? URL.createObjectURL(upload) : existing?.logo;
  return <div className="subpage"><div className="page-intro"><div><div className="overline">WHITE LABEL SETTINGS</div><h1>هویت بصری سازمان</h1><p>عنوان و لوگوی صفحه ورود کارمندان و مدیران را به‌طور مستقل شخصی‌سازی کنید.</p></div></div><div className="brand-tabs"><button className={area==='employee'?'selected':''} onClick={()=>setArea('employee')}><Users size={17}/> ورود کارکنان</button><button className={area==='management'?'selected':''} onClick={()=>setArea('management')}><ShieldCheck size={17}/> ورود مدیران</button></div>
    <div className="branding-grid"><section className="panel"><div className="panel-head"><div><span className="panel-eyebrow">IDENTITY DESIGN</span><h3>تنظیمات برند</h3></div></div><Message>{error}</Message>{saved && <div className="message message-success"><CheckCircle2 size={17}/>{saved}</div>}<form onSubmit={save} className="settings-form"><label>نام شرکت یا سازمان<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label>لوگوی شرکت<span className="label-hint">PNG، JPEG یا WebP · حداکثر ۱ مگابایت</span><div className="brand-drop"><div className="brand-preview-icon">{image ? <img alt="پیش‌نمایش لوگو" src={image}/> : <Building2 size={28}/>}</div><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{setUpload(e.target.files?.[0]||null);setClear(false);}}/></div></label><label className="check-label"><input type="checkbox" checked={clear} onChange={e=>setClear(e.target.checked)}/> حذف لوگوی فعلی و استفاده از نماد پیش‌فرض</label><button className="primary-btn" disabled={busy}>{busy?'در حال ذخیره...':'ذخیره تنظیمات'} <CheckCircle2 size={18}/></button></form></section>
      <section className="panel brand-demo"><span className="panel-eyebrow">LIVE PREVIEW</span><h3>پیش‌نمایش صفحه ورود</h3><div className="preview-window"><div className="preview-window-top"><span/><span/><span/></div><div className="mini-login"><Brand brand={{company_name:name,logo:image}}/><div className="mini-welcome">خوش آمدید ✦</div><p>برای ورود به سامانه اطلاعات خود را وارد کنید.</p><div className="fake-input"/><div className="fake-input"/><div className="fake-button">ورود به پنل</div></div></div><p className="preview-note">این تغییر برای همه کاربران پنل انتخاب‌شده اعمال خواهد شد.</p></section></div>
  </div>;
}
export default function App(){
  const [user,setUser]=useState(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{api('/auth/me').then(data=>{setUser(data.user);setCsrf(data.csrf);}).catch(()=>{}).finally(()=>setReady(true));},[]);
  if(!ready)return <div className="app-loader"><Sparkles size={38}/><Spinner label="در حال آماده‌سازی فضای کاری..."/></div>;
  const home = user ? (user.role === 'employee' ? '/employee' : '/management') : '/login/employee';
  function guard(area) {
    if(!user)return <Navigate to={'/login/'+area} replace/>;
    if(area==='management'&&user.role==='employee')return <Navigate to="/employee" replace/>;
    return <Layout area={area} user={user} onLogout={()=>setUser(null)}/>;
  }
  return <Routes>
    <Route path="/" element={<Navigate to={home} replace/>}/>
    <Route path="/login/employee" element={user ? <Navigate to={home} replace/> : <PortalLogin area="employee" onLogin={setUser}/>}/>
    <Route path="/login/management" element={user ? <Navigate to={home} replace/> : <PortalLogin area="management" onLogin={setUser}/>}/>
    <Route path="/employee" element={guard('employee')}/>
    <Route path="/management" element={guard('management')}/>
    <Route path="*" element={<Navigate to={home} replace/>}/>
  </Routes>;
}
