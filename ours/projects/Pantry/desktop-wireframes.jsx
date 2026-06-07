/* eslint-disable */
// Desktop wireframes — 920×560

const DesktopFrame = ({ children, active }) => (
  <div className="wf wf-desktop" style={{ display: "flex", flexDirection: "column" }}>
    <div className="appbar">
      <div className="brand"><span className="brand-mark" /> Pantry</div>
      <div className="row" style={{ gap: 18, fontFamily: "var(--mono)", fontSize: 11, marginLeft: 12 }}>
        <span style={{ color: active === "plan" ? "var(--ink)" : "var(--ink-fade)", fontWeight: active === "plan" ? 700 : 400 }}>Plan</span>
        <span style={{ color: active === "recipes" ? "var(--ink)" : "var(--ink-fade)", fontWeight: active === "recipes" ? 700 : 400 }}>Recipes</span>
        <span style={{ color: active === "pantry" ? "var(--ink)" : "var(--ink-fade)", fontWeight: active === "pantry" ? 700 : 400 }}>Pantry</span>
        <span style={{ color: active === "list" ? "var(--ink)" : "var(--ink-fade)", fontWeight: active === "list" ? 700 : 400 }}>Grocery list</span>
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-clay btn-sm">＋ Add Recipe</button>
      <div className="note">jamie@</div>
    </div>
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
  </div>
);

// ──────────────────────────────────────────────────────────────
// D1 · Date Range / Home (Desktop)
// ──────────────────────────────────────────────────────────────
const D_DateRange = () => (
  <DesktopFrame active="plan">
    <div className="pad-lg" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, height: "100%" }}>
      <div className="col" style={{ gap: 16, justifyContent: "center" }}>
        <div className="eyebrow">Start here</div>
        <div className="h1 underline-sketch" style={{ display: "inline-block", fontSize: 42 }}>Plan some meals.</div>
        <div className="h-hand" style={{ fontSize: 20, color: "var(--ink-soft)" }}>
          Pick a range. We'll build a calendar. You fill in meals.<br/>
          We turn it into a grocery list — minus anything in your pantry.
        </div>

        <div className="row" style={{ gap: 16, marginTop: 14 }}>
          <div className="field" style={{ flex: 1 }}>
            <span className="field-label">Start date</span>
            <div className="input-box spread"><span>Mon · Jun 2, 2026</span><span className="note">📅</span></div>
          </div>
          <div className="h2" style={{ marginTop: 22 }}>→</div>
          <div className="field" style={{ flex: 1 }}>
            <span className="field-label">End date</span>
            <div className="input-box spread"><span>Sun · Jun 8, 2026</span><span className="note">📅</span></div>
          </div>
        </div>

        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          <span className="chip">3 days</span>
          <span className="chip">1 week</span>
          <span className="chip">2 weeks</span>
          <span className="chip">1 month</span>
          <span className="chip box-dashed" style={{ borderStyle: "dashed" }}>custom…</span>
        </div>

        <div className="row" style={{ gap: 10, marginTop: 14 }}>
          <button className="btn btn-brown btn-lg">Build my calendar →</button>
          <button className="btn btn-ghost btn-lg">or pick up last week's plan</button>
        </div>
        <div className="note">7 days · 21 meal slots · pantry currently has 23 items</div>
      </div>

      <div className="box pad" style={{ position: "relative" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Preview · Jun 2026</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontFamily: "var(--mono)", fontSize: 10 }}>
          {["M","T","W","T","F","S","S"].map((d,i) => (
            <div key={i} className="center" style={{ color: "var(--ink-fade)" }}>{d}</div>
          ))}
          {Array.from({length: 35}).map((_, i) => {
            const day = i - 6;
            const inRange = day >= 2 && day <= 8;
            return (
              <div key={i} className="center" style={{
                aspectRatio: "1",
                border: inRange ? "1.5px solid var(--brown)" : "1.5px solid transparent",
                background: inRange ? "rgba(138,111,78,0.15)" : "transparent",
                borderRadius: 4,
                color: day > 0 && day <= 30 ? "var(--ink)" : "var(--ink-fade)",
                fontSize: 11
              }}>
                {day > 0 && day <= 30 ? day : ""}
              </div>
            );
          })}
        </div>
        <div className="divider-wavy" style={{ margin: "12px 0" }} />
        <div className="col" style={{ gap: 4 }}>
          <div className="row spread"><span className="note">Selected range</span><span className="h3" style={{ fontSize: 16 }}>7 days</span></div>
          <div className="row spread"><span className="note">Meal slots</span><span className="h3" style={{ fontSize: 16 }}>21</span></div>
          <div className="row spread"><span className="note">Recipes ready</span><span className="h3" style={{ fontSize: 16 }}>23</span></div>
        </div>
      </div>
    </div>

    <div className="callout" style={{ top: 250, right: 380, width: 130 }}>
      <span>add-recipe lives here<br/>top right, every page</span>
      <svg width="80" height="40" viewBox="0 0 80 40" style={{ top: -36, left: 60 }}>
        <path d="M4,38 Q40,20 76,2" fill="none" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M76,2 L70,6 M76,2 L72,9" fill="none" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    </div>
  </DesktopFrame>
);

// ──────────────────────────────────────────────────────────────
// D2A · Calendar — Week Grid (Desktop)
// ──────────────────────────────────────────────────────────────
const D_CalendarGrid = () => {
  const days = ["Mon · Jun 2","Tue · Jun 3","Wed · Jun 4","Thu · Jun 5","Fri · Jun 6","Sat · Jun 7","Sun · Jun 8"];
  const slots = ["Breakfast","Lunch","Dinner"];
  const cells = {
    "Mon·Breakfast": ["Oatmeal + berries", null, "filled"],
    "Mon·Lunch": ["Café down the street", null, "eatout"],
    "Mon·Dinner": ["Grilled Chicken Bowl", "rice · broccoli · sauce", "filled"],
    "Tue·Lunch": ["winging it", null, "adhoc"],
    "Tue·Dinner": ["Pasta Primavera", "salad · bread", "filled"],
    "Wed·Breakfast": ["Yogurt + granola", null, "filled"],
    "Wed·Lunch": ["Leftover pasta", null, "filled"],
    "Thu·Dinner": ["Tacos", "rice · guac", "filled"],
    "Fri·Lunch": ["Office lunch", null, "eatout"],
    "Fri·Dinner": ["Salmon + Veg", "couscous", "filled"],
    "Sat·Breakfast": ["Pancakes", null, "filled"],
    "Sat·Dinner": ["winging it", null, "adhoc"],
    "Sun·Lunch": ["Brunch w/ Sam", null, "eatout"],
    "Sun·Dinner": ["Chicken Bowl (lo)", "rice · broccoli", "filled"],
  };

  return (
    <DesktopFrame active="plan">
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div className="spread pad-sm" style={{ borderBottom: "1.5px solid var(--rule)" }}>
          <div className="row" style={{ gap: 10 }}>
            <span className="h2">Week of Jun 2</span>
            <button className="btn btn-sm btn-ghost">← prev</button>
            <button className="btn btn-sm btn-ghost">next →</button>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span className="note">15 / 21 set</span>
            <button className="btn btn-sm">Edit dates</button>
            <button className="btn btn-sm btn-terracotta">Generate list →</button>
          </div>
        </div>

        <div style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "70px repeat(7, 1fr)",
          gridTemplateRows: "auto repeat(3, 1fr)",
          gap: 4,
          padding: 10,
          overflow: "hidden",
        }}>
          <div />
          {days.map(d => (
            <div key={d} className="h3" style={{ fontSize: 13, padding: "4px 6px" }}>
              {d}
            </div>
          ))}

          {slots.map(s => (
            <React.Fragment key={s}>
              <div className="slot-label" style={{
                writingMode: "horizontal-tb",
                alignSelf: "center",
                paddingRight: 4,
                textAlign: "right"
              }}>{s}</div>
              {days.map(d => {
                const key = `${d.slice(0,3)}·${s}`;
                const cell = cells[key];
                const kind = cell?.[2] || "empty";
                const cls = `slot slot-${kind}`;
                return (
                  <div key={d+s} className={cls}>
                    {!cell && <span>+ add</span>}
                    {cell && <>
                      <span className="mealname">{cell[0]}</span>
                      {cell[1] && <span className="mealsides">{cell[1]}</span>}
                      {kind === "eatout" && <span className="meta">EAT OUT</span>}
                      {kind === "adhoc" && <span className="meta">AD HOC</span>}
                    </>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="callout" style={{ top: 95, left: 240, width: 100, color: "var(--terracotta)" }}>
        <span>striped = eat out</span>
        <svg width="40" height="24" viewBox="0 0 40 24" style={{ top: 14, left: -20 }}>
          <path d="M38,2 Q20,12 4,22" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M4,22 L11,20 M4,22 L7,15" fill="none" stroke="currentColor" strokeWidth="1.4"/>
        </svg>
      </div>
      <div className="callout" style={{ top: 305, left: 220, width: 100, color: "var(--olive)" }}>
        <span>diag = ad hoc<br/>(no groceries)</span>
        <svg width="40" height="24" viewBox="0 0 40 24" style={{ top: -16, left: 70 }}>
          <path d="M2,22 Q20,12 38,2" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M38,2 L32,6 M38,2 L34,9" fill="none" stroke="currentColor" strokeWidth="1.4"/>
        </svg>
      </div>
    </DesktopFrame>
  );
};

// ──────────────────────────────────────────────────────────────
// D2B · Calendar — 3-col Day Stack (Desktop)
// ──────────────────────────────────────────────────────────────
const D_CalendarStack = () => (
  <DesktopFrame active="plan">
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="spread pad-sm" style={{ borderBottom: "1.5px solid var(--rule)" }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="h2">Jun 2 – 8, 2026</span>
          <div className="row" style={{ gap: 4 }}>
            {["M","T","W","T","F","S","S"].map((d,i) => (
              <span key={i} className={`chip ${i===0?"chip-brown":""}`} style={{ fontSize: 11, padding: "1px 8px" }}>{d}</span>
            ))}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="note">today: Tue</span>
          <button className="btn btn-sm btn-terracotta">Generate list →</button>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 10,
        padding: 12,
        overflow: "hidden",
      }}>
        {[
          { d: "Mon Jun 2", count: "3/3", meals: [["Breakfast","Oatmeal + berries","filled"],["Lunch","Café down the street","eatout"],["Dinner","Grilled Chicken Bowl","filled","rice · broccoli"]] },
          { d: "Tue Jun 3", count: "1/3", meals: [["Breakfast","—","empty"],["Lunch","winging it","adhoc"],["Dinner","Pasta Primavera","filled","salad · bread"]] },
          { d: "Wed Jun 4", count: "2/3", meals: [["Breakfast","Yogurt + granola","filled"],["Lunch","Leftover pasta","filled"],["Dinner","—","empty"]] },
          { d: "Thu Jun 5", count: "1/3", meals: [["Breakfast","—","empty"],["Lunch","—","empty"],["Dinner","Tacos","filled","rice · guac"]] },
          { d: "Fri Jun 6", count: "2/3", meals: [["Breakfast","—","empty"],["Lunch","Office lunch","eatout"],["Dinner","Salmon + Veg","filled","couscous"]] },
          { d: "Sat Jun 7", count: "2/3", meals: [["Breakfast","Pancakes","filled"],["Lunch","—","empty"],["Dinner","winging it","adhoc"]] },
          { d: "Sun Jun 8", count: "2/3", meals: [["Breakfast","—","empty"],["Lunch","Brunch w/ Sam","eatout"],["Dinner","Chicken Bowl (lo)","filled","rice"]] },
        ].map((day, i) => (
          <div key={i} className="col" style={{ gap: 4, minWidth: 0 }}>
            <div className="row spread" style={{ paddingBottom: 4, borderBottom: "1.5px solid var(--rule-soft)" }}>
              <span className="h3" style={{ fontSize: 13 }}>{day.d}</span>
              <span className="note">{day.count}</span>
            </div>
            {day.meals.map(([slot, name, kind, sides], j) => (
              <div key={j} className={`slot slot-${kind}`} style={{ minHeight: 50 }}>
                <span className="slot-label">{slot}</span>
                <span className="mealname" style={{ fontStyle: kind==="empty"?"italic":"normal", color: kind==="empty"?"var(--ink-fade)":"var(--ink)" }}>{name}</span>
                {sides && <span className="mealsides">{sides}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </DesktopFrame>
);

// ──────────────────────────────────────────────────────────────
// D3 · Meal Slot Fill — Right Panel (Desktop)
// ──────────────────────────────────────────────────────────────
const D_SlotFill = () => (
  <DesktopFrame active="plan">
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 320px" }}>
      <div style={{ padding: 12, opacity: 0.45, filter: "blur(0.6px)", pointerEvents: "none" }}>
        <div className="spread" style={{ marginBottom: 8 }}><span className="h2">Week of Jun 2</span><span /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, gridTemplateRows: "repeat(3, 60px)" }}>
          {Array.from({length: 21}).map((_, i) => (
            <div key={i} className="slot" style={{ height: "100%" }} />
          ))}
        </div>
      </div>

      <div className="box" style={{
        borderRadius: 0,
        borderTop: 0,
        borderRight: 0,
        borderBottom: 0,
        borderLeft: "1.5px solid var(--rule)",
        padding: 18,
        background: "var(--paper)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        <div className="spread">
          <span className="eyebrow">Tue Jun 3 · Lunch</span>
          <span className="note">✕</span>
        </div>
        <div className="h1 underline-sketch" style={{ display: "inline-block", fontSize: 26 }}>Fill this slot</div>

        <div className="col" style={{ gap: 6, marginTop: 4 }}>
          <button className="btn" style={{ width: "100%", justifyContent: "flex-start", padding: "10px 12px", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🍲</span>
            <div style={{ textAlign: "left" }}>
              <div className="h3" style={{ fontSize: 14 }}>Pick a recipe</div>
              <div className="note">from your library</div>
            </div>
          </button>
          <button className="btn btn-terracotta" style={{ width: "100%", justifyContent: "flex-start", padding: "10px 12px", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🥡</span>
            <div style={{ textAlign: "left" }}>
              <div className="h3" style={{ fontSize: 14, color: "inherit" }}>Eat out</div>
              <div className="note" style={{ color: "rgba(253,246,236,0.8)" }}>no groceries added</div>
            </div>
          </button>
          <button className="btn btn-olive" style={{ width: "100%", justifyContent: "flex-start", padding: "10px 12px", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🤷</span>
            <div style={{ textAlign: "left" }}>
              <div className="h3" style={{ fontSize: 14, color: "inherit" }}>Ad hoc</div>
              <div className="note" style={{ color: "rgba(247,245,230,0.8)" }}>winging it · no groceries</div>
            </div>
          </button>
        </div>

        <div className="divider-wavy" />

        <div className="eyebrow">Recent recipes</div>
        <div className="col" style={{ gap: 4 }}>
          {["Grilled Chicken Bowl","Pasta Primavera","Tacos","Salmon + Veg"].map((r,i) => (
            <div key={i} className="row" style={{ gap: 8, padding: "5px 8px", borderRadius: 5, border: "1.5px solid var(--rule-soft)" }}>
              <div className="placeholder-img" style={{ width: 24, height: 24, flex: "0 0 24px", fontSize: 7 }}>img</div>
              <span style={{ fontSize: 12 }}>{r}</span>
              <span style={{ flex: 1 }} />
              <span className="note">+</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </DesktopFrame>
);

// ──────────────────────────────────────────────────────────────
// D4 · Add Recipe — All steps in one view (Desktop)
// ──────────────────────────────────────────────────────────────
const D_AddRecipe = () => (
  <DesktopFrame active="recipes">
    <div style={{ height: "100%", padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, overflow: "hidden" }}>
      <div className="col" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 6 }}>
          <span className="chip chip-brown" style={{ fontSize: 10 }}>1 · MEAL</span>
          <span className="chip" style={{ fontSize: 10 }}>2 · INGREDIENTS</span>
          <span className="chip" style={{ fontSize: 10 }}>3 · SAVE</span>
        </div>
        <div className="h1 underline-sketch" style={{ display: "inline-block", fontSize: 32 }}>New meal bundle</div>
        <div className="h-hand" style={{ fontSize: 16, color: "var(--ink-soft)" }}>
          A meal is a main + any sides + a flat ingredient list.
        </div>

        <div className="field">
          <span className="field-label">Main dish *</span>
          <div className="input-box" style={{ fontSize: 16 }}>Grilled Chicken Bowl</div>
        </div>

        <div className="col" style={{ gap: 6 }}>
          <span className="field-label">Sides (optional · any number)</span>
          <div className="row" style={{ gap: 5, flexWrap: "wrap" }}>
            <span className="chip chip-olive">Rice ✕</span>
            <span className="chip chip-olive">Broccoli ✕</span>
            <span className="chip chip-olive">Garlic Sauce ✕</span>
            <span className="chip box-dashed" style={{ borderStyle: "dashed" }}>+ add side</span>
          </div>
        </div>

        <div className="col" style={{ gap: 4 }}>
          <span className="field-label">Ingredients (flat list · one per line)</span>
          <div className="box" style={{ padding: 10, fontFamily: "var(--mono)", fontSize: 12, background: "rgba(255,255,255,0.5)", minHeight: 130 }}>
            chicken breast, 2 lb<br/>
            rice, 2 cups<br/>
            broccoli, 2 heads<br/>
            garlic, 4 cloves<br/>
            olive oil, 3 tbsp<br/>
            soy sauce, 2 tbsp<br/>
            <span className="ghost-text">│ add another…</span>
          </div>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <button className="btn">Cancel</button>
          <span style={{ flex: 1 }} />
          <button className="btn btn-brown btn-lg">Save recipe</button>
        </div>
      </div>

      <div className="box pad" style={{ position: "relative" }}>
        <div className="eyebrow">Preview · how it'll look in the calendar</div>

        <div className="slot slot-filled" style={{ marginTop: 8, padding: 10 }}>
          <span className="slot-label">Dinner · Tue Jun 3</span>
          <span className="h3" style={{ fontSize: 16, marginTop: 2 }}>Grilled Chicken Bowl</span>
          <span className="mealsides">rice · broccoli · garlic sauce</span>
        </div>

        <div className="divider-wavy" style={{ margin: "16px 0" }} />

        <div className="eyebrow">Will add to your grocery list:</div>
        <div className="col" style={{ gap: 4, marginTop: 8, fontFamily: "var(--mono)", fontSize: 12 }}>
          {[
            ["chicken breast, 2 lb", true],
            ["rice, 2 cups", false],
            ["broccoli, 2 heads", true],
            ["garlic, 4 cloves", false],
            ["olive oil, 3 tbsp", false],
            ["soy sauce, 2 tbsp", false],
          ].map(([it, need], i) => (
            <div key={i} className="row" style={{ gap: 8 }}>
              <span className="check" style={{ borderColor: need?"var(--ink)":"var(--olive)" }}>{!need && "✓"}</span>
              <span className={need ? "" : "scribble"}>{it}</span>
              {!need && <span className="note" style={{ color: "var(--olive)" }}>(in pantry)</span>}
            </div>
          ))}
        </div>

        <div className="callout" style={{ top: 200, right: 16, width: 130, color: "var(--olive)" }}>
          <span>auto-checked against<br/>your pantry</span>
          <svg width="60" height="40" viewBox="0 0 60 40" style={{ top: 28, left: -40 }}>
            <path d="M58,2 Q30,18 4,38" fill="none" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M4,38 L11,36 M4,38 L7,31" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          </svg>
        </div>
      </div>
    </div>
  </DesktopFrame>
);

// ──────────────────────────────────────────────────────────────
// D5 · Grocery List (Desktop)
// ──────────────────────────────────────────────────────────────
const D_Grocery = () => (
  <DesktopFrame active="list">
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr 280px" }}>
      <div className="col pad" style={{ gap: 10, borderRight: "1.5px solid var(--rule-soft)" }}>
        <div className="spread">
          <span className="h2">To buy</span>
          <span className="chip chip-brown">14 items</span>
        </div>
        <div className="eyebrow">Produce</div>
        <div className="col" style={{ gap: 4 }}>
          {["broccoli · 2 heads","spinach · 1 bag","avocado · 3","lemons · 2","cilantro · 1 bunch"].map((it,i) => (
            <div key={i} className="row" style={{ gap: 8 }}><span className="check" /><span>{it}</span></div>
          ))}
        </div>
        <div className="eyebrow" style={{ marginTop: 4 }}>Protein</div>
        <div className="col" style={{ gap: 4 }}>
          {["chicken breast · 2 lb","salmon fillet · 1 lb","ground beef · 1 lb"].map((it,i) => (
            <div key={i} className="row" style={{ gap: 8 }}><span className="check" /><span>{it}</span></div>
          ))}
        </div>
        <div className="eyebrow" style={{ marginTop: 4 }}>Dairy</div>
        <div className="col" style={{ gap: 4 }}>
          {["yogurt · 32 oz","cheddar · 8 oz"].map((it,i) => (
            <div key={i} className="row" style={{ gap: 8 }}><span className="check" /><span>{it}</span></div>
          ))}
        </div>
      </div>

      <div className="col pad" style={{ gap: 8, borderRight: "1.5px solid var(--rule-soft)" }}>
        <div className="spread">
          <span className="h2" style={{ color: "var(--olive)" }}>Already have</span>
          <span className="chip chip-olive">5 skipped</span>
        </div>
        <div className="note">we scanned your pantry and skipped these:</div>
        <div className="col" style={{ gap: 4, marginTop: 4 }}>
          {[
            ["olive oil","Grilled Chicken Bowl, Salmon + Veg"],
            ["garlic","Grilled Chicken Bowl, Tacos"],
            ["salt","every recipe"],
            ["soy sauce","Grilled Chicken Bowl"],
            ["onion","Tacos, Pasta Primavera"],
          ].map(([it, src], i) => (
            <div key={i} className="row" style={{ gap: 8, alignItems: "flex-start" }}>
              <span className="check checked" style={{ borderColor: "var(--olive)" }} />
              <div className="col" style={{ gap: 1 }}>
                <span className="scribble">{it}</span>
                <span className="note" style={{ fontSize: 9 }}>used in: {src}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="divider-wavy" style={{ margin: "8px 0" }} />
        <div className="note">disagree? <span className="underline-sketch" style={{ display: "inline-block" }}>add to list anyway</span></div>
      </div>

      <div className="col pad-sm" style={{ gap: 10, background: "rgba(0,0,0,0.02)" }}>
        <div className="h3">Summary</div>
        <div className="col" style={{ gap: 4 }}>
          <div className="spread"><span className="note">Range</span><span style={{ fontSize: 12 }}>Jun 2 – 8</span></div>
          <div className="spread"><span className="note">Meals planned</span><span style={{ fontSize: 12 }}>15</span></div>
          <div className="spread"><span className="note">Eat out</span><span style={{ fontSize: 12 }}>3</span></div>
          <div className="spread"><span className="note">Ad hoc</span><span style={{ fontSize: 12 }}>2</span></div>
          <div className="spread"><span className="note">Empty slots</span><span style={{ fontSize: 12 }}>1</span></div>
        </div>
        <div className="divider" />
        <div className="col" style={{ gap: 6 }}>
          <button className="btn btn-brown" style={{ width: "100%" }}>⇧ Send to phone</button>
          <button className="btn" style={{ width: "100%" }}>Copy as text</button>
          <button className="btn" style={{ width: "100%" }}>Print</button>
        </div>

        <div className="divider-wavy" />
        <div className="note">re-run list if you change meals</div>
        <button className="btn btn-clay btn-sm">↻ Regenerate</button>
      </div>
    </div>
  </DesktopFrame>
);

// ──────────────────────────────────────────────────────────────
// D6 · Pantry (Desktop)
// ──────────────────────────────────────────────────────────────
const D_Pantry = () => (
  <DesktopFrame active="pantry">
    <div className="col pad" style={{ height: "100%", gap: 12 }}>
      <div className="spread">
        <div>
          <div className="h2">Your pantry</div>
          <div className="note">23 items · last updated yesterday · used to skip groceries you already have</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="input-box" style={{ minWidth: 200 }}>⌕ <span className="ghost-text">search…</span></div>
          <button className="btn btn-olive">＋ Add items</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, overflow: "hidden" }}>
        {[
          ["Staples", ["olive oil","salt","pepper","sugar","flour","baking soda"]],
          ["Pantry", ["rice","pasta","soy sauce","canned tomatoes","beans","tortillas"]],
          ["Fridge", ["garlic","onion","butter","milk","eggs","yogurt"]],
          ["Freezer", ["frozen peas","ground beef","bread","stock"]],
        ].map(([group, items], i) => (
          <div key={i} className="box pad-sm col" style={{ gap: 8 }}>
            <div className="spread">
              <span className="h3">{group}</span>
              <span className="note">{items.length}</span>
            </div>
            <div className="col" style={{ gap: 3 }}>
              {items.map((it, j) => (
                <div key={j} className="row spread" style={{ padding: "2px 0", borderBottom: j < items.length-1 ? "1px dotted var(--rule-soft)" : "none" }}>
                  <span style={{ fontSize: 12 }}>{it}</span>
                  <span className="note">✕</span>
                </div>
              ))}
              <div className="row" style={{ color: "var(--ink-fade)", fontStyle: "italic", paddingTop: 4 }}>
                <span>+ add</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="callout" style={{ top: 90, left: 280, width: 130 }}>
        <span>simple item list —<br/>no quantities tracked</span>
        <svg width="60" height="40" viewBox="0 0 60 40" style={{ top: -32, left: 30 }}>
          <path d="M4,38 Q30,18 56,2" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M56,2 L50,6 M56,2 L52,9" fill="none" stroke="currentColor" strokeWidth="1.4"/>
        </svg>
      </div>
    </div>
  </DesktopFrame>
);

Object.assign(window, { D_DateRange, D_CalendarGrid, D_CalendarStack, D_SlotFill, D_AddRecipe, D_Grocery, D_Pantry });
