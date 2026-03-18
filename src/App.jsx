import { useState, useEffect } from "react";

const BACKEND_URL = "http://localhost:3002";

const INSIGHT_TYPES = [
  { id: "incomplete", label: "Incomplete Sprint Items", icon: "📋",
    desc: "Current sprint issues missing parent, due date, or assignee",
    color: "border-l-blue-400", accent: "blue" },
  { id: "jira_config", label: "Jira Configuration Tips", icon: "⚙️",
    desc: "Specific configuration improvements with supporting detail",
    color: "border-l-green-400", accent: "green" },
];

// ── Small reusable components ─────────────────────────────────────────────────

function Badge({ color, children }) {
  const c = { blue: "bg-blue-100 text-blue-800", green: "bg-green-100 text-green-800",
    gray: "bg-gray-100 text-gray-600", orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c[color] || c.gray}`}>{children}</span>;
}

function TagInput({ label, placeholder, values, onChange }) {
  const [input, setInput] = useState("");
  const add = () => { const v = input.trim(); if (v && !values.includes(v)) onChange([...values, v]); setInput(""); };
  const remove = v => onChange(values.filter(x => x !== v));
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder={placeholder} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()} />
        <button onClick={add} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full">
            {v}<button onClick={() => remove(v)} className="text-blue-400 hover:text-blue-700 font-bold">×</button>
          </span>
        ))}
        {values.length === 0 && <span className="text-xs text-gray-400 italic">None added — agent will scan all accessible</span>}
      </div>
    </div>
  );
}

function EffortBadge({ effort }) {
  const s = { Low: "bg-green-50 border-green-200 text-green-700",
    Medium: "bg-yellow-50 border-yellow-200 text-yellow-700",
    High: "bg-red-50 border-red-200 text-red-700" };
  if (!effort) return null;
  return <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${s[effort] || s.Medium}`}>{effort} effort</span>;
}

function MissingBadge({ label }) {
  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 whitespace-nowrap">{label}</span>;
}

// ── MissingFieldInputs ────────────────────────────────────────────────────────
// FIX 1 — assignee is now a searchable dropdown using real accountIds from /api/jira/members
// FIX 3 — "team" field removed entirely

function MissingFieldInputs({ missing, values, onChange, members }) {
  if (!missing || missing.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fill in missing fields</div>
      {missing.map(field => {
        const val = values[field] || "";
        const set = v => onChange({ ...values, [field]: v });

        if (field === "due date") return (
          <div key={field} className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-24 shrink-0">Due date</label>
            <input type="date" value={val} onChange={e => set(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        );

        if (field === "assignee") return (
          <div key={field} className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-24 shrink-0">Assignee</label>
            {members.length > 0 ? (
              <select value={val} onChange={e => set(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
                <option value="">— select person —</option>
                {members.map(m => (
                  <option key={m.accountId} value={m.accountId}>{m.displayName}</option>
                ))}
              </select>
            ) : (
              <input type="text" placeholder="Loading members…" disabled
                className="flex-1 border border-gray-100 rounded-lg px-2 py-1 text-sm bg-gray-50 text-gray-400" />
            )}
          </div>
        );

        if (field === "parent") return (
          <div key={field} className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-24 shrink-0">Parent epic</label>
            <input type="text" placeholder="e.g. ENG-100" value={val} onChange={e => set(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        );

        return null;
      })}
    </div>
  );
}

// ── ConfigTipRow ──────────────────────────────────────────────────────────────

function ConfigTipRow({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        <span className="text-green-500 mt-0.5">💡</span>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800">{item.action}</div>
          <div className="text-xs text-gray-500 mt-0.5">{item.rationale}</div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <EffortBadge effort={item.effort} />
          <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {item.detail && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">What we found</div>
              <div className="text-sm text-gray-700 leading-relaxed">{item.detail}</div>
            </div>
          )}
          {item.recommendation && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Recommendation</div>
              <div className="text-sm text-green-800 leading-relaxed">{item.recommendation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── IncompleteItemRow ─────────────────────────────────────────────────────────
// FIX 1 — shows existing assignee displayName when already set
// FIX 2 — accepts onSaveSuccess callback to remove item from list after Jira write

function IncompleteItemRow({ item, checked, onToggle, fieldValues, onFieldChange, members, onSaveSuccess }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const missing = item.missing || [];
  const filledCount = missing.filter(f => fieldValues[f] && fieldValues[f].toString().trim()).length;
  const allFilled = missing.length > 0 && filledCount === missing.length;

  // Resolve accountId → displayName for the badge preview
  const assigneeLabel = (accountId) => {
    const m = members.find(x => x.accountId === accountId);
    return m ? m.displayName : accountId;
  };

  // FIX 2 — save directly from the row, then remove on success
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const update = {};
    if (fieldValues["due date"]) update.duedate  = fieldValues["due date"];
    if (fieldValues["assignee"]) update.assignee = fieldValues["assignee"]; // accountId
    if (fieldValues["parent"])   update.parent   = fieldValues["parent"];

    try {
      const r = await fetch(`${BACKEND_URL}/api/jira/issue/${item.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: update }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(JSON.stringify(err));
      }
      // Tell parent to remove this item from findings
      onSaveSuccess(item.key);
    } catch (e) {
      setSaveError(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3 px-4 py-3">
        <input type="checkbox" className="mt-1 accent-blue-600" checked={checked} onChange={onToggle} />
        <button onClick={() => setOpen(o => !o)} className="flex-1 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-blue-700 font-mono">{item.key}</span>
            <span className="text-sm text-gray-700">{item.summary}</span>
            {/* FIX 1 — show current assignee when already populated */}
            {item.assignee && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                👤 {item.assignee}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {missing.map(m => {
              const val = fieldValues[m];
              const filled = val && val.toString().trim();
              const display = m === "assignee" && filled ? assigneeLabel(val) : val;
              return filled
                ? <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 whitespace-nowrap">✓ {m}: {display}</span>
                : <MissingBadge key={m} label={"Missing " + m} />;
            })}
          </div>
        </button>
        <span className="text-gray-400 text-xs mt-1 cursor-pointer select-none" onClick={() => setOpen(o => !o)}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {item.detail && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Issue Detail</div>
              <div className="text-sm text-blue-900 leading-relaxed">{item.detail}</div>
            </div>
          )}

          <MissingFieldInputs missing={missing} values={fieldValues} onChange={onFieldChange} members={members} />

          {/* Status / action area */}
          {allFilled && (
            <div className="space-y-2">
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                ✅ All fields filled — ready to save to Jira.
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
                {saving ? "Saving…" : `💾 Save ${item.key} to Jira`}
              </button>
            </div>
          )}
          {!allFilled && missing.length > 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ Fill in all missing fields above to save.
            </div>
          )}
          {saveError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {saveError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── InsightCard ───────────────────────────────────────────────────────────────

function InsightCard({ insight, finding, selectedItems, onToggle, fieldValues, onFieldChange, members, onItemSaved }) {
  const id = insight.id;
  const items = finding.items || [];
  const checkedCount = items.filter((_, i) => selectedItems.includes(i)).length;

  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${insight.color} rounded-lg shadow-sm overflow-hidden`}>
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{insight.icon}</span>
            <span className="font-semibold text-gray-800 text-sm">{insight.label}</span>
            {id === "jira_config" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">ℹ️ Review only</span>
            )}
          </div>
          {id !== "jira_config" && checkedCount > 0 && <Badge color="blue">{checkedCount} selected</Badge>}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-2">{finding.summary}</p>
      </div>
      {items.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="px-4 py-1.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {id === "jira_config" ? "Recommendations" : "Issues to Address"}
          </div>
          <div>
            {items.map((item, i) =>
              id === "jira_config"
                ? <ConfigTipRow key={i} item={item} />
                : <IncompleteItemRow
                    key={item.key}
                    item={item}
                    checked={selectedItems.includes(i)}
                    onToggle={() => onToggle(i)}
                    fieldValues={fieldValues[i] || {}}
                    onFieldChange={vals => onFieldChange(i, vals)}
                    members={members}
                    onSaveSuccess={key => onItemSaved(id, key)}
                  />
            )}
          </div>
        </div>
      )}
      {id !== "jira_config" && items.length === 0 && (
        <div className="px-4 py-3 text-xs text-green-700 bg-green-50 border-t border-green-100">
          ✅ No incomplete items — all fields are populated.
        </div>
      )}
    </div>
  );
}

// ── Prompt builder ────────────────────────────────────────────────────────────
// FIX 3 — "team" removed from missing-field criteria
// FIX 4 — Deliverables excluded from parent requirement

function buildPrompt(selected, jiraProjects) {
  const projectScope = jiraProjects.length
    ? `Focus only on these Jira projects: ${jiraProjects.join(", ")}.`
    : "Use the most active project available.";

  const tasks = [];

  if (selected.includes("incomplete"))
    tasks.push(`"incomplete": Analyze the sprint issues provided and identify those missing any of: assignee, due date, or parent epic. NOTE: issues with issuetype = "Deliverable" do NOT require a parent — exclude that field from their missing list. For each flagged issue return:
  - "key": Jira issue key (use real keys from the data)
  - "summary": issue title
  - "issuetype": issue type name
  - "assignee": current assignee displayName if set, or null
  - "missing": array from ["assignee", "due date", "parent"] that are absent (omit "parent" for Deliverables)
  - "detail": 1-2 sentences on why the missing fields matter for this specific issue`);

  if (selected.includes("jira_config"))
    tasks.push(`"jira_config": Analyze project config and identify up to 4 configuration issues. For each return:
  - "action": short improvement title
  - "rationale": one sentence summary
  - "effort": Low / Medium / High
  - "detail": 2-3 sentences on what you observed
  - "recommendation": 2-3 sentences with a concrete fix`);

  return `You are an org-wide Jira audit agent. Analyze ONLY the real data provided below.
${projectScope}

${tasks.join("\n\n")}

Respond ONLY with valid JSON, no markdown, no backticks:
{
  ${selected.map(s => {
    if (s === "incomplete") return `"incomplete": { "summary": "...", "items": [ { "key": "...", "summary": "...", "issuetype": "...", "assignee": null, "missing": ["..."], "detail": "..." } ] }`;
    if (s === "jira_config") return `"jira_config": { "summary": "...", "items": [ { "action": "...", "rationale": "...", "effort": "Low", "detail": "...", "recommendation": "..." } ] }`;
    return `"${s}": { "summary": "...", "items": [] }`;
  }).join(",\n  ")}
}`;
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [selected, setSelected]           = useState(INSIGHT_TYPES.map(i => i.id));
  const [jiraProjects, setJiraProjects]   = useState([]);
  const [confluenceSpaces, setConfluenceSpaces] = useState([]);
  const [members, setMembers]             = useState([]);   // [{ accountId, displayName }]
  const [running, setRunning]             = useState(false);
  const [phase, setPhase]                 = useState("idle");
  const [findings, setFindings]           = useState(null); // { incomplete: { summary, items[] }, ... }
  const [selectedActions, setSelectedActions] = useState({});
  const [fieldValues, setFieldValues]     = useState({});   // { insightId: { idx: { field: val } } }
  const [savedKeys, setSavedKeys]         = useState([]);   // FIX 2 — track saved issue keys
  const [error, setError]                 = useState(null);
  const [log, setLog]                     = useState([]);

  // Load members once on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/jira/members`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMembers(data); })
      .catch(() => {}); // non-fatal
  }, []);

  const resetAll = () => {
    setFindings(null); setSelectedActions({}); setFieldValues({});
    setSavedKeys([]); setError(null); setLog([]); setPhase("idle");
  };
  const toggleInsight = id => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const addLog = msg => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const toggleAction = (insightId, itemIdx) => {
    setSelectedActions(prev => {
      const cur = prev[insightId] || [];
      return { ...prev, [insightId]: cur.includes(itemIdx) ? cur.filter(x => x !== itemIdx) : [...cur, itemIdx] };
    });
  };
  const updateFieldValue = (insightId, itemIdx, vals) => {
    setFieldValues(prev => ({ ...prev, [insightId]: { ...(prev[insightId] || {}), [itemIdx]: vals } }));
  };

  // FIX 2 — called by IncompleteItemRow after a successful Jira write
  const handleItemSaved = (insightId, issueKey) => {
    addLog(`✅ ${issueKey} saved to Jira — removing from list`);
    setSavedKeys(prev => [...prev, issueKey]);
    // Remove the item from findings so it disappears from the UI
    setFindings(prev => {
      if (!prev?.[insightId]) return prev;
      return {
        ...prev,
        [insightId]: {
          ...prev[insightId],
          items: prev[insightId].items.filter(i => i.key !== issueKey),
        },
      };
    });
  };

  const insightMap = Object.fromEntries(INSIGHT_TYPES.map(i => [i.id, i]));
  const canRun = !running && selected.length > 0;

  const runAgent = async () => {
    if (!canRun) return;
    resetAll();
    setRunning(true);
    addLog(`Connecting to Bedrock via ${BACKEND_URL}`);
    addLog(`Insights: ${selected.join(", ")} | Projects: ${jiraProjects.length ? jiraProjects.join(", ") : "auto"}`);

    try {
      const prompt = buildPrompt(selected, jiraProjects);
      addLog(`Prompt length: ${prompt.length} chars`);

      const resp = await fetch(`${BACKEND_URL}/api/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, projects: jiraProjects, insights: selected }),
      });
      addLog(`HTTP status: ${resp.status}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(`API error ${resp.status}: ${JSON.stringify(data)}`);

      addLog(`Blocks: ${data.content?.length} | Stop: ${data.stop_reason}`);
      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      addLog(`Raw text (first 300 chars): ${text.slice(0, 300)}`);

      let parsed;
      try {
        const match = text.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);
        if (!match) throw new Error("No JSON object found");
        parsed = JSON.parse(match[0]);
      } catch (e) {
        addLog(`Full raw response: ${text}`);
        throw new Error(`JSON parse failed: ${e.message}`);
      }

      setFindings(parsed);
      setPhase("preview");
      addLog("✅ Findings ready.");
    } catch (e) {
      setError(e.message);
      addLog(`❌ Error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="text-2xl">🤖</span>
            <h1 className="text-xl font-bold text-gray-900">Org-Wide Activity Agent</h1>
            <Badge color="blue">Live Mode</Badge>
            <Badge color="green">AWS Bedrock</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Connected to Jira via Atlassian API token. Nothing changes until you save individual items.
          </p>
          {savedKeys.length > 0 && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
              ✅ Saved this session: {savedKeys.join(", ")}
            </div>
          )}
        </div>

        {/* Scope */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">🎯 Scope (optional)</h2>
          <p className="text-xs text-gray-500">Add project keys to narrow focus, or leave blank to auto-select.</p>
          <TagInput label="Jira Project Keys" placeholder="e.g. ENG, PLATFORM" values={jiraProjects} onChange={setJiraProjects} />
          <TagInput label="Confluence Space Keys" placeholder="e.g. ENGINEERING, OPS" values={confluenceSpaces} onChange={setConfluenceSpaces} />
        </div>

        {/* Insight selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Select Insight Types</h2>
          <div className="grid grid-cols-1 gap-2">
            {INSIGHT_TYPES.map(({ id, label, icon, desc }) => {
              const active = selected.includes(id);
              return (
                <button key={id} onClick={() => toggleInsight(id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all
                    ${active ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}>
                  <span className="text-lg mt-0.5">{icon}</span>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${active ? "text-blue-800" : "text-gray-700"}`}>{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                  <span className="text-lg">{active ? "✅" : "⬜"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={runAgent} disabled={!canRun}
          className={`w-full py-3 rounded-xl font-semibold text-white text-sm transition-all shadow
            ${canRun ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}`}>
          {running ? "🔍 Scanning Jira…" : "▶ Run Agent"}
        </button>

        {/* Activity log */}
        {log.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono text-green-400 space-y-1">
            <div className="flex justify-between items-center mb-2">
              <div className="text-gray-400 font-sans font-semibold text-xs">Activity Log</div>
              <button onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-300 underline">Clear</button>
            </div>
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Findings */}
        {findings && phase !== "idle" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">📊 Findings</h2>
            {selected.map(id => {
              const insight = insightMap[id];
              const finding = findings[id];
              if (!insight || !finding) return null;
              return (
                <InsightCard
                  key={id}
                  insight={insight}
                  finding={finding}
                  selectedItems={selectedActions[id] || []}
                  onToggle={idx => toggleAction(id, idx)}
                  fieldValues={fieldValues[id] || {}}
                  onFieldChange={(idx, vals) => updateFieldValue(id, idx, vals)}
                  members={members}
                  onItemSaved={handleItemSaved}
                />
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
