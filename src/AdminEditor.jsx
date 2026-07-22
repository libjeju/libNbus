import React, { useMemo, useState } from "react";
import initialBusInfo from "./data/busInfo.json";
import initialRoutes from "./data/routes.json";
import initialSchedule from "./data/schedule.json";
import "./admin.css";

const clone = (value) => JSON.parse(JSON.stringify(value));
const jsonText = (value) => `${JSON.stringify(value, null, 2)}\n`;

function downloadJson(filename, value) {
  const url = URL.createObjectURL(new Blob([jsonText(value)], { type: "application/json;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function parseDays(text) {
  return [...new Set(String(text).split(/[\s,]+/).map(Number).filter(Number.isInteger))].sort((a, b) => a - b);
}

export default function AdminEditor() {
  const [busInfo, setBusInfo] = useState(() => clone(initialBusInfo));
  const [routes, setRoutes] = useState(() => clone(initialRoutes));
  const [schedule, setSchedule] = useState(() => clone(initialSchedule));
  const [token, setToken] = useState("");
  const [repo, setRepo] = useState("libjeju/libNbus");
  const [branch, setBranch] = useState("main");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const errors = useMemo(() => {
    const result = [];
    const rules = schedule.scheduleRules || [];
    const allDays = rules.flatMap((rule) => rule.days || []);
    const daysInMonth = new Date(busInfo.serviceYear, busInfo.serviceMonth, 0).getDate();
    const routeIds = new Set(routes.map((route) => route.id));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(busInfo.defaultDate)) result.push("기본 날짜 형식이 올바르지 않습니다.");
    if (!busInfo.defaultDate.startsWith(`${busInfo.serviceYear}-${String(busInfo.serviceMonth).padStart(2, "0")}-`)) result.push("기본 날짜의 연도·월이 운영 연도·월과 같아야 합니다.");
    if (!allDays.includes(Number(busInfo.defaultDate.slice(8, 10)))) result.push("기본 날짜가 운행일에 포함되어야 합니다.");
    if (allDays.some((day) => day < 1 || day > daysInMonth)) result.push("운영 월에 존재하지 않는 날짜가 있습니다.");
    if (new Set(allDays).size !== allDays.length) result.push("둘 이상의 운행 유형에 같은 날짜가 중복되어 있습니다.");
    if (routeIds.size !== routes.length) result.push("노선 번호가 중복되어 있습니다.");
    if (routes.some((route) => !route.stops.length)) result.push("정류장이 없는 노선이 있습니다.");
    if (rules.some((rule) => !rule.days.length || !rule.departures.length)) result.push("날짜나 시간이 비어 있는 운행 유형이 있습니다.");
    if (rules.some((rule) => rule.departures.some((item) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)))) result.push("출발 시간 형식이 올바르지 않습니다.");
    if (rules.some((rule) => rule.departures.some((item) => item.routes.some((id) => !routeIds.has(id))))) result.push("존재하지 않는 노선이 시간표에 포함되어 있습니다.");
    return result;
  }, [busInfo, routes, schedule]);

  const updateRoute = (index, field, value) => setRoutes((list) => list.map((route, i) => i === index ? { ...route, [field]: value } : route));
  const updateRule = (index, next) => setSchedule((data) => ({ ...data, scheduleRules: data.scheduleRules.map((rule, i) => i === index ? next : rule) }));

  async function saveToGitHub() {
    if (errors.length || !token.trim()) return;
    if (!/^[^/]+\/[^/]+$/.test(repo)) return setStatus("저장소는 소유자/저장소 형식으로 입력하세요.");
    setBusy(true);
    setStatus("GitHub에 저장하는 중입니다…");
    try {
      const files = [["src/data/busInfo.json", busInfo], ["src/data/routes.json", routes], ["src/data/schedule.json", schedule]];
      for (const [path, value] of files) {
        const url = `https://api.github.com/repos/${repo}/contents/${path}`;
        const headers = { Authorization: `Bearer ${token.trim()}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
        const current = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers });
        if (!current.ok) throw new Error(`${path}를 읽지 못했습니다 (${current.status}).`);
        const { sha } = await current.json();
        const saved = await fetch(url, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ message: `운행 정보 수정: ${path.split("/").pop()}`, content: toBase64(jsonText(value)), sha, branch }) });
        if (!saved.ok) throw new Error((await saved.json().catch(() => ({}))).message || `${path} 저장 실패`);
      }
      setToken("");
      setStatus("저장되었습니다. 잠시 후 공개 사이트에 자동 반영됩니다.");
    } catch (error) {
      setStatus(`저장하지 못했습니다: ${error.message}`);
    } finally { setBusy(false); }
  }

  return <main className="admin-shell">
    <header className="admin-hero"><div><span className="eyebrow">LIBRARY NIGHT BUS</span><h1>야간버스 정보 편집</h1><p>코드를 몰라도 날짜·시간·노선·정류장을 수정할 수 있습니다.</p></div><a href="../" className="preview-link">이용자 화면 보기</a></header>

    <section className="admin-card"><h2>1. 기본 정보</h2><div className="form-grid">
      <label>운영 연도<input type="number" value={busInfo.serviceYear} onChange={(e) => setBusInfo({ ...busInfo, serviceYear: Number(e.target.value) })}/></label>
      <label>운영 월<input type="number" min="1" max="12" value={busInfo.serviceMonth} onChange={(e) => setBusInfo({ ...busInfo, serviceMonth: Number(e.target.value) })}/></label>
      <label>처음 표시할 날짜<input type="date" value={busInfo.defaultDate} onChange={(e) => setBusInfo({ ...busInfo, defaultDate: e.target.value })}/></label>
      <label>탑승 위치<input value={busInfo.boardingPlace} onChange={(e) => setBusInfo({ ...busInfo, boardingPlace: e.target.value })}/></label>
      <label className="wide">페이지 제목<input value={busInfo.title} onChange={(e) => setBusInfo({ ...busInfo, title: e.target.value })}/></label>
      <label className="wide">안내 문구<input value={busInfo.heroDescription} onChange={(e) => setBusInfo({ ...busInfo, heroDescription: e.target.value })}/></label>
    </div></section>

    <section className="admin-card"><div className="section-title"><div><h2>2. 운행 날짜와 시간</h2><p>날짜는 쉼표나 띄어쓰기로 구분합니다. 예: 4, 5, 6, 10</p></div><button onClick={() => setSchedule({ ...schedule, scheduleRules: [...schedule.scheduleRules, { name: "새 운행 유형", days: [], departures: [{ time: "00:05", routes: [] }] }] })}>+ 운행 유형</button></div>
      {schedule.scheduleRules.map((rule, ri) => <div className="rule-box" key={ri}>
        <div className="inline-fields"><label>운행 유형 이름<input value={rule.name} onChange={(e) => updateRule(ri, { ...rule, name: e.target.value })}/></label><label>운행일<input key={rule.days.join("-")} defaultValue={rule.days.join(", ")} onBlur={(e) => updateRule(ri, { ...rule, days: parseDays(e.target.value) })}/></label><button className="danger" onClick={() => setSchedule({ ...schedule, scheduleRules: schedule.scheduleRules.filter((_, i) => i !== ri) })}>삭제</button></div>
        {rule.departures.map((departure, di) => <div className="departure" key={di}><input aria-label="출발 시간" type="time" value={departure.time} onChange={(e) => updateRule(ri, { ...rule, departures: rule.departures.map((item, i) => i === di ? { ...item, time: e.target.value } : item) })}/><div className="route-checks">{routes.map((route) => <label key={route.id}><input type="checkbox" checked={departure.routes.includes(route.id)} onChange={() => updateRule(ri, { ...rule, departures: rule.departures.map((item, i) => i === di ? { ...item, routes: item.routes.includes(route.id) ? item.routes.filter((id) => id !== route.id) : [...item.routes, route.id].sort((a,b) => a-b) } : item) })}/>{route.id}노선({route.short})</label>)}</div><button className="danger" onClick={() => updateRule(ri, { ...rule, departures: rule.departures.filter((_, i) => i !== di) })}>시간 삭제</button></div>)}
        <button onClick={() => updateRule(ri, { ...rule, departures: [...rule.departures, { time: "00:05", routes: [] }] })}>+ 출발 시간</button>
      </div>)}
    </section>

    <section className="admin-card"><div className="section-title"><div><h2>3. 노선과 정류장</h2><p>정류장은 한 줄에 하나씩, 운행 순서대로 입력하세요.</p></div><button onClick={() => setRoutes([...routes, { id: Math.max(0, ...routes.map((r) => r.id)) + 1, terminal: "", area: "", short: "", cta: "", stops: ["중앙도서관"] }])}>+ 노선</button></div>
      <div className="routes-grid">{routes.map((route, index) => <article className="route-editor" key={`${route.id}-${index}`}><div className="route-heading"><strong>{route.id}노선</strong><button className="danger" onClick={() => setRoutes(routes.filter((_, i) => i !== index))}>노선 삭제</button></div><label>노선 번호<input type="number" value={route.id} onChange={(e) => updateRoute(index, "id", Number(e.target.value))}/></label><label>짧은 방면명<input value={route.short} onChange={(e) => updateRoute(index, "short", e.target.value)}/></label><label>종점<input value={route.terminal} onChange={(e) => updateRoute(index, "terminal", e.target.value)}/></label><label>주요 경유 지역<input value={route.area} onChange={(e) => updateRoute(index, "area", e.target.value)}/></label><label>버튼 문구<input value={route.cta} onChange={(e) => updateRoute(index, "cta", e.target.value)}/></label><label>정류장 목록<textarea rows="9" value={route.stops.join("\n")} onChange={(e) => updateRoute(index, "stops", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}/></label></article>)}</div>
    </section>

    <section className="admin-card save-card"><h2>4. 확인하고 저장</h2>
      {errors.length ? <div className="validation error"><strong>수정할 항목이 있습니다.</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div> : <div className="validation success">✓ 입력 내용에 오류가 없습니다.</div>}
      <details><summary>방법 A · JSON 파일로 내려받기</summary><p>파일을 받은 뒤 GitHub의 같은 이름 파일에 업로드합니다.</p><div className="button-row"><button onClick={() => downloadJson("busInfo.json", busInfo)}>기본 정보 받기</button><button onClick={() => downloadJson("routes.json", routes)}>노선 받기</button><button onClick={() => downloadJson("schedule.json", schedule)}>시간표 받기</button></div></details>
      <details open><summary>방법 B · GitHub에 바로 저장하기</summary><p>이 저장소에 쓰기 권한이 있는 Fine-grained personal access token이 필요합니다. 토큰은 저장하거나 기록하지 않습니다.</p><div className="form-grid"><label>저장소<input value={repo} onChange={(e) => setRepo(e.target.value)}/></label><label>브랜치<input value={branch} onChange={(e) => setBranch(e.target.value)}/></label><label className="wide">GitHub 토큰<input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…"/></label></div><button className="primary" disabled={busy || errors.length > 0 || !token} onClick={saveToGitHub}>{busy ? "저장 중…" : "GitHub에 저장"}</button></details>
      {status && <p className="status" role="status">{status}</p>}
    </section>
  </main>;
}
