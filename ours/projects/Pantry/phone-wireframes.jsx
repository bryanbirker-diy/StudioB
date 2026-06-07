/* eslint-disable */
// Mobile wireframes — 320×580 phone-shaped frames

const PhoneFrame = ({ children, title, label }) => (
  <div className="wf wf-mobile" style={{ display: "flex", flexDirection: "column" }}>
    <div className="statusbar">
      <span>9:41</span>
      <span>•••</span>
      <span>▮▮▮</span>
    </div>
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      {children}
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────
// 1A · Date Range Entry — Mobile
// ──────────────────────────────────────────────────────────────
const M_DateRange = () => (
  <PhoneFrame>
    <div className="pad col" style={{ gap: 14, height: "100%", paddingBottom: 70 }}>
      <div className="spread">
        <div className="brand"><span className="brand-mark" /> Pantry</div>
        <span className="note">v0.1</span>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="h1 underline-sketch" style={{ display: "inline-block" }}>Plan a week.</div>
        <div className="h-hand" style={{ fontSize: 16, color: "var(--ink-soft)", marginTop: 6 }}>
          (or two, or three — you pick)
        </div>
      </div>

      <div className="col" style={{ gap: 12, marginTop: 14 }}>
        <div className="field">
          <span className="field-label">Start</span>
          <div className="input-box spread">
            <span>Mon · Jun 2</span>
            <span className="note">📅</span>
          </div>
        </div>
        <div className="field">
          <span className="field-label">End</span>
          <div className="input-box spread">
            <span>Sun · Jun 8</span>
            <span className="note">📅</span>
          </div>
        </div>
        <div className="row" style={{ gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          <span className="chip">3 days</span>
          <span className="chip">1 week</span>
          <span className="chip">2 weeks</span>
          <span className="chip">custom</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <button className="btn btn-brown btn-lg" style={{ width: "100%" }}>
        Build my calendar →
      </button>
      <div className="center note">7 days · 21 meal slots</div>
    </div>

    <div className="callout" style={{ top: 70, right: 14, width: 100 }}>
      <span>variable range</span>
      <svg width="40" height="32" viewBox="0 0 40 32" style={{ top: 18, left: -28 }}>
        <path d="M38,2 Q15,5 5,28" fill="none" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5,28 L12,24 M5,28 L8,21" fill="none" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    </div>
  </PhoneFrame>
);

// ──────────────────────────────────────────────────────────────
// 2A · Calendar — Day Stack (Mobile)
// ──────────────────────────────────────────────────────────────
const M_CalendarStack = () => (
  <PhoneFrame>
    <div className="col" style={{ height: "100%", gap: 0 }}>
      <div className="pad-sm spread" style={{ borderBottom: "1.5px solid var(--rule)" }}>
        <span className="h2">Jun 2 — Jun 8</span>
        <button className="btn btn-sm btn-ghost">＋ Recipe</button>
      </div>
      <div className="row pad-sm" style={{ gap: 4, borderBottom: "1.5px solid var(--rule-soft)" }}>
        {["M","T","W","T","F","S","S"].map((d,i) => (
          <div key={i} className="center" style={{
            flex: 1, padding: "4px 0", fontFamily: "var(--mono)", fontSize: 10,
            border: i===0 ? "1.5px solid var(--ink)" : "1.5px solid transparent",
            borderRadius: 6, color: i===0 ? "var(--ink)" : "var(--ink-fade)"
          }}>
            <div>{d}</div>
          </div>
        ))}
      </div>

      <div className="col pad-sm" style={{ gap: 10, overflow: "hidden", flex: 1, paddingBottom: 70 }}>
        <div className="col" style={{ gap: 6 }}>
          <div className="spread">
            <span className="h3">Mon · Jun 2</span>
            <span className="note">3/3 set</span>
          </div>
          <div className="slot slot-filled">
            <span className="slot-label">Breakfast</span>
            <span className="mealname">Oatmeal + berries</span>
          </div>
          <div className="slot slot-eatout">
            <span className="slot-label">Lunch · eat out</span>
            <span className="mealname">Café down the street</span>
          </div>
          <div className="slot slot-filled">
            <span className="slot-label">Dinner</span>
            <span className="mealname">Grilled Chicken Bowl</span>
            <span className="mealsides">rice · broccoli · garlic sauce</span>
          </div>
        </div>

        <div className="col" style={{ gap: 6 }}>
          <div className="spread">
            <span className="h3" style={{ color: "var(--ink-soft)" }}>Tue · Jun 3</span>
            <span className="note">1/3 set</span>
          </div>
          <div className="slot slot-empty">+ breakfast</div>
          <div className="slot slot-adhoc">
            <span className="slot-label">Lunch · ad hoc</span>
            <span className="mealname">winging it 🤷</span>
          </div>
          <div className="slot slot-empty">+ dinner</div>
        </div>
      </div>

      <div className="tabbar">
        <div className="tab active"><div className="dot" />Plan</div>
        <div className="tab"><div className="dot" />Recipes</div>
        <div className="tab"><div className="dot" />Pantry</div>
        <div className="tab"><div className="dot" />List</div>
      </div>
    </div>
  </PhoneFrame>
);

// ──────────────────────────────────────────────────────────────
// 2B · Calendar — Compact List (Mobile)
// ──────────────────────────────────────────────────────────────
const M_CalendarList = () => (
  <PhoneFrame>
    <div className="col" style={{ height: "100%", gap: 0 }}>
      <div className="pad-sm spread" style={{ borderBottom: "1.5px solid var(--rule)" }}>
        <span className="h2">Week of Jun 2</span>
        <button className="btn btn-sm btn-ghost">＋</button>
      </div>

      <div className="col" style={{ flex: 1, overflow: "hidden", paddingBottom: 70 }}>
        {[
          { d: "Mon", meals: [["B","Oatmeal","filled"],["L","Café (eat out)","eatout"],["D","Chicken Bowl","filled"]] },
          { d: "Tue", meals: [["B","—","empty"],["L","ad hoc","adhoc"],["D","Pasta Primavera","filled"]] },
          { d: "Wed", meals: [["B","Yogurt + granola","filled"],["L","Leftovers","filled"],["D","—","empty"]] },
          { d: "Thu", meals: [["B","—","empty"],["L","—","empty"],["D","Tacos","filled"]] },
        ].map((day, i) => (
          <div key={i} style={{
            padding: "8px 12px",
            borderBottom: "1.5px solid var(--rule-soft)",
            display: "grid",
            gridTemplateColumns: "44px 1fr",
            gap: 8
          }}>
            <div className="h3" style={{ alignSelf: "start", paddingTop: 2 }}>{day.d}</div>
            <div className="col" style={{ gap: 3 }}>
              {day.meals.map(([slot, txt, kind], j) => (
                <div key={j} className="row" style={{ fontSize: 12, gap: 8 }}>
                  <span className="slot-label" style={{ width: 14 }}>{slot}</span>
                  <span style={{
                    color: kind==="empty" ? "var(--ink-fade)" : "var(--ink)",
                    fontStyle: kind==="empty" ? "italic" : "normal",
                  }}>{txt}</span>
                  {kind==="eatout" && <span className="chip chip-terracotta" style={{ fontSize: 9, padding: "0 6px" }}>OUT</span>}
                  {kind==="adhoc" && <span className="chip chip-olive" style={{ fontSize: 9, padding: "0 6px" }}>AD HOC</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="tabbar">
        <div className="tab active"><div className="dot" />Plan</div>
        <div className="tab"><div className="dot" />Recipes</div>
        <div className="tab"><div className="dot" />Pantry</div>
        <div className="tab"><div className="dot" />List</div>
      </div>
    </div>

    <div className="callout" style={{ top: 102, right: 8, width: 80 }}>
      <span>scan-able</span>
      <svg width="40" height="20" viewBox="0 0 40 20" style={{ top: -10, left: -30 }}>
        <path d="M38,16 Q20,12 4,4" fill="none" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M4,4 L11,5 M4,4 L6,11" fill="none" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    </div>
  </PhoneFrame>
);

// ──────────────────────────────────────────────────────────────
// 3 · Meal Slot Fill Sheet (Mobile)
// ──────────────────────────────────────────────────────────────
const M_SlotFill = () => (
  <PhoneFrame>
    <div className="pad-sm" style={{ height: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ filter: "blur(0.8px)", opacity: 0.5, pointerEvents: "none" }}>
        <div className="spread"><span className="h2">Jun 2 — Jun 8</span><span className="note">＋</span></div>
        <div className="col" style={{ gap: 5, marginTop: 8 }}>
          <div className="slot slot-filled" style={{ height: 30 }} />
          <div className="slot slot-empty" style={{ height: 30 }}>+ lunch</div>
          <div className="slot slot-filled" style={{ height: 30 }} />
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="box" style={{
        position: "absolute",
        left: 8, right: 8, bottom: 8,
        background: "var(--paper)",
        borderRadius: "16px 18px 6px 8px / 18px 16px 8px 6px",
        padding: 14,
        boxShadow: "0 -6px 20px rgba(0,0,0,0.1)",
      }}>
        <div className="center" style={{ marginBottom: 6 }}>
          <div style={{ width: 40, height: 4, background: "var(--rule)", borderRadius: 2 }} />
        </div>
        <div className="spread">
          <span className="h2">Tue · Lunch</span>
          <span className="note">✕</span>
        </div>
        <div className="note" style={{ marginBottom: 10 }}>Pick one ↓</div>

        <button className="btn" style={{ width: "100%", justifyContent: "flex-start", marginBottom: 8, padding: "10px 12px" }}>
          <span style={{ fontSize: 18 }}>🍲</span>
          <div style={{ textAlign: "left" }}>
            <div className="h3" style={{ fontSize: 16 }}>Pick a recipe</div>
            <div className="note" style={{ marginTop: 2 }}>from your library · 23 saved</div>
          </div>
        </button>

        <button className="btn btn-terracotta" style={{ width: "100%", justifyContent: "flex-start", marginBottom: 8, padding: "10px 12px" }}>
          <span style={{ fontSize: 18 }}>🥡</span>
          <div style={{ textAlign: "left" }}>
            <div className="h3" style={{ fontSize: 16, color: "inherit" }}>Eat out</div>
            <div className="note" style={{ marginTop: 2, color: "rgba(253,246,236,0.75)" }}>skip groceries for this slot</div>
          </div>
        </button>

        <button className="btn btn-olive" style={{ width: "100%", justifyContent: "flex-start", padding: "10px 12px" }}>
          <span style={{ fontSize: 18 }}>🤷</span>
          <div style={{ textAlign: "left" }}>
            <div className="h3" style={{ fontSize: 16, color: "inherit" }}>Ad hoc</div>
            <div className="note" style={{ marginTop: 2, color: "rgba(247,245,230,0.8)" }}>winging it · no groceries</div>
          </div>
        </button>
      </div>
    </div>

    <div className="callout" style={{ top: 200, right: 6, width: 80, color: "var(--olive)" }}>
      <span>no groceries<br/>added</span>
      <svg width="32" height="40" viewBox="0 0 32 40" style={{ top: 6, left: -28 }}>
        <path d="M30,2 Q14,18 6,36" fill="none" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M6,36 L13,33 M6,36 L9,29" fill="none" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    </div>
  </PhoneFrame>
);

// ──────────────────────────────────────────────────────────────
// 4A · Add Recipe — Step 1 (Mobile)
// ──────────────────────────────────────────────────────────────
const M_RecipeStep1 = () => (
  <PhoneFrame>
    <div className="col pad" style={{ height: "100%", gap: 14, paddingBottom: 14 }}>
      <div className="spread">
        <span className="note">← back</span>
        <span className="note">1 / 3</span>
      </div>

      <div>
        <div className="eyebrow">New recipe · meal bundle</div>
        <div className="h1 underline-sketch" style={{ display: "inline-block", marginTop: 4 }}>Name the meal</div>
      </div>

      <div className="field">
        <span className="field-label">Main dish *</span>
        <div className="input-box">Grilled Chicken Bowl</div>
      </div>

      <div className="col" style={{ gap: 4 }}>
        <span className="field-label">Sides (any number)</span>
        <div className="input-box spread">
          <span>Rice</span>
          <span className="note">✕</span>
        </div>
        <div className="input-box spread">
          <span>Broccoli</span>
          <span className="note">✕</span>
        </div>
        <div className="input-box spread">
          <span>Garlic Sauce</span>
          <span className="note">✕</span>
        </div>
        <div className="input-box box-dashed spread" style={{ borderStyle: "dashed" }}>
          <span className="ghost-text">+ add side</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div className="row" style={{ gap: 8 }}>
        <button className="btn fill">Cancel</button>
        <button className="btn btn-brown fill">Next: ingredients →</button>
      </div>
    </div>

    <div className="callout" style={{ top: 100, right: 16, width: 90 }}>
      <span>sides are<br/>just labels</span>
      <svg width="40" height="30" viewBox="0 0 40 30" style={{ top: 26, left: -34 }}>
        <path d="M38,4 Q18,18 4,26" fill="none" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M4,26 L11,24 M4,26 L7,19" fill="none" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    </div>
  </PhoneFrame>
);

// ──────────────────────────────────────────────────────────────
// 4B · Add Recipe — Step 2 (Mobile)
// ──────────────────────────────────────────────────────────────
const M_RecipeStep2 = () => (
  <PhoneFrame>
    <div className="col pad" style={{ height: "100%", gap: 12, paddingBottom: 14 }}>
      <div className="spread">
        <span className="note">← back</span>
        <span className="note">2 / 3</span>
      </div>

      <div>
        <div className="eyebrow">Grilled Chicken Bowl</div>
        <div className="h1 underline-sketch" style={{ display: "inline-block", marginTop: 4 }}>Ingredients</div>
        <div className="h-hand" style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 4 }}>
          one per line · item, amount
        </div>
      </div>

      <div className="box" style={{ flex: 1, padding: 10, background: "rgba(255,255,255,0.5)", overflow: "hidden" }}>
        <div className="col" style={{ gap: 6, fontFamily: "var(--mono)", fontSize: 12 }}>
          <div className="row spread">
            <span>chicken breast, 2 lb</span>
            <span className="note">✕</span>
          </div>
          <div className="divider" style={{ background: "var(--rule-soft)" }} />
          <div className="row spread">
            <span>rice, 2 cups</span>
            <span className="note">✕</span>
          </div>
          <div className="divider" style={{ background: "var(--rule-soft)" }} />
          <div className="row spread">
            <span>broccoli, 2 heads</span>
            <span className="note">✕</span>
          </div>
          <div className="divider" style={{ background: "var(--rule-soft)" }} />
          <div className="row spread">
            <span>garlic, 4 cloves</span>
            <span className="note">✕</span>
          </div>
          <div className="divider" style={{ background: "var(--rule-soft)" }} />
          <div className="row spread">
            <span>olive oil, 3 tbsp</span>
            <span className="note">✕</span>
          </div>
          <div className="divider" style={{ background: "var(--rule-soft)" }} />
          <div className="row" style={{ color: "var(--ink-fade)" }}>
            <span>│</span>
            <span style={{ fontStyle: "italic" }}>add another…</span>
          </div>
        </div>
      </div>

      <div className="note">no mapping to sides needed — flat list only</div>

      <div className="row" style={{ gap: 8 }}>
        <button className="btn fill">Back</button>
        <button className="btn btn-brown fill">Review →</button>
      </div>
    </div>
  </PhoneFrame>
);

// ──────────────────────────────────────────────────────────────
// 5 · Grocery List — Pantry-aware (Mobile)
// ──────────────────────────────────────────────────────────────
const M_Grocery = () => (
  <PhoneFrame>
    <div className="col" style={{ height: "100%", gap: 0 }}>
      <div className="pad-sm" style={{ borderBottom: "1.5px solid var(--rule)" }}>
        <div className="spread">
          <span className="h2">Grocery List</span>
          <button className="btn btn-sm btn-ghost">⇧ share</button>
        </div>
        <div className="note">Jun 2–8 · 14 items needed · 5 already in pantry</div>
      </div>

      <div className="col" style={{ flex: 1, overflow: "hidden", paddingBottom: 70 }}>
        <div className="pad-sm col" style={{ gap: 6 }}>
          <div className="eyebrow">To buy</div>
          {[
            "chicken breast · 2 lb",
            "salmon fillet · 1 lb",
            "rice · 2 cups",
            "broccoli · 2 heads",
            "yogurt · 32 oz",
            "tortillas · 1 pkg",
          ].map((it, i) => (
            <div key={i} className="row" style={{ gap: 8 }}>
              <span className="check" />
              <span>{it}</span>
            </div>
          ))}
        </div>

        <div className="divider-wavy" style={{ margin: "6px 14px" }} />

        <div className="pad-sm col" style={{ gap: 5 }}>
          <div className="eyebrow" style={{ color: "var(--olive)" }}>Skipping — already in your pantry</div>
          {[
            "olive oil",
            "garlic",
            "salt",
            "soy sauce",
            "onion",
          ].map((it, i) => (
            <div key={i} className="row" style={{ gap: 8 }}>
              <span className="check checked" style={{ borderColor: "var(--olive)" }} />
              <span className="scribble">{it}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tabbar">
        <div className="tab"><div className="dot" />Plan</div>
        <div className="tab"><div className="dot" />Recipes</div>
        <div className="tab"><div className="dot" />Pantry</div>
        <div className="tab active"><div className="dot" />List</div>
      </div>
    </div>

    <div className="callout" style={{ top: 270, left: 14, width: 110, color: "var(--olive)" }}>
      <span>pantry-aware<br/>auto-skip</span>
      <svg width="30" height="20" viewBox="0 0 30 20" style={{ top: -2, left: 100 }}>
        <path d="M2,18 Q14,8 28,4" fill="none" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M28,4 L22,7 M28,4 L26,10" fill="none" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    </div>
  </PhoneFrame>
);

// ──────────────────────────────────────────────────────────────
// 6 · Pantry (Mobile)
// ──────────────────────────────────────────────────────────────
const M_Pantry = () => (
  <PhoneFrame>
    <div className="col" style={{ height: "100%", gap: 0 }}>
      <div className="pad-sm" style={{ borderBottom: "1.5px solid var(--rule)" }}>
        <div className="spread">
          <span className="h2">Pantry</span>
          <button className="btn btn-sm btn-olive">＋ add</button>
        </div>
        <div className="note">what you already have · 23 items</div>
      </div>

      <div className="input-box" style={{ margin: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
        <span className="note">⌕</span>
        <span className="ghost-text">search…</span>
      </div>

      <div className="col" style={{ flex: 1, overflow: "hidden", padding: "0 12px", gap: 10 }}>
        {[
          ["Staples", ["olive oil","salt","pepper","sugar","flour"]],
          ["Pantry", ["rice","pasta","soy sauce","canned tomatoes"]],
          ["Fridge", ["garlic","onion","butter","milk"]],
        ].map(([group, items], i) => (
          <div key={i} className="col" style={{ gap: 4 }}>
            <span className="eyebrow">{group}</span>
            <div className="row" style={{ flexWrap: "wrap", gap: 5 }}>
              {items.map((it, j) => (
                <span key={j} className="chip">{it}</span>
              ))}
              <span className="chip box-dashed" style={{ borderStyle: "dashed", color: "var(--ink-fade)" }}>+</span>
            </div>
          </div>
        ))}
      </div>

      <div className="tabbar">
        <div className="tab"><div className="dot" />Plan</div>
        <div className="tab"><div className="dot" />Recipes</div>
        <div className="tab active"><div className="dot" />Pantry</div>
        <div className="tab"><div className="dot" />List</div>
      </div>
    </div>
  </PhoneFrame>
);

Object.assign(window, { M_DateRange, M_CalendarStack, M_CalendarList, M_SlotFill, M_RecipeStep1, M_RecipeStep2, M_Grocery, M_Pantry });
