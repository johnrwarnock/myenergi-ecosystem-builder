import { useState } from "react";
import zappiImgUrl  from "./zappi.svg";
import mainSbImgUrl from "./main switchboard.svg";
import gridImgUrl   from "./grid.svg";
import harviImgUrl  from "./harvi.svg";
import libbiImgUrl  from "./libbi.svg";
import eddiImgUrl   from "./eddi.svg";
import eddiPlusImgUrl from "./eddi+.svg";
import gloImgUrl    from "./GLO.svg";

const G     = "#40ff7a";   // myenergi green (borders)
const G_TXT = "#1a6b35";   // dark green text for controller boxes
const DARK  = "#ffffff";   // diagram / page background (white)
const YELLOW= "#b07700";   // harvi / secondary amber (darkened for white bg)
const WHITE = "#111111";   // power lines (heavy black)
const MUTED = "#888";
const CT_COL= "#555";
const SIG   = "#aaa";
const BOX_BG= "#f2f2f2";   // infrastructure box fill
const phSp  = 7;

const DEVICE_IMGS = {
  harvi: harviImgUrl,
  libbi: libbiImgUrl,
  eddi:  eddiImgUrl,
  "eddi+": eddiPlusImgUrl,
  GLO:   gloImgUrl,
};
// Scale multipliers relative to base devW/devH
const DEVICE_SCALES = { zappi:2, eddi:1.5, "eddi+":1.5, libbi:2.25 };

const CONFIGS = {
  "1ph · solar":        { sp:"1ph", inv:[{ph:"1ph",dc:false,db:false,ms:true}],  ab:[],          wl:false, pr:["zappi"] },
  "1ph · DC hybrid":    { sp:"1ph", inv:[{ph:"1ph",dc:true, db:true, ms:true}],  ab:[],          wl:false, pr:["zappi"] },
  "1ph · AC battery":   { sp:"1ph", inv:[{ph:"1ph",dc:false,db:false,ms:true}],  ab:[{mb:true}], wl:false, pr:["zappi"] },
  "1ph · wireless":     { sp:"1ph", inv:[{ph:"1ph",dc:false,db:false,ms:true}],  ab:[],          wl:true,  pr:["zappi"] },
  "3ph · solar":        { sp:"3ph", inv:[{ph:"3ph",dc:false,db:false,ms:true}],  ab:[],          wl:false, pr:["zappi"] },
  "3ph · wireless":     { sp:"3ph", inv:[{ph:"3ph",dc:false,db:false,ms:true}],  ab:[],          wl:true,  pr:["zappi"] },
  "3ph · 1ph device":  { sp:"3ph", inv:[{ph:"1ph",dc:false,db:false,ms:true}],  ab:[],          wl:true,  pr:["zappi"] },
  "2×1ph no wireless":  { sp:"1ph", inv:[{ph:"1ph",dc:false,db:false,ms:true},{ph:"1ph",dc:false,db:false,ms:true}], ab:[], wl:false, pr:["zappi"] },
  "2×1ph wireless":     { sp:"1ph", inv:[{ph:"1ph",dc:false,db:false,ms:true},{ph:"1ph",dc:false,db:false,ms:true}], ab:[], wl:true,  pr:["zappi"] },
  "3ph+1ph mix":        { sp:"3ph", inv:[{ph:"3ph",dc:true,db:true,ms:true},{ph:"1ph",dc:false,db:false,ms:true}],  ab:[], wl:false, pr:["zappi"] },
  "multi-dev ×3":       { sp:"1ph", inv:[{ph:"1ph",dc:false,db:false,ms:true}],  ab:[],          wl:false, pr:["zappi","eddi","libbi"] },
  "full mix":           { sp:"3ph", inv:[{ph:"3ph",dc:true,db:true,ms:true},{ph:"1ph",dc:false,db:false,ms:true}], ab:[], wl:false, pr:["zappi","eddi","libbi"] },
  "1ph · libbi AC":  { sp:"1ph", inv:[{ph:"1ph",dc:false,db:false,ms:true}], ab:[{mb:false}], wl:false, pr:["zappi","libbi"] },
  "1ph · libbi DC":  { sp:"1ph", inv:[{ph:"1ph",dc:true, db:true, ms:true}], ab:[],           wl:false, pr:["zappi","libbi"] },
};

const CT = ({ x, y, label }) => (
  <g>
    <rect x={x-5} y={y-8} width={10} height={16} rx={1.5} fill={CT_COL} stroke="#333" strokeWidth={0.8}/>
    {label && <text x={x} y={y+22} textAnchor="middle" fill={CT_COL} fontSize={7} fontWeight="700" fontFamily="Overpass,sans-serif">{label}</text>}
  </g>
);

const trunc = (s, n) => !s || s.length <= n ? (s || '') : s.slice(0, n - 1) + '\u2026';

const Blk = ({ x, y, w=80, h=36, label, sub, bc=WHITE, lc=WHITE, bg=BOX_BG, labelFs=8.5 }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={4} fill={bg} stroke={bc} strokeWidth={1.5}/>
    <text x={x+w/2} y={y+h/2-(sub?6:0)} textAnchor="middle" dominantBaseline="middle" fill={lc} fontSize={labelFs} fontWeight="700" fontFamily="Overpass,sans-serif">{label}</text>
    {sub && <text x={x+w/2} y={y+h/2+8} textAnchor="middle" fill={lc} fontSize={7} fontFamily="Overpass,sans-serif">{sub}</text>}
  </g>
);

const BatIcon = ({ x, y, w=50, h=38, label="BATTERY" }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={3} fill={BOX_BG} stroke="#666" strokeWidth={1.5}/>
    <line x1={x} y1={y+h*0.35} x2={x+w} y2={y+h*0.35} stroke="#bbb" strokeWidth={0.8}/>
    <line x1={x} y1={y+h*0.68} x2={x+w} y2={y+h*0.68} stroke="#bbb" strokeWidth={0.8}/>
    <rect x={x+w*0.32} y={y+h*0.74} width={w*0.36} height={h*0.18} rx={2} fill="none" stroke="#aaa" strokeWidth={1}/>
    <text x={x+w/2} y={y+h+12} textAnchor="middle" fill={WHITE} fontSize={8} fontWeight="700" fontFamily="Overpass,sans-serif">{label}</text>
  </g>
);

const Curve = ({ x1, y1, x2, y2, color=SIG, dashed=false, sw=1.8 }) => {
  const cp1x=x1, cp1y=y1+(y2-y1)*0.6;
  const cp2x=x2, cp2y=y2-(y2-y1)*0.35;
  return <path d={`M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`}
    fill="none" stroke={color} strokeWidth={sw} strokeDasharray={dashed?"7 4":undefined}/>;
};

// WiFi symbol: rotate=0 → waves open UP; 90 → RIGHT; 180 → DOWN; 270 → LEFT
// "away from source" = rotate toward destination
const WiFi = ({ cx, cy, size=13, rotate=0, color=YELLOW }) => {
  const sweep = 1.1; // half-angle ~63°
  const radii = [size*0.3, size*0.56, size*0.82];
  return (
    <g transform={`translate(${cx},${cy}) rotate(${rotate})`}>
      {radii.map((r, i) => {
        const sx = (-Math.sin(sweep)*r).toFixed(2);
        const sy = (-Math.cos(sweep)*r).toFixed(2);
        const ex = ( Math.sin(sweep)*r).toFixed(2);
        const ey = (-Math.cos(sweep)*r).toFixed(2);
        return <path key={i}
          d={`M${sx},${sy} A${r.toFixed(2)},${r.toFixed(2)} 0 0,1 ${ex},${ey}`}
          fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"/>;
      })}
      <circle cx={0} cy={(size*0.15).toFixed(2)} r={(size*0.14).toFixed(2)} fill={color}/>
    </g>
  );
};

export function Diagram({ config }) {
  const { sp, inv, ab, wl, pr } = config;
  const hasLibbi      = pr.includes("libbi");
  const libbiIsBat_dc = hasLibbi && inv.some(v=>v.dc&&v.db);
  const libbiIsBat_ac = hasLibbi && ab.length > 0;
  const libbiImgW=44, libbiImgH=80;
  const libbiDcW=55, libbiDcH=100; // DC hybrid replacement — 25% larger than AC battery libbi
  const is2ph = sp === "2ph";
  const is3ph = sp === "3ph";
  const isMultiPh = is2ph || is3ph;
  const nSitePh = is3ph ? 3 : is2ph ? 2 : 1;
  const siteOs  = is3ph ? [-phSp,0,phSp] : is2ph ? [-phSp/2, phSp/2] : [0];
  const siteXOs = is3ph ? [-5,0,5] : is2ph ? [-2.5, 2.5] : [0];
  const hasSolar   = inv.length > 0;
  const hasACBat   = ab.length > 0;
  const multiInv   = inv.length > 1;
  const iIs3 = v => v.ph==="3ph"||v.ph==="2ph";
  const iOs  = v => iIs3(v)?[-phSp,0,phSp]:[0];
  const iXOs = v => iIs3(v)?[-5,0,5]:[0];

  // ── Harvi logic ───────────────────────────────────────────
  // 1ph wireless: total CTs ≤ 3 → single harvi on LEFT of zappi
  const solarCTcount = inv.filter(v=>v.ms).reduce((s,v)=>s+(iIs3(v)?3:1), 0);
  const acBatCTcount = (hasACBat && ab[0]?.mb) ? 1 : 0;
  const totalWLCTs   = (wl ? nSitePh : 0) + (wl || isMultiPh ? solarCTcount : 0) + acBatCTcount;
  const use1phHarvi  = !isMultiPh && wl;        // 1ph wireless: always single harvi left of zappi
  const solarToHarvi = !isMultiPh ? use1phHarvi : (inv.some(v=>v.ms));  // multi-ph: solar always to harvi
  // 3ph: controller needs harvi for grid if it can't support 3 CTs natively (eddi/GLO support only 2)
  const CTRL_CTS = { "zappi":3, "eddi+":3, "eddi":2, "GLO":2, "libbi":3 };
  const ctrlCtsSupported = CTRL_CTS[pr[0]] ?? 3;
  const gridToHarvi  = wl || (is3ph && ctrlCtsSupported < 3);
  const showHarvi    = gridToHarvi || solarToHarvi;

  // ── Fixed layout constants ────────────────────────────────
  const VW=980, busY=175;
  const pylonX=55;
  const meterX=115, meterW=56, meterH=34;
  const boardX=260, boardW=96, boardH=50, boardCX=308;
  const invX=474, invW=76, invH=42, invCX=invX+invW/2; // 514
  const pvX=598, pvW=62, pvH=40;
  const solarTapX = boardX+boardW+52; // 408
  const solarCtPos = invX-28;          // 446 — solar CT X on bus
  const dcBatW=50, dcBatH=38;
  const baseGap=44;
  const harviW=66, harviH=34, harviHGap=10, harviVGap=10;
  const devW=boardW, devH=36, secStep=56;
  const devHOf = name => Math.round(devH * (DEVICE_SCALES[name] || 1));
  const devWOf = name => Math.round(devW * (DEVICE_SCALES[name] || 1));
  const devGap = secStep - devH; // 20px — consistent visual gap between stacked devices

  // ── Inverter center Ys (account for DC battery spacing below prev) ──
  const invCYs = [];
  inv.forEach((v,i) => {
    if (i===0) { invCYs.push(busY); return; }
    let bottom;
    if (libbiIsBat_dc && inv[i-1].dc && inv[i-1].db) {
      bottom = invCYs[i-1] + libbiDcH/2; // libbi centred at cy, bottom extent = libbiDcH/2
    } else {
      bottom = invCYs[i-1]+invH/2;
      if (inv[i-1].dc && inv[i-1].db) bottom += 22+dcBatH+16;
    }
    invCYs.push(bottom + invH/2 + 22);
  });

  // Right-side bottom (below all inverters+DC bats)
  let rightBottom = busY+boardH/2;
  inv.forEach((v,i) => {
    let b;
    if (libbiIsBat_dc && v.dc && v.db) {
      b = invCYs[i] + libbiDcH/2;
    } else {
      b = invCYs[i]+invH/2;
      if (v.dc&&v.db) b += 22+dcBatH;
    }
    if (b>rightBottom) rightBottom=b;
  });

  // ── AC Battery ───────────────────────────────────────────
  const acBatW=50, acBatH=40;
  const acBatTopY = busY - invH/2 - acBatH - 68;
  const acBatBotY_eff = libbiIsBat_ac ? acBatTopY + libbiImgH : acBatTopY + acBatH;
  const acBatBotY = acBatBotY_eff;
  const acBatCX   = invCX;
  const acBatLineY= acBatBotY_eff;       // horizontal run at battery bottom
  // CT X = midpoint between boardX+boardW and solarCtPos
  const acBatCtX  = Math.round((boardX+boardW + solarCtPos) / 2); // 401

  // ── Controller top Y ─────────────────────────────────────
  const extraGap = (!isMultiPh && hasSolar && hasACBat) ? Math.round(baseGap*0.5) : 0;
  const minCtrlTopY = busY + boardH/2 + 122; // 322 — matches 3ph-solar gap
  let ctrlTopY = Math.max(rightBottom + baseGap + extraGap, minCtrlTopY);
  const devList = libbiIsBat_dc || libbiIsBat_ac ? pr.filter(n=>n!=="libbi") : pr;
  const nDevices = devList.length;
  const devStartCX = nDevices > 1 ? boardCX - Math.round((nDevices-1)*24/2) : boardCX;
  const ctrlX = devStartCX-devW/2;
  const ctrlCX = devStartCX;

  // ── Harvi positions — centred vertically between MAIN SWITCHBOARD and zappi ──
  // Always use minCtrlTopY so position is identical across all diagrams
  const harviTopY = Math.round((busY + boardH/2 + minCtrlTopY) / 2 - harviH/2);

  let leftHarvi=null, rightHarvis=[];

  if (use1phHarvi) {
    // Single harvi left of zappi — placed after we know ctrlTopY; placeholder cx here
    leftHarvi = { side:"left", forGrid:true, label:"harvi" };
  } else {
    if (gridToHarvi) {
      leftHarvi = { side:"left", x:ctrlCX-harviW-22, topY:harviTopY, cx:ctrlCX-harviW-22+harviW/2, bottomY:harviTopY+harviH, forGrid:true, label:"harvi 1" };
    }
    if (solarToHarvi && inv.some(v=>v.ms)) {
      const nSH = Math.ceil(solarCTcount/3);
      for (let i=0;i<nSH;i++) {
        const hx = ctrlCX+22 + i*(harviW+harviHGap);
        const maxCTY = i < nSH-1 ? invCYs[i] : Math.max(...invCYs.slice(i));
        const hTopY  = Math.max(harviTopY, maxCTY + 30);
        rightHarvis.push({ side:"right", x:hx, topY:hTopY, cx:hx+harviW/2, bottomY:hTopY+harviH, forGrid:false, idx:i,
          label: (gridToHarvi ? `harvi ${i+2}` : (nSH>1 ? `harvi ${i+1}` : "harvi")) });
      }
    }
    if (!gridToHarvi && rightHarvis.length===1) rightHarvis[0].label="harvi";
  }

  const allHarvis = [...(leftHarvi&&!use1phHarvi?[leftHarvi]:[]), ...rightHarvis];

  // Ensure ctrlTopY is below all right-harvi bottoms
  if (rightHarvis.length > 0) {
    const maxRHBot = Math.max(...rightHarvis.map(h=>h.bottomY));
    if (maxRHBot + 20 > ctrlTopY) ctrlTopY = maxRHBot + 20;
  }

  // Finalise 1ph harvi position (left of zappi) now we know ctrlTopY
  if (use1phHarvi) {
    leftHarvi.x = ctrlX - harviW - 16;
    leftHarvi.topY = harviTopY;
    leftHarvi.cx = ctrlX - harviW - 16 + harviW/2;
    leftHarvi.bottomY = harviTopY + harviH;
  }

  // ── CT landing zones ──────────────────────────────────────
  const gridLandXs  = nSitePh===3 ? [ctrlCX-18,ctrlCX-10,ctrlCX-2] : nSitePh===2 ? [ctrlCX-13,ctrlCX-5] : [ctrlCX-8];
  const solarLandXs = nSitePh===3 ? [ctrlCX+2, ctrlCX+10,ctrlCX+18] : nSitePh===2 ? [ctrlCX+5,ctrlCX+13] : [ctrlCX+8];

  const gridDestXs = gridToHarvi && leftHarvi ? [leftHarvi.cx] : gridLandXs;
  const gridDestY  = gridToHarvi && leftHarvi ? leftHarvi.topY : ctrlTopY;

  const solarDestFor = (i) => {
    if (!solarToHarvi) return { xs:solarLandXs, y:ctrlTopY };
    if (use1phHarvi)   return { xs:[leftHarvi.cx], y:leftHarvi.topY };
    const h = rightHarvis[Math.min(i, rightHarvis.length-1)];
    return h ? { xs:[h.cx], y:h.topY } : { xs:solarLandXs, y:ctrlTopY };
  };

  // Wireless landing on controller
  const harviLandXs = use1phHarvi
    ? gridLandXs.concat(solarLandXs)
    : (leftHarvi ? gridLandXs : solarLandXs);

  // ── Secondary device positions ────────────────────────────
  const nSec = pr.length-1;
  const zappiH = devHOf("zappi");
  const secXStep = 24; // horizontal stagger per secondary device
  const devPositions = devList.reduce((acc, name, i) => {
    if (i === 0) return [{ name, isCtrl:true, x:ctrlX, cx:ctrlCX, y:ctrlTopY }];
    const prev = acc[i-1];
    const cx = ctrlCX + i * secXStep;
    return [...acc, { name, isCtrl:false, x:cx-devWOf(name)/2, cx, y:prev.y + devHOf(prev.name) + devGap }];
  }, []);

  // ── Helpers ───────────────────────────────────────────────
  const gridCtX = Math.round(meterX+meterW+(boardX-meterX-meterW)*0.75);

  const SiteWire = ({x1,y1,x2,y2,color=WHITE}) => <>{siteOs.map((o,i)=>(
    <line key={i} x1={x1} y1={y1+o} x2={x2} y2={y2+o} stroke={color} strokeWidth={isMultiPh?2.5:3}/>
  ))}</>;
  const InvWire = ({x1,y1,x2,y2,v}) => <>{iOs(v).map((o,i)=>(
    <line key={i} x1={x1} y1={y1+o} x2={x2} y2={y2+o} stroke={WHITE} strokeWidth={iIs3(v)?2.5:3}/>
  ))}</>;
  const SiteCTs = ({x,y,label}) => <>{siteOs.map((o,i)=>(
    <CT key={i} x={x+siteXOs[i]} y={y+o} label={i===0?label:""}/>
  ))}</>;
  const PhCTs = ({x,y,v,label}) => <>{iOs(v).map((o,i)=>(
    <CT key={i} x={x+iXOs(v)[i]} y={y+o} label={i===0?label:""}/>
  ))}</>;
  const SigSet = ({ctX,ctY,osArr,xsArr,dxs,dy}) => <>{osArr.map((o,i)=>{
    const dx=Array.isArray(dxs)?dxs[Math.min(i,dxs.length-1)]:dxs;
    return <Curve key={i} x1={ctX+xsArr[i]} y1={ctY+o+8} x2={dx} y2={dy} dashed={true} sw={1.3}/>;
  })}</>;

  const bottomAll = Math.max(...devPositions.map(d=>d.y+devHOf(d.name)));
  const VH = bottomAll+60; // extra padding so secondary devices are never clipped

  return (
    <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{background:DARK,borderRadius:8,display:"block"}}>

      {/* GRID */}
      <image href={gridImgUrl} x={pylonX-50} y={busY-90} width={100} height={90} preserveAspectRatio="xMidYMid meet"/>
      <text x={pylonX} y={busY+20} textAnchor="middle" fill={WHITE} fontSize={8} fontFamily="Overpass,sans-serif" fontWeight="700">GRID</text>

      {/* Pylon → Meter */}
      <SiteWire x1={pylonX+50} y1={busY} x2={meterX} y2={busY}/>
      <Blk x={meterX} y={busY-meterH/2} w={meterW} h={meterH} label="METER" bc={WHITE} lc={WHITE}/>

      {/* Meter → Grid CT → Board */}
      <SiteWire x1={meterX+meterW} y1={busY} x2={gridCtX-7} y2={busY}/>
      <SiteCTs x={gridCtX} y={busY} label={is3ph?"Grid CT×3":is2ph?"Grid CT×2":"Grid CT1"}/>
      <SigSet ctX={gridCtX} ctY={busY} osArr={siteOs} xsArr={siteXOs} dxs={gridDestXs} dy={gridDestY}/>
      <SiteWire x1={gridCtX+7} y1={busY} x2={boardX} y2={busY}/>

      {/* Main Switchboard */}
      <text x={boardCX} y={busY-boardH/2-10} textAnchor="middle" fill={WHITE} fontSize={8} fontWeight="700" fontFamily="Overpass,sans-serif">MAIN SWITCHBOARD</text>
      <image href={mainSbImgUrl} x={boardX} y={busY-boardH/2} width={boardW} height={boardH} preserveAspectRatio="none"/>

      {/* Horizontal bus from switchboard extending to rightmost device, then a vertical drop to each device */}
      {devPositions.length > 1 && (
        <line x1={devPositions[0].cx} y1={busY+boardH/2} x2={devPositions[devPositions.length-1].cx} y2={busY+boardH/2} stroke={WHITE} strokeWidth={3}/>
      )}
      {devPositions.map((d,i) => (
        <line key={`drop-${i}`} x1={d.cx} y1={busY+boardH/2} x2={d.cx} y2={d.y} stroke={WHITE} strokeWidth={3}/>
      ))}

      {/* 1ph harvi — left of zappi */}
      {use1phHarvi && leftHarvi && (
        <>
          <image href={harviImgUrl} x={leftHarvi.x} y={leftHarvi.topY} width={harviW} height={harviH} preserveAspectRatio="xMidYMid meet"/>
          {/* WiFi centred on harvi bottom, 2px clear below box, waves pointing down toward zappi */}
          <WiFi cx={leftHarvi.cx} cy={leftHarvi.bottomY + 12} rotate={180} color={WHITE}/>
        </>
      )}

      {/* 3ph/multi harvis */}
      {!use1phHarvi && allHarvis.map((h,hi)=>{
        return (
          <g key={hi}>
            <image href={harviImgUrl} x={h.x} y={h.topY} width={harviW} height={harviH} preserveAspectRatio="xMidYMid meet"/>
            {/* WiFi centred on harvi bottom, 2px clear below box, waves pointing down toward zappi */}
            <WiFi cx={h.cx} cy={h.bottomY + 12} rotate={180} color={WHITE}/>
          </g>
        );
      })}

      {/* myenergi devices — vertical stack on trunk */}
      {devPositions.map((d,i)=>(
        <g key={i}>
          {d.name === "zappi" ? (
            <>
              <defs>
                <clipPath id="zappi-clip">
                  <rect x={d.x-devW/2} y={d.y} width={devW*2} height={zappiH} rx={4}/>
                </clipPath>
              </defs>
              <image href={zappiImgUrl} x={d.x-devW/2} y={d.y} width={devW*2} height={zappiH}
                preserveAspectRatio="xMidYMid meet" clipPath="url(#zappi-clip)"/>
            </>
          ) : (
            <>
              <image href={DEVICE_IMGS[d.name]} x={d.cx-devWOf(d.name)/2} y={d.y} width={devWOf(d.name)} height={devHOf(d.name)} preserveAspectRatio="xMidYMid meet"/>
              <text x={d.cx+devWOf(d.name)/2+(d.isCtrl?30:10)} y={d.y+devHOf(d.name)/2} dominantBaseline="middle" textAnchor={d.isCtrl?"middle":"start"} fill={d.isCtrl?G_TXT:"#111111"} fontSize={7} fontWeight="700" fontFamily="Overpass,sans-serif">{d.isCtrl?"controller":"secondary"}</text>
            </>
          )}
          {/* WiFi between adjacent devices: points down (away from master/prev device toward slave) */}
          {!d.isCtrl && (
            <WiFi cx={Math.round((devPositions[i-1].cx+d.cx)/2)} cy={Math.round((devPositions[i-1].y+devHOf(devPositions[i-1].name)+d.y)/2)} rotate={180} color={WHITE} size={10}/>
          )}
        </g>
      ))}

      {/* AC Battery — rendered independently of solar so it appears even with no inverter */}
      {hasACBat && (
        <>
          {libbiIsBat_ac
            ? <image href={libbiImgUrl} x={acBatCX-libbiImgW/2} y={acBatTopY} width={libbiImgW} height={libbiImgH} preserveAspectRatio="xMidYMid meet"/>
            : <BatIcon x={acBatCX-acBatW/2} y={acBatTopY} w={acBatW} h={acBatH} label={trunc(ab[0]?.label, 11) || "BATTERY"}/>
          }
          {/* Battery → horizontal to boardCX → down to switchboard top */}
          <line x1={acBatCX-acBatW/2} y1={acBatLineY} x2={boardCX} y2={acBatLineY} stroke={WHITE} strokeWidth={2.5}/>
          <line x1={boardCX} y1={acBatLineY} x2={boardCX} y2={busY-boardH/2} stroke={WHITE} strokeWidth={2.5}/>
          {ab[0]?.mb && (
            <>
              <CT x={acBatCtX} y={acBatLineY} label="Bat CT3"/>
              <Curve x1={acBatCtX+5} y1={acBatLineY+8} x2={use1phHarvi?leftHarvi?.cx:solarLandXs[solarLandXs.length-1]} y2={use1phHarvi?leftHarvi?.topY:ctrlTopY} dashed={true} sw={1.3}/>
            </>
          )}
        </>
      )}

      {/* Solar branch */}
      {hasSolar && (
        <>
          {/* Bus: board right → solarTapX */}
          <SiteWire x1={boardX+boardW} y1={busY} x2={solarTapX} y2={busY}/>
          {multiInv && <line x1={solarTapX} y1={busY} x2={solarTapX} y2={invCYs[inv.length-1]} stroke={WHITE} strokeWidth={2.5}/>}

          {inv.map((v,i)=>{
            const cy=invCYs[i];
            const ctX=invX-28;
            const lbl=v.dc?(iIs3(v)?"Gen+Bat CT×3":"Gen+Bat CT3"):(iIs3(v)?"Solar CT×3":(multiInv?`Solar CT${i+1}`:"Solar CT2"));
            const sd=solarDestFor(i);
            const isDcLibbi = libbiIsBat_dc && v.dc && v.db;
            const invLeftX  = isDcLibbi ? invCX - libbiDcW/2 : invX;
            const invRightX = isDcLibbi ? invCX + libbiDcW/2 : invX+invW;
            return (
              <g key={i}>
                <InvWire x1={solarTapX} y1={cy} x2={ctX-6} y2={cy} v={v}/>
                {v.ms && (
                  <>
                    <PhCTs x={ctX} y={cy} v={v} label={lbl}/>
                    <SigSet ctX={ctX} ctY={cy} osArr={iOs(v)} xsArr={iXOs(v)} dxs={sd.xs} dy={sd.y}/>
                    <InvWire x1={ctX+6} y1={cy} x2={invLeftX} y2={cy} v={v}/>
                  </>
                )}
                {!v.ms && <InvWire x1={ctX} y1={cy} x2={invLeftX} y2={cy} v={v}/>}
                {isDcLibbi ? (
                  <image href={libbiImgUrl} x={invCX-libbiDcW/2} y={cy-libbiDcH/2} width={libbiDcW} height={libbiDcH} preserveAspectRatio="xMidYMid meet"/>
                ) : (
                  <>
                    {(() => {
                      const invLabel = trunc(v.label, 16) || (v.dc ? "HYBRID INV" : "INVERTER");
                      const invLabelFs = invLabel.length > 11 ? 7 : 8.5;
                      const batSub = v.dc ? (trunc(v.batLabel, 17) || "+ BATTERY") : undefined;
                      return <Blk x={invX} y={cy-invH/2} w={invW} h={invH} label={invLabel} labelFs={invLabelFs} sub={batSub} bc="#777" lc={WHITE}/>;
                    })()}
                    {v.dc&&v.db && (
                      <>
                        <line x1={invCX} y1={cy+invH/2} x2={invCX} y2={cy+invH/2+22} stroke={WHITE} strokeWidth={2.5}/>
                        <BatIcon x={invCX-dcBatW/2} y={cy+invH/2+22} w={dcBatW} h={dcBatH} label={trunc(v.batLabel, 11) || "BATTERY"}/>
                      </>
                    )}
                  </>
                )}
                <line x1={invRightX} y1={cy} x2={pvX} y2={cy} stroke={WHITE} strokeWidth={2.5}/>
                <g>
                  <rect x={pvX} y={cy-pvH/2} width={pvW} height={pvH} rx={3} fill="#e8ede8" stroke="#666" strokeWidth={1.5}/>
                  {[0,1,2].map(c=>[0,1].map(r=>(
                    <rect key={`${c}${r}`} x={pvX+4+c*18} y={cy-pvH/2+5+r*15} width={13} height={11} rx={1} fill="none" stroke="#ccc" strokeWidth={1}/>
                  )))}
                  <text x={pvX+pvW/2} y={cy+pvH/2+13} textAnchor="middle" fill={WHITE} fontSize={8} fontWeight="700" fontFamily="Overpass,sans-serif">
                    {multiInv?`PV ARRAY ${i+1}`:"PV ARRAY"}
                  </text>
                </g>
              </g>
            );
          })}
        </>
      )}

    </svg>
  );
}

export default function App() {
  const [key, setKey] = useState("1ph · DC hybrid");
  return (
    <div style={{background:"#f0f0f0",minHeight:"100vh",fontFamily:"'Overpass',sans-serif",color:"#111",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Overpass:ital,wght@0,300;0,700;1,800&display=swap" rel="stylesheet"/>
      <div style={{marginBottom:14,display:"flex",gap:6,flexWrap:"wrap"}}>
        {Object.keys(CONFIGS).map(k=>(
          <button key={k} onClick={()=>setKey(k)} style={{background:k===key?G:"#1a1a1a",color:k===key?"#000":"#aaa",border:`1px solid ${k===key?G:"#333"}`,borderRadius:999,padding:"5px 12px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>{k}</button>
        ))}
      </div>
      <Diagram config={CONFIGS[key]}/>
    </div>
  );
}
