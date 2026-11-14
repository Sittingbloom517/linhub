import { useMemo, useState } from "react";
import { commands, distributions, guides, recoveryTopics } from "./data/content";

type Page = "overview" | "distros" | "commands" | "recovery" | "learn";

const navigation: { id: Page; label: string; symbol: string }[] = [
  { id: "overview", label: "Overview", symbol: "⌂" },
  { id: "distros", label: "Distributions", symbol: "◫" },
  { id: "commands", label: "Command library", symbol: ">_" },
  { id: "recovery", label: "Troubleshooting", symbol: "⛨" },
  { id: "learn", label: "Learn Linux", symbol: "▤" }
];

function App() {
  const [page, setPage] = useState<Page>("overview");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const [category, setCategory] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const search = query.trim().toLowerCase();

  const foundCommands = useMemo(() => commands.filter((x) => [x.command, x.title, x.description, x.category].join(" ").toLowerCase().includes(search)), [search]);
  const foundDistros = useMemo(() => distributions.filter((x) => [x.name, x.family, x.manager, x.description].join(" ").toLowerCase().includes(search)), [search]);
  const foundGuides = useMemo(() => [...guides, ...recoveryTopics.map((x) => ({ ...x, category: "Recovery", time: x.level }))].filter((x) => [x.title, x.description, x.category].join(" ").toLowerCase().includes(search)), [search]);

  const go = (next: Page) => { setPage(next); setQuery(""); setMenuOpen(false); };
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(value); }
    catch { window.prompt("Copy this command:", value); }
  };

  const titles: Record<Page, string> = {
    overview: "Your Linux command center",
    distros: "Find your distribution",
    commands: "Command library",
    recovery: "Fix what's broken",
    learn: "Build your Linux skills"
  };

  return <div className="shell">
    <aside className={"sidebar" + (menuOpen ? " sidebar-open" : "")}>
      <div className="brand"><div className="brand-mark">L<span>.</span></div><div><strong>LinHub</strong><small>THE LINUX KNOWLEDGE HUB</small></div><button className="close-menu" onClick={() => setMenuOpen(false)}>×</button></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{navigation.map((item) => <button key={item.id} className={"nav-item" + (page === item.id ? " active" : "")} onClick={() => go(item.id)}><span className="nav-symbol">{item.symbol}</span><span>{item.label}</span>{item.id === "recovery" && <i className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="tip-card"><span className="tip-spark">✳</span><strong>New to Linux?</strong><p>Start with the basics and build confidence one command at a time.</p><button onClick={() => go("learn")}>Explore guides →</button></div><div className="version"><i /> LinHub preview <span>v0.1.0</span></div></div>
    </aside>
    {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(true)}>☰</button><div className="breadcrumb">Workspace <span>/</span> <strong>{navigation.find((x) => x.id === page)?.label}</strong></div><label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search guides, commands, distros..." /><kbd>CTRL K</kbd></label><a className="github-link" href="https://github.com/Sittingbloom517/linhub" target="_blank" rel="noreferrer">GitHub ↗</a></header>
      <div className="content">
        {search ? <SearchResults query={query} commands={foundCommands} distros={foundDistros} guides={foundGuides} copied={copied} onCopy={copy} onNavigate={go} /> : <>
          <div className="page-heading"><div><div className="eyebrow"><i /> LINUX, WITHOUT THE GUESSWORK</div><h1>{titles[page]}</h1><p>{page === "overview" ? "Practical guides, essential commands, and recovery help. All in one place." : getSubtitle(page)}</p></div><span className="community-badge"><i /> COMMUNITY KNOWLEDGE</span></div>
          {page === "overview" && <Overview onNavigate={go} onCopy={copy} copied={copied} />}
          {page === "distros" && <Distros />}
          {page === "commands" && <Commands category={category} setCategory={setCategory} copied={copied} onCopy={copy} />}
          {page === "recovery" && <Recovery />}
          {page === "learn" && <Learn />}
        </>}
        <footer><span>LinHub · Open knowledge for open systems</span><span>Made for the Linux community <b>♥</b></span></footer>
      </div>
    </main>
  </div>;
}

function getSubtitle(page: Page) {
  const values: Record<Page, string> = {
    overview: "",
    distros: "Explore popular Linux distributions and learn what makes each one different.",
    commands: "A practical reference for commands you can use and understand.",
    recovery: "Structured troubleshooting for common Linux problems.",
    learn: "Short guides that make Linux easier to understand."
  };
  return values[page];
}

function Overview({ onNavigate, onCopy, copied }: { onNavigate: (p: Page) => void; onCopy: (v: string) => void; copied: string }) {
  return <>
    <section className="hero"><div className="hero-grid" /><div className="hero-copy"><div className="hero-kicker"><i /> YOUR OPEN-SOURCE FIELD GUIDE</div><h2>Linux has a lot of moving parts.<br /><span>Find the right one.</span></h2><p>From your first terminal command to recovering a system that refuses to boot, LinHub helps you make sense of Linux.</p><div className="hero-actions"><button className="primary" onClick={() => onNavigate("distros")}>Explore distributions →</button><button className="secondary" onClick={() => onNavigate("commands")}>Browse commands</button></div></div><div className="terminal-window"><div className="terminal-bar"><i /><i /><i /><span>terminal</span></div><div className="terminal-body"><p><b>levi@linux</b>:<em>~</em>$ neofetch</p><pre>{"OS: Linux\nKernel: 6.x\nShell: bash\nUptime: 2h 14m\nDesktop: Plasma"}</pre><p><b>levi@linux</b>:<em>~</em>$ <i className="cursor" /></p></div></div><div className="hero-chip">● SYSTEM READY</div></section>
    <section className="section"><div className="section-head"><div><label>QUICK ACCESS</label><h2>Where do you want to go?</h2></div><small>Pick a starting point</small></div><div className="quick-grid">
      <QuickCard tone="blue" symbol="◫" title="Linux distros" text="Install guides and comparisons" onClick={() => onNavigate("distros")} />
      <QuickCard tone="purple" symbol=">_" title="Command library" text="Find the right command" onClick={() => onNavigate("commands")} />
      <QuickCard tone="orange" symbol="⛨" title="System recovery" text="Diagnose and fix problems" onClick={() => onNavigate("recovery")} />
      <QuickCard tone="green" symbol="▤" title="Learn Linux" text="Build skills step by step" onClick={() => onNavigate("learn")} />
    </div></section>
    <section className="section lower-grid"><div className="panel"><div className="section-head"><div><label>THE TERMINAL TOOLBOX</label><h2>Useful commands</h2></div><button className="text-link" onClick={() => onNavigate("commands")}>View library →</button></div><div className="command-list">{commands.slice(0, 4).map((x) => <CommandRow key={x.command} item={x} copied={copied} onCopy={onCopy} />)}</div></div>
      <div className="panel"><div className="section-head"><div><label>WHEN THINGS GO WRONG</label><h2>Recovery guides</h2></div><span className="panel-symbol">⛨</span></div><div className="recovery-callout"><span>!</span><div><small>SYSTEM RECOVERY</small><h3>Kernel panic or freeze?</h3><p>Start with the error message and recent system changes. Avoid random fixes.</p></div></div><button className="text-link" onClick={() => onNavigate("recovery")}>Open troubleshooting hub →</button><div className="panel-foot">● Step-by-step checks, not guesswork</div></div></section>
    <section className="section"><div className="section-head"><div><label>PICK YOUR LINUX</label><h2>Popular distributions</h2></div><button className="text-link" onClick={() => onNavigate("distros")}>All distributions →</button></div><div className="distro-strip">{distributions.slice(0, 4).map((x) => <DistroMini key={x.name} item={x} />)}</div></section>
  </>;
}

function QuickCard({ tone, symbol, title, text, onClick }: { tone: string; symbol: string; title: string; text: string; onClick: () => void }) {
  return <button className="quick-card" onClick={onClick}><span className={"quick-icon " + tone}>{symbol}</span><span className="quick-text"><strong>{title}</strong><small>{text}</small></span><b>→</b></button>;
}

function CommandRow({ item, copied, onCopy }: { item: typeof commands[number]; copied: string; onCopy: (v: string) => void }) {
  return <div className="command-row"><div><code>{item.command}</code><small>{item.title}</small></div><button className={copied === item.command ? "copy copied" : "copy"} onClick={() => onCopy(item.command)}>{copied === item.command ? "✓ Copied" : "Copy"}</button></div>;
}

function DistroMini({ item }: { item: typeof distributions[number] }) {
  return <div className="distro-mini"><span className={"distro-letter " + item.color}>{item.name[0]}</span><span><strong>{item.name}</strong><small>{item.manager}</small></span></div>;
}

function Distros() {
  return <section className="section page-section"><div className="notice"><b>✳</b><p><strong>New to Linux?</strong> Try a distribution in a virtual machine first. You can explore without changing your main computer.</p></div><div className="distro-grid">{distributions.map((x) => <article className="distro-card" key={x.name}><div className="distro-card-top"><span className={"distro-letter large " + x.color}>{x.name[0]}</span><small>{x.level}</small></div><h3>{x.name}</h3><p>{x.description}</p><div className="distro-meta"><span>FAMILY</span><strong>{x.family}</strong><span>PACKAGE MANAGER</span><strong>{x.manager}</strong></div><div className="coming-soon">Installation guide <b>Coming next</b></div></article>)}</div></section>;
}

function Commands({ category, setCategory, copied, onCopy }: { category: string; setCategory: (v: string) => void; copied: string; onCopy: (v: string) => void }) {
  const categories = ["All", "System", "Storage", "Networking", "Logs"];
  const visible = category === "All" ? commands : commands.filter((x) => x.category === category);
  return <section className="section page-section"><div className="section-head"><div><label>COMMAND REFERENCE</label><h2>Everyday terminal essentials</h2></div><small>{visible.length} commands</small></div><div className="filters">{categories.map((x) => <button key={x} className={category === x ? "filter selected" : "filter"} onClick={() => setCategory(x)}>{x}</button>)}</div><div className="command-grid">{visible.map((x) => <article className="library-command" key={x.command}><div className="library-top"><span>{x.category}</span><button className={copied === x.command ? "copy copied" : "copy"} onClick={() => onCopy(x.command)}>{copied === x.command ? "✓ Copied" : "Copy"}</button></div><code>{x.command}</code><h3>{x.title}</h3><p>{x.description}</p></article>)}</div><div className="notice warning"><b>!</b><p><strong>Before running a command:</strong> read what it does, check that it matches your distribution, and be especially careful with commands that use <code>sudo</code> or modify disks and partitions.</p></div></section>;
}

function Recovery() {
  return <section className="section page-section"><div className="recovery-hero"><span>⛨</span><div><label>TROUBLESHOOTING WORKSPACE</label><h2>Diagnose first. Change things second.</h2><p>Good troubleshooting starts by collecting evidence. Make one change at a time and keep a note of what you changed.</p></div></div><div className="notice warning"><b>!</b><p><strong>Protect your data first.</strong> Back up important files before recovery work. Do not run commands copied from the internet without understanding their effects.</p></div><div className="recovery-grid">{recoveryTopics.map((x) => <article className="recovery-card" key={x.title}><div className="recovery-level">{x.level}</div><h3>{x.title}</h3><p>{x.description}</p><div className="coming-soon">Troubleshooting guide <b>Coming next</b></div></article>)}</div><div className="panel checklist"><label>FIRST STEPS</label><h2>Before you troubleshoot</h2><ul><li>Write down the exact error message.</li><li>Note what changed shortly before the problem started.</li><li>Identify your distribution and kernel version.</li><li>Check whether you can reach a recovery environment.</li><li>Back up important data before making system changes.</li></ul></div></section>;
}

function Learn() {
  return <section className="section page-section"><div className="learn-banner"><div><label>YOUR LEARNING PATH</label><h2>Understand the system.<br /><span>Don't just memorize commands.</span></h2><p>Learn the concepts behind Linux so you can solve problems on your own.</p></div><span className="learn-symbol">▤</span></div><div className="section-head"><div><label>GUIDE COLLECTION</label><h2>Start learning</h2></div><small>{guides.length} starter guides</small></div><div className="guide-grid">{guides.map((x, i) => <article className="guide-card" key={x.title}><div className="guide-number">0{i + 1}</div><label>{x.category}</label><h3>{x.title}</h3><p>{x.description}</p><div className="coming-soon">{x.time} read <b>Guide planned</b></div></article>)}</div></section>;
}

function SearchResults({ query, commands: foundCommands, distros, guides: foundGuides, copied, onCopy, onNavigate }: { query: string; commands: typeof commands; distros: typeof distributions; guides: Array<{ title: string; description: string; category: string; time: string }>; copied: string; onCopy: (v: string) => void; onNavigate: (p: Page) => void }) {
  const total = foundCommands.length + distros.length + foundGuides.length;
  return <section className="search-results"><div className="eyebrow"><i /> SEARCH LINHUB</div><h1>Results for “{query}”</h1><p>{total} matching resources</p>{total === 0 ? <div className="empty"><h2>No results found</h2><p>Try a term such as “kernel”, “network”, “Arch”, or “disk”.</p></div> : <>
    {foundCommands.length > 0 && <div className="search-group"><div className="section-head"><h2>Commands</h2><button className="text-link" onClick={() => onNavigate("commands")}>Open library →</button></div>{foundCommands.map((x) => <CommandRow key={x.command} item={x} copied={copied} onCopy={onCopy} />)}</div>}
    {distros.length > 0 && <div className="search-group"><div className="section-head"><h2>Distributions</h2><button className="text-link" onClick={() => onNavigate("distros")}>View all →</button></div><div className="distro-strip">{distros.map((x) => <DistroMini key={x.name} item={x} />)}</div></div>}
    {foundGuides.length > 0 && <div className="search-group"><div className="section-head"><h2>Guides and recovery</h2><button className="text-link" onClick={() => onNavigate("learn")}>Learning hub →</button></div>{foundGuides.map((x) => <div className="search-guide" key={x.title}><div><small>{x.category}</small><h3>{x.title}</h3><p>{x.description}</p></div><span>{x.time}</span></div>)}</div>}
  }</section>;
}

export default App;
