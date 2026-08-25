/* global window, document */
/**
 * Timeline Enhance browser half: auto-fold chat timeline processes + Deep diving fun tips.
 * Now also provides a visual-config card (settings.visual.item) under the
 * "界面增强" group so it appears in the dedicated 可视化配置 entry.
 * Module-table factory bundle (same artifact shape tsdown's clientBundle emits).
 */
window.__ModuleLoader__.load({ id: 'dsh-timeline-enhance', factory: (require) => {
var module = { exports: {} };
var exports = module.exports;

const React = require('react')

module.exports = {
  name: 'timeline-enhance',
  inject: ['timer', 'locale', 'settingsScope', 'slots'],
  apply(ctx){
    const slots=ctx.get('slots'); if(!slots) return;

    // --- locale + settingsScope for the visual card ---
    const NS = 'timeline-enhance'
    const en = {
      title: 'Timeline Enhance',
      description: 'Auto-collapse Agent steps and show playful Deep diving tips.',
      autoFold: 'Auto-collapse steps',
      autoFoldHint: 'Collapse step details after the final answer appears.',
      funTips: 'Playful status tips',
      funTipsHint: 'Show fun, context-aware tips while Deep diving.',
      badge: 'Enhance',
      preview: 'Preview',
      collapsed: 'Collapsed {0} steps',
      expanded: 'Expanded {0} steps',
      steps: 'steps',
      contextLabel: 'Context',
      toolLabel: 'Tools',
      thinkLabel: 'Thinking',
      collapseAction: 'Collapse',
    }
    const zh = {
      title: '时间线增强',
      description: '自动收起 Agent 过程块，并在 Deep diving 状态展示趣味提示。',
      autoFold: '自动收起过程',
      autoFoldHint: '最终回答出现后自动收起过程中的步骤。',
      funTips: '趣味状态提示',
      funTipsHint: '在 Deep diving 时按类型随机展示趣味文案。',
      badge: '界面增强',
      preview: '预览',
      collapsed: '已收起 {0} 个步骤',
      expanded: '已展开 {0} 个步骤',
      steps: '个步骤',
      contextLabel: '上下文注入',
      toolLabel: '工具调用',
      thinkLabel: '思考',
      collapseAction: '收起步骤',
    }
    // locale register is idempotent per fiber; effect owns cleanup.
    ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'timeline-enhance: locale')
    const t = ctx.locale.bind(NS)
    // Bind a client scope over the host `timeline-enhance` namespace.
    const scope = ctx.settingsScope.bind({ namespace: NS })

    // Self-contained settings page (no Harness patch needed) — registers a dedicated left-nav entry
    function TimelineEnhanceSettingsPage(props){
      const [snap, setSnap] = React.useState(() => scope.getSnapshot())
      const [localeTick, setLocaleTick] = React.useState(0)
      React.useEffect(() => {
        const off1 = scope.subscribe(() => setSnap(scope.getSnapshot()))
        const off2 = ctx.locale.subscribe(() => setLocaleTick(x=>x+1))
        return () => { off1(); off2(); }
      }, [])
      const writable = !!snap.writable
      const available = snap.status === 'ready'
      if (!available) return React.createElement('div', { style: { padding: '24px', color: 'var(--dsw-alias-label-tertiary,#8b93a1)', fontSize: '13px' } }, t('preview'))
      const value = (snap.value || {})
      const autoFold = value.autoFold !== undefined ? !!value.autoFold : true
      const funTips = value.funTips !== undefined ? !!value.funTips : true
      const toggle = (field, next) => {
        if (!writable) return
        void scope.set(field, next)
      }
      const Switch = (checked, onToggle) => {
        const track = {
          width: '36px', height: '20px', borderRadius: '10px',
          background: checked ? 'var(--dsw-alias-state-business-primary, #3b82f6)' : 'var(--dsw-alias-bg-layer-3, #e5e7eb)',
          position: 'relative', cursor: writable ? 'pointer' : 'not-allowed',
          opacity: writable ? 1 : 0.5, flex: 'none', transition: 'background 0.2s',
          border: '1px solid ' + (checked ? 'var(--dsw-alias-state-business-primary, #3b82f6)' : 'var(--dsw-alias-border-l2, #d1d5db)'),
        }
        const knob = {
          width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
          position: 'absolute', top: '2px', left: checked ? '18px' : '2px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'left 0.2s',
        }
        return React.createElement('button', {
          role: 'switch', 'aria-checked': checked, disabled: !writable,
          onClick: () => writable && onToggle(!checked),
          style: track,
        }, React.createElement('span', { style: knob }))
      }
      const rowStyle = {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', padding: '14px 0',
        borderTop: 'none',
      }
      const labelStyle = { fontSize: '13px', fontWeight: 500, lineHeight: '20px', color: 'var(--dsw-alias-label-primary,#1f2328)' }
      const hintStyle = { fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #8b93a1)', lineHeight: '16px', marginTop: '2px' }
      const previewBox = {
        margin: '0 0 12px', padding: '10px 12px', borderRadius: '10px',
        background: 'var(--dsw-alias-bg-layer-2, #f3f4f6)',
        border: '1px dashed var(--dsw-alias-border-l2, #e5e7eb)',
        fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-label-secondary,#6b7280)',
      }
      const isZh = (()=>{ try{ return (ctx.locale.getSnapshot().active||'zh').startsWith('zh')}catch{return true}})()
      void localeTick
      const getPreviewFold = () => {
        if (isZh) return '已收起 3 个步骤 · 工具调用 2 · 思考 1'
        return 'Collapsed 3 steps · Tools 2 · Thinking 1'
      }
      const previewPool = isZh ? tipsZh['generic'] : tipsEn['generic']
      const [carouselIdx, setCarouselIdx] = React.useState(0)
      React.useEffect(() => {
        if (!funTips) return
        const id = setInterval(() => setCarouselIdx(i => (i + 1) % previewPool.length), 1800)
        return () => clearInterval(id)
      }, [funTips, isZh])
      const carouselTip = previewPool[carouselIdx % previewPool.length]
      const [foldPreviewExpanded, setFoldPreviewExpanded] = React.useState(false)
      // Page layout: header comes from settings.section, body is just the two toggles with previews
      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0', maxWidth: '720px' } },
        React.createElement('div', { style: { marginBottom: '4px' } },
          React.createElement('h2', { style: { margin: '0 0 6px', fontSize: '18px', fontWeight: 600, color: 'var(--dsw-alias-label-primary,#1f2328)' } }, t('title')),
          React.createElement('p', { style: { margin: 0, fontSize: '13px', lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary,#8b93a1)' } }, t('description'))
        ),
        React.createElement('div', { style: rowStyle },
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: labelStyle }, t('autoFold')),
            React.createElement('div', { style: hintStyle }, t('autoFoldHint'))
          ),
          Switch(autoFold, v => toggle('autoFold', v))
        ),
        autoFold && React.createElement('div', { style: previewBox },
          React.createElement('span', { style: { color: 'var(--dsw-alias-label-tertiary,#8b93a1)' } }, t('preview')),
          React.createElement('div', {
            style: { marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', cursor: 'pointer', userSelect: 'none' },
            onClick: () => setFoldPreviewExpanded(v=>!v),
            role: 'button', tabIndex: 0,
            onKeyDown: e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); setFoldPreviewExpanded(v=>!v) } }
          },
            React.createElement('span', { style: { width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dsw-alias-label-tertiary,#8a8f98)', flex: 'none', transform: foldPreviewExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }, dangerouslySetInnerHTML: { __html: chevronRight } }),
            React.createElement('span', { style: { flex: '1', minWidth: 0, whiteSpace: 'normal', wordBreak: 'break-word' } }, foldPreviewExpanded ? t('expanded').replace('{0}','3') : getPreviewFold())
          ),
          foldPreviewExpanded && React.createElement('div', { style: { marginTop: '8px', marginLeft: '7px', borderLeft: '1px solid var(--dsw-alias-border-secondary, rgba(0,0,0,0.08))', paddingLeft: '13px', display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '2px', paddingBottom: '2px' } },
            React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', lineHeight: '20px', color: 'var(--dsw-alias-label-secondary,#6b7280)' } },
              React.createElement('span', { style: { width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dsw-alias-label-tertiary,#8a8f98)', flex: 'none', fontSize: '10px' } }, '◯'),
              React.createElement('span', { style: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, isZh ? 'Think · 正在整理思路…' : 'Think · Organizing thoughts…')
            ),
            React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', lineHeight: '20px', color: 'var(--dsw-alias-label-secondary,#6b7280)' } },
              React.createElement('span', { style: { width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dsw-alias-label-tertiary,#8a8f98)', flex: 'none', fontSize: '10px' } }, '✎'),
              React.createElement('span', { style: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, '~/Desktop/github/dsh-timeline-enhance/client.js')
            )
          )
        ),
        React.createElement('div', { style: rowStyle },
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: labelStyle }, t('funTips')),
            React.createElement('div', { style: hintStyle }, t('funTipsHint'))
          ),
          Switch(funTips, v => toggle('funTips', v))
        ),
        funTips && React.createElement('div', { style: { ...previewBox, whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' } },
          React.createElement('span', { style: { color: 'var(--dsw-alias-label-tertiary,#8b93a1)' } }, t('preview')),
          React.createElement('div', { key: carouselIdx, className: 'dsh-tip-wave dsh-tip-carousel', style: { marginTop: '6px', fontStyle: 'italic', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: '18px', display: 'block' } }, '“' + carouselTip + '”')
        )
      )
    }

    // Self-contained left-nav entry — no Harness patch needed (like plugin-market)
    ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section',
      id: 'timeline-enhance',
      order: 50,
      label: () => t('title'),
      locale: NS,
    }, TimelineEnhanceSettingsPage))

    const css=`
      .dsh-fold-hidden{display:none !important;}
      .dsh-empty-think-hidden{display:none !important;}
      .dsh-empty-think-root-hidden{display:none !important;}
      .dsh-fold-think-hidden{display:none !important;}
      .dsh-fold-root{min-width:0;}
      .dsh-fold-row{position:relative;display:flex;align-items:center;height:24px;min-width:0;cursor:pointer;user-select:none;padding:0;margin:4px 0;}
      .dsh-fold-leading{position:relative;flex:none;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;margin-right:6px;color:var(--dsw-alias-label-tertiary,#8a8f98);}
      .dsh-fold-leading svg{width:14px;height:14px; display:block;}
      .dsh-fold-title{flex:none;font-size:14px;line-height:24px;color:var(--dsw-alias-label-secondary,#373a3f);}
      .dsh-fold-sep{flex:none;width:2px;height:2px;margin:0 8px;border-radius:1px;background:var(--dsw-alias-label-caption,#c2c5cc);}
      .dsh-fold-summary{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:24px;color:var(--dsw-alias-label-tertiary,#6b7280);}
      .dsh-fold-indented{margin-left:8px !important; width:calc(100% - 8px) !important; box-sizing:border-box; border-left:1px solid var(--dsw-alias-border-secondary, rgba(0,0,0,0.08)); padding-left:13px;}
      .dsh-fold-think-indented{margin-left:8px !important; width:calc(100% - 8px) !important; box-sizing:border-box; border-left:1px solid var(--dsw-alias-border-secondary, rgba(0,0,0,0.08)); padding-left:13px;}
      .dsh-tip-wave{ background: linear-gradient(90deg, var(--dsw-static-deepseek-500, #3b82f6) 0%, var(--dsw-static-deepseek-500, #3b82f6) 40%, var(--dsw-static-deepseek-200, #bfdbfe) 50%, var(--dsw-static-deepseek-500, #3b82f6) 60%, var(--dsw-static-deepseek-500, #3b82f6) 100%); background-position: 100% 0; background-size: 250% 100%; background-clip: text; -webkit-background-clip: text; color: transparent; -webkit-text-fill-color: transparent; animation: dsh-turn-status-shimmer 1.8s linear infinite; }
      .dsh-tip-carousel{ display: inline-block; transition: opacity 0.25s; }
    `
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin="dsh-timeline-enhance"]') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-timeline-enhance'
      tag.textContent = css
      document.head.appendChild(tag)
    }
    const chevronRight=`<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.2 3.2L8.8 7L5.2 10.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    const chevronDown=`<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.2 5.2L7 8.8L10.8 5.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    // 按消息类型分池的趣味 Tips：中英双语，英文更符合语境的俏皮感
    const tipsZh={
      'tool-call': [
        '正在让工具跑个腿…',
        '工具箱叮当作响…',
        '正在请外援查资料…',
        '正在翻箱倒柜找线索…',
        '正在让代码开口说话…',
        '正在派出小工具探路…',
        '正在检索代码星海…',
        '正在执行小任务…',
      ],
      'context': [
        '正在唤醒记忆…',
        '正在整理行囊…',
        '正在翻旧账…',
        '正在回顾上下文…',
        '正在拼凑背景信息…',
        '正在同步思绪…',
      ],
      'think': [
        '正在深度思考…',
        '正在整理思绪…',
        '正在推演下一步…',
        '正在酝酿思路…',
        '大脑超载中…',
        '正在和自己辩论…',
        '思路正在拼拼图…',
        '正在脑内头脑风暴…',
        '正在权衡利弊…',
      ],
      'generic': [
        '正在潜入代码深海…',
        '正在加速推理…',
        '正在酝酿回答…',
        '正在整理思绪…',
        '正在全力运转…',
        '好答在后头，稍等片刻…',
      ]
    }
    const tipsEn={
      'tool-call': [
        'Sending the tools out for a walk…',
        'Toolbox is rattling…',
        'Calling in reinforcements…',
        'Rummaging through the toolbox…',
        'Letting the code speak…',
        'Scouting ahead with tiny helpers…',
        'Scanning the code galaxy…',
        'Crunching a micro-task…',
      ],
      'context': [
        'Waking up memories…',
        'Packing the context…',
        'Flipping through notes…',
        'Recalling the backstory…',
        'Piecing together the background…',
        'Syncing thoughts…',
      ],
      'think': [
        'Deep in thought…',
        'Organizing the mind…',
        'Plotting the next move…',
        'Brewing ideas…',
        'Brain overheating…',
        'Debating with myself…',
        'Piecing the puzzle…',
        'Brainstorming…',
        'Weighing the trade-offs…',
      ],
      'generic': [
        'Diving into the code depths…',
        'Accelerating reasoning…',
        'Crafting the answer…',
        'Gathering thoughts…',
        'Running at full throttle…',
        'Good things take a moment…',
      ]
    }
    const lastIdxByKind={}
    function isZhLocale(){
      try { return (ctx.locale.getSnapshot().active || 'zh').startsWith('zh') } catch { return true }
    }
    function pickForKind(kind){
      const poolMap = isZhLocale() ? tipsZh : tipsEn
      const pool=poolMap[kind]||poolMap['generic']
      const key = (isZhLocale()?'zh:':'en:')+kind
      let last=lastIdxByKind[key]??-1
      let n; do{n=Math.floor(Math.random()*pool.length)}while(n===last&&pool.length>1)
      lastIdxByKind[key]=n
      return pool[n]
    }
    let currentTipEl=null
    function ensureTipEl(){
      const status=document.querySelector('[role="status"]')
      if(!status) return null
      let tipSpan=status.querySelector('.dsh-tip-static')
      if(!tipSpan){
        tipSpan=document.createElement('span')
        tipSpan.className='dsh-tip-static'
        for(const node of Array.from(status.childNodes)){ if(node.nodeType===3 && node.textContent && node.textContent.includes('Deep diving')) node.remove() }
        const clock=status.querySelector('span')
        if(clock) status.insertBefore(tipSpan, clock)
        else status.insertBefore(tipSpan, status.firstChild)
      }
      return tipSpan
    }
    function kindOfAddedNode(node){
      if(!node || node.nodeType!==1) return null
      const el=node
      const k=el.getAttribute && el.getAttribute('data-chat-flow-kind')
      if(k==='tool-call') return 'tool-call'
      if(k==='context') return 'context'
      if(k==='assistant-step'){
        if(el.querySelector('[data-variant="think"]')) return 'think'
        return 'generic'
      }
      if(el.matches && el.matches('[data-variant="think"]')) return 'think'
      if(el.querySelector && el.querySelector('[data-variant="think"]')) return 'think'
      if(el.textContent && el.textContent.includes('上下文注入')) return 'context'
      if(el.textContent && el.textContent.includes('Think')) return 'think'
      return null
    }
    ctx.effect(()=>{
      const isFunTipsEnabled = () => {
        const v = scope.getSnapshot().value || {}
        return v.funTips !== false
      }
      const ensureDeep = (status) => {
        if (!status) return
        const tip = status.querySelector('.dsh-tip-static')
        if (tip) tip.remove()
        const hasDeep = Array.from(status.childNodes).some(n=> n.nodeType===3 && n.textContent && n.textContent.includes('Deep diving'))
        if (!hasDeep) {
          const clock = status.querySelector('span')
          if (clock) status.insertBefore(document.createTextNode('Deep diving...'), clock)
          else status.insertBefore(document.createTextNode('Deep diving...'), status.firstChild)
        }
      }
      const ensureTip = () => {
        const t = ensureTipEl()
        if (t && !t.textContent) t.textContent = pickForKind('generic')
      }
      if (isFunTipsEnabled()) {
        ensureTip()
      } else {
        const s = document.querySelector('[role="status"]')
        if (s) ensureDeep(s)
      }
      let lastKind = null
      const obs = new MutationObserver((mutations)=>{
        if (isFunTipsEnabled()) {
          const status=document.querySelector('[role="status"]')
          if(status && !status.querySelector('.dsh-tip-static')){
            const t=ensureTipEl()
            if(t && !t.textContent) t.textContent=pickForKind('generic')
          }
          for(const m of mutations){
            for(const node of Array.from(m.addedNodes)){
              const k=kindOfAddedNode(node)
              if(k && k!==lastKind){
                const tip=ensureTipEl()
                if(tip){ tip.textContent=pickForKind(k) }
                lastKind=k
              }
              if(node.querySelectorAll){
                const inners=node.querySelectorAll('[data-chat-flow-kind="tool-call"],[data-chat-flow-kind="context"],[data-variant="think"]')
                inners.forEach(inner=>{
                  const kk=kindOfAddedNode(inner)
                  if(kk && kk!==lastKind){
                    const tip=ensureTipEl()
                    if(tip){ tip.textContent=pickForKind(kk) }
                    lastKind=kk
                  }
                })
              }
            }
          }
        } else {
          for(const m of mutations){
            for(const node of Array.from(m.addedNodes)){
              if(node.nodeType===1 && node.getAttribute && node.getAttribute('role')==='status'){
                ensureDeep(node)
              }
              if(node.querySelectorAll){
                const statuses=node.querySelectorAll('[role="status"]')
                statuses.forEach(ensureDeep)
              }
            }
          }
          const s=document.querySelector('[role="status"]')
          if(s) ensureDeep(s)
        }
      })
      obs.observe(document.body,{childList:true, subtree:true})
      const offScope = scope.subscribe(()=>{
        if (isFunTipsEnabled()) {
          ensureTip()
          lastKind=null
        } else {
          const s=document.querySelector('[role="status"]')
          if(s) ensureDeep(s)
        }
      })
      return ()=>{ obs.disconnect(); offScope() }
    },'tips:per-kind')
    function isEmptyThinkNode(node){const d=node&&node.data; if(!d||!Array.isArray(d.blocks))return false; let hasVisible=false; for(const b of d.blocks){if(b.kind==='reasoning'){if(b.text&&b.text.trim()!=='')hasVisible=true}else if(b.kind==='text'){if(b.text&&b.text.trim()!=='')hasVisible=true}else if(b.kind==='image'||b.kind==='tool-call')hasVisible=true; else if(b.kind==='other')hasVisible=true} return !hasVisible}
    function hasTextBlock(node){const d=node&&node.data; if(!d||!Array.isArray(d.blocks))return false; return d.blocks.some(b=>b.kind==='text'&&b.text&&b.text.trim()!=='')}
    function FoldController(props){
      const snap=props.session||null
      const [expanded,setExpanded]=React.useState(()=>new Set())
      const [cfg,setCfg]=React.useState(()=> scope.getSnapshot().value || {})
      React.useEffect(()=>{
        const off=scope.subscribe(()=> setCfg(scope.getSnapshot().value || {}))
        return off
      },[])
      const isFoldEnabled = cfg.autoFold !== false
      const applyingRef=React.useRef(false)
      const groups=React.useMemo(()=>{
        if(!snap||!snap.chat||!snap.chat.order) return[]
        const order=snap.chat.order, nodes=snap.chat.nodes
        if(!order||!nodes||typeof nodes.get!=='function')return[]
        const list=[]; for(const key of order){const n=nodes.get(key); if(!n)continue; list.push({key,kind:n.kind,node:n})}
        const groups=[]; let cur=null
        for(const item of list){if(item.kind==='user'||item.kind==='steering'){if(cur) groups.push(cur); cur={userKey:item.key,nodes:[item],hasFinal:false,finalIdx:-1,finalKey:null}} else {if(!cur) cur={userKey:null,nodes:[],hasFinal:false,finalIdx:-1,finalKey:null}; cur.nodes.push(item)}}
        if(cur) groups.push(cur)
        for(const g of groups){let finalIdx=-1,finalKey=null; for(let i=g.nodes.length-1;i>=0;i--){const n=g.nodes[i]; if(n.kind==='assistant-step'){const d=n.node.data; if(!d||!d.blocks)continue; const hasText=d.blocks.some(b=>b.kind==='text'&&b.text&&b.text.trim()!==''); if(hasText){finalIdx=i; finalKey=n.key; break}}} g.finalIdx=finalIdx; g.finalKey=finalKey; g.hasFinal=finalIdx!==-1}
        return groups
      },[snap])
      const folds=React.useMemo(()=>{
        const out=[]
        for(const g of groups){
          if(!g.hasFinal) continue
          const startIdx=g.userKey?1:0
          const endIdx=g.finalIdx
          let buffer=[]
          let segIdx=0
          for(let i=startIdx;i<endIdx;i++){
            const n=g.nodes[i]
            if(!n) continue
            if(n.kind==='user'||n.kind==='steering') continue
            if(n.node && n.node.data && n.node.data['role']==='user') continue
            if(n.kind==='assistant-step' && isEmptyThinkNode(n.node)) continue
            if(n.kind==='assistant-step' && hasTextBlock(n.node)){
              if(buffer.length>0){
                out.push({foldId:(g.userKey||'pre')+'-'+segIdx, g, processIndices:[...buffer], textIdx:i, textKey:n.key, segIdx})
                segIdx++
                buffer=[]
              }
              continue
            }
            buffer.push(i)
          }
          if(buffer.length>0){
            out.push({foldId:(g.userKey||'pre')+'-'+segIdx, g, processIndices:[...buffer], textIdx:endIdx, textKey:g.finalKey, segIdx})
          }
        }
        return out
      },[groups])
      const applyFold=React.useCallback(()=>{
        if(applyingRef.current) return
        applyingRef.current=true
        try{
          const flow=document.querySelector('[data-chat-flow]'); if(!flow) return
          try{
            const hasInterjected = groups.some(g=>g.nodes.some((n,i)=>(n.kind==='user'||n.kind==='steering') && i>0 && i < (g.finalIdx===-1?Infinity:g.finalIdx)))
            if(hasInterjected){
              console.debug('[timeline-enhance] interjected user/steering detected', groups.map(g=>({user:g.userKey, kinds:g.nodes.map(n=>n.kind+':'+n.key.slice(0,4)), final:g.finalIdx, finalKey:g.finalKey})))
              console.debug('[timeline-enhance] folds', folds.map(f=>({id:f.foldId, indices:f.processIndices.map(i=>{const n=f.g.nodes[i]; return n? n.kind+':'+n.key.slice(0,4): 'null'}), text:f.textKey && f.textKey.slice(0,4)})))
              console.debug('[timeline-enhance] DOM flow kinds', Array.from(flow.querySelectorAll('[data-chat-anchor-key]')).map(el=>el.getAttribute('data-chat-flow-kind')+':'+(el.getAttribute('data-chat-anchor-key')||'').slice(0,4)+ (el.classList.contains('dsh-fold-hidden')?'[hidden]':'' ) + (el.classList.contains('dsh-fold-indented')?'[indented]':'')))
            }
          }catch(e){}
          // User/steering interjections must never be folded or indented
          for(const g of groups){
            for(const n of g.nodes){
              if(n.kind==='user'||n.kind==='steering'){
                const el=flow.querySelector('[data-chat-anchor-key="'+n.key+'"]');
                if(el){
                  el.classList.remove('dsh-fold-hidden','dsh-fold-indented','dsh-fold-think-hidden','dsh-fold-think-indented','dsh-empty-think-hidden','dsh-empty-think-root-hidden');
                  el.style.display='';
                  // also clear any inline display that might have been set
                  const parent=el.parentElement
                  if(parent && parent.classList.contains('dsh-fold-hidden')) parent.classList.remove('dsh-fold-hidden')
                }
              }
            }
          }
          if (!isFoldEnabled) {
            // Fold disabled: remove all bars and ensure everything visible
            document.querySelectorAll('[id^="dsh-fold-bar-"]').forEach(b=>b.remove())
            flow.querySelectorAll('.dsh-fold-hidden').forEach(el=>el.classList.remove('dsh-fold-hidden'))
            flow.querySelectorAll('.dsh-fold-indented').forEach(el=>el.classList.remove('dsh-fold-indented'))
            flow.querySelectorAll('.dsh-fold-think-hidden').forEach(el=>el.classList.remove('dsh-fold-think-hidden'))
            flow.querySelectorAll('.dsh-fold-think-indented').forEach(el=>el.classList.remove('dsh-fold-think-indented'))
            document.querySelectorAll('[data-moved-think-for]').forEach(el=>{
              const fid=el.getAttribute('data-moved-think-for')
              const f=folds.find(x=>x.foldId===fid)
              const target=f?flow.querySelector('[data-chat-anchor-key="'+f.textKey+'"]'):null
              if(target) target.insertBefore(el, target.firstChild)
              el.removeAttribute('data-moved-think-for')
            })
            // still keep empty-think hiding for cleanliness
            flow.querySelectorAll('[data-variant="think"].dsh-empty-think-root-hidden').forEach(el=>el.classList.remove('dsh-empty-think-root-hidden'))
            const thinkRoots2=flow.querySelectorAll('[data-variant="think"]')
            thinkRoots2.forEach(root=>{const txt=(root.textContent||'').trim(); const isEmpty=txt==='Think'||txt==='Think ·'||txt==='Think·'; const body=root.querySelector('.thinkBody, [class*="thinkBody"]'); const bodyEmpty=body?(body.textContent||'').trim()==='':true; if(isEmpty&&bodyEmpty){root.classList.add('dsh-empty-think-root-hidden')}})
            for(const g of groups){for(const n of g.nodes){if(n.kind==='assistant-step'&&isEmptyThinkNode(n.node)){const el=flow.querySelector('[data-chat-anchor-key="'+n.key+'"]'); if(el) el.classList.add('dsh-empty-think-hidden')}}
            }
            return
          }
          flow.querySelectorAll('[data-variant="think"].dsh-empty-think-root-hidden').forEach(el=>el.classList.remove('dsh-empty-think-root-hidden'))
          flow.querySelectorAll('.dsh-empty-think-hidden').forEach(el=>el.classList.remove('dsh-empty-think-hidden'))
          flow.querySelectorAll('.dsh-fold-think-hidden').forEach(el=>el.classList.remove('dsh-fold-think-hidden'))
          flow.querySelectorAll('.dsh-fold-think-indented').forEach(el=>el.classList.remove('dsh-fold-think-indented'))
          flow.querySelectorAll('.dsh-fold-indented').forEach(el=>el.classList.remove('dsh-fold-indented'))
          document.querySelectorAll('[data-moved-think-for]').forEach(el=>{
            const fid=el.getAttribute('data-moved-think-for')
            const f=folds.find(x=>x.foldId===fid)
            const target=f?flow.querySelector('[data-chat-anchor-key="'+f.textKey+'"]'):null
            if(target) target.insertBefore(el, target.firstChild)
            el.removeAttribute('data-moved-think-for')
          })
          const thinkRoots=flow.querySelectorAll('[data-variant="think"]')
          thinkRoots.forEach(root=>{const txt=(root.textContent||'').trim(); const isEmpty=txt==='Think'||txt==='Think ·'||txt==='Think·'; const body=root.querySelector('.thinkBody, [class*="thinkBody"]'); const bodyEmpty=body?(body.textContent||'').trim()==='':true; if(isEmpty&&bodyEmpty){root.classList.add('dsh-empty-think-root-hidden')}})
          for(const g of groups){for(const n of g.nodes){if(n.kind==='assistant-step'&&isEmptyThinkNode(n.node)){const el=flow.querySelector('[data-chat-anchor-key="'+n.key+'"]'); if(el) el.classList.add('dsh-empty-think-hidden')}}
          }
          for(const f of folds){
            const g=f.g
            const topId='dsh-fold-bar-'+f.foldId
            const bottomId='dsh-fold-bar-bottom-'+f.foldId
            let topBar=document.getElementById(topId)
            let bottomBar=document.getElementById(bottomId)
            const textEl=flow.querySelector('[data-chat-anchor-key="'+f.textKey+'"]')
            if(textEl) textEl.classList.remove('dsh-empty-think-hidden')
            const isExpanded=expanded.has(f.foldId)
            let innerThinks=[]
            if(textEl) innerThinks=Array.from(textEl.querySelectorAll('[data-variant="think"]')).filter(el=>!el.classList.contains('dsh-empty-think-root-hidden'))
            const innerCount=innerThinks.length
            innerThinks.forEach(el=>{
              if(!isExpanded){ el.classList.add('dsh-fold-think-hidden'); el.classList.remove('dsh-fold-think-indented') }
              else { el.classList.remove('dsh-fold-think-hidden'); el.classList.add('dsh-fold-think-indented'); el.setAttribute('data-moved-think-for', f.foldId); flow.insertBefore(el, textEl) }
            })
            const procCount=f.processIndices.length + innerCount
            for(const idx of f.processIndices){
              const n=g.nodes[idx]
              if(!n) continue
              if(n.kind==='user'||n.kind==='steering') continue
              // extra safety: if the underlying data role is user, skip
              const maybeRole = n.node && n.node.data && n.node.data.role
              if(maybeRole==='user') continue
              const el=flow.querySelector('[data-chat-anchor-key="'+n.key+'"]')
              if(!el) continue
              // double-check DOM-level: if the element itself is a user/steering bubble, never hide
              const flowKind=el.getAttribute('data-chat-flow-kind')
              if(flowKind==='user' || flowKind==='steering' || el.querySelector('[data-role="user"]')) continue
              const shouldCollapse=!isExpanded
              if(shouldCollapse){ el.classList.add('dsh-fold-hidden'); el.classList.remove('dsh-fold-indented')}
              else { el.classList.remove('dsh-fold-hidden'); el.classList.add('dsh-fold-indented')}
            }
            if(textEl){ textEl.classList.remove('dsh-fold-hidden','dsh-fold-indented') }
            if(procCount===0 && innerCount===0){ if(topBar) topBar.remove(); if(bottomBar) bottomBar.remove(); continue }
            const firstKey=g.nodes[f.processIndices[0]]?g.nodes[f.processIndices[0]].key:null
            const firstEl=firstKey?flow.querySelector('[data-chat-anchor-key="'+firstKey+'"]'):null
            if(!topBar){topBar=document.createElement('div'); topBar.id=topId; topBar.className='dsh-fold-root'}
            topBar.innerHTML=''
            const topRow=document.createElement('div'); topRow.className='dsh-fold-row'; topRow.setAttribute('role','button'); topRow.setAttribute('tabindex','0')
            const topLeading=document.createElement('span'); topLeading.className='dsh-fold-leading'; topLeading.innerHTML=isExpanded?chevronDown:chevronRight; topRow.appendChild(topLeading)
            const fmt=(k,n)=> t(k).replace('{0}', String(n))
            const topTitle=document.createElement('span'); topTitle.className='dsh-fold-title'; topTitle.textContent=isExpanded?fmt('expanded',procCount):fmt('collapsed',procCount); topRow.appendChild(topTitle)
            let ctxC=0,toolC=0,thinkC=0; for(const idx of f.processIndices){const k=g.nodes[idx].kind; if(k==='context')ctxC++; else if(k==='tool-call')toolC++; else if(k==='assistant-step')thinkC++}
            thinkC += innerCount
            if(ctxC||toolC||thinkC){const sep=document.createElement('span'); sep.className='dsh-fold-sep'; topRow.appendChild(sep); const sum=document.createElement('span'); sum.className='dsh-fold-summary'; const parts=[]; if(ctxC)parts.push(t('contextLabel')+' '+ctxC); if(toolC)parts.push(t('toolLabel')+' '+toolC); if(thinkC)parts.push(t('thinkLabel')+' '+thinkC); sum.textContent=parts.join(' · '); topRow.appendChild(sum)}
            topRow.onclick=(e)=>{e.preventDefault();e.stopPropagation(); setExpanded(prev=>{const n=new Set(prev); if(n.has(f.foldId)) n.delete(f.foldId); else n.add(f.foldId); return n})}
            topRow.onkeydown=(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); topRow.click()}}
            topBar.appendChild(topRow); topBar.style.display='block'
            const topAnchor=firstEl || textEl
            if(topAnchor&&topAnchor.parentNode){if(topBar.parentNode!==topAnchor.parentNode||topBar.nextSibling!==topAnchor) topAnchor.parentNode.insertBefore(topBar,topAnchor)}
            if(isExpanded){
              if(!bottomBar){bottomBar=document.createElement('div'); bottomBar.id=bottomId; bottomBar.className='dsh-fold-root'}
              bottomBar.innerHTML=''
              const bRow=document.createElement('div'); bRow.className='dsh-fold-row'; bRow.setAttribute('role','button'); bRow.setAttribute('tabindex','0')
              const bAction=document.createElement('span'); bAction.className='dsh-fold-title'; bAction.textContent=t('collapseAction'); bAction.style.marginLeft='8px'; bAction.style.color='var(--dsw-alias-label-tertiary,#6b7280)'
              bRow.appendChild(bAction)
              bRow.onclick=(e)=>{e.preventDefault();e.stopPropagation(); setExpanded(prev=>{const n=new Set(prev); n.delete(f.foldId); return n})}
              bRow.onkeydown=(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); bRow.click()}}
              bottomBar.appendChild(bRow); bottomBar.style.display='block'
              if(textEl && textEl.parentNode){
                if(bottomBar.parentNode!==textEl.parentNode || bottomBar.nextSibling!==textEl) textEl.parentNode.insertBefore(bottomBar, textEl)
              }
            } else {
              if(bottomBar) bottomBar.remove()
            }
          }
          const validTop=new Set(folds.map(f=>'dsh-fold-bar-'+f.foldId))
          const validBottom=new Set(folds.filter(f=>expanded.has(f.foldId)).map(f=>'dsh-fold-bar-bottom-'+f.foldId))
          document.querySelectorAll('[id^="dsh-fold-bar-"]').forEach(b=>{
            if(b.id.startsWith('dsh-fold-bar-bottom-')){ if(!validBottom.has(b.id)) b.remove() } else { if(!validTop.has(b.id)) b.remove() }
          })
          for(const g of groups){
            for(const n of g.nodes){
              if(n.kind==='assistant-step' && hasTextBlock(n.node)){
                const el=flow.querySelector('[data-chat-anchor-key="'+n.key+'"]')
                if(el){ el.classList.remove('dsh-fold-hidden','dsh-fold-indented') }
              }
            }
          }
          // Final safety: user/steering interjections must never be hidden/indented
          let userHiddenCount=0
          for(const g of groups){
            for(const n of g.nodes){
              if(n.kind==='user'||n.kind==='steering'){
                const el=flow.querySelector('[data-chat-anchor-key="'+n.key+'"]')
                if(el && (el.classList.contains('dsh-fold-hidden')||el.classList.contains('dsh-fold-indented'))){
                  console.warn('[timeline-enhance] user/steering was incorrectly hidden/indented, fixing', n.key)
                  userHiddenCount++
                }
                if(el) el.classList.remove('dsh-fold-hidden','dsh-fold-indented','dsh-fold-think-hidden','dsh-fold-think-indented')
              }
            }
          }
          const allUsers=flow.querySelectorAll('[data-chat-flow-kind="user"],[data-chat-flow-kind="steering"]')
          allUsers.forEach(el=>{
            if(el.classList.contains('dsh-fold-hidden')||el.classList.contains('dsh-fold-indented')){
              console.warn('[timeline-enhance] DOM user/steering was hidden/indented via flow query', el.getAttribute('data-chat-anchor-key'))
              userHiddenCount++
            }
            el.classList.remove('dsh-fold-hidden','dsh-fold-indented','dsh-fold-think-hidden','dsh-fold-think-indented')
          })
          if(userHiddenCount>0) console.debug('[timeline-enhance] fixed', userHiddenCount, 'user/steering nodes')
        } finally { applyingRef.current=false }
      },[groups,folds,expanded,isFoldEnabled])
      React.useEffect(()=>{applyFold()},[applyFold])
      React.useEffect(()=>{
        const flow=document.querySelector('[data-chat-flow]'); if(!flow)return;
        let raf=0
        let pending=false
        const obs=new MutationObserver((mutations)=>{
          const hasStructure = mutations.some(m=>m.type==='childList')
          if(!hasStructure) return
          if(pending) return
          pending=true
          cancelAnimationFrame(raf)
          raf=requestAnimationFrame(()=>{pending=false; applyFold()})
        })
        obs.observe(flow,{childList:true})
        return()=>{obs.disconnect(); cancelAnimationFrame(raf)}
      },[applyFold])
      return null
    }
    slots.inject('conversation.input.dock', ()=>slots.register({name:'conversation.input.dock', id:'timeline-fold', order:99}, FoldController))
  },
}
return module.exports; }});
