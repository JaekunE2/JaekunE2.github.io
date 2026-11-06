"""Builds index.html (EN) and ko/index.html (KO) from one template.  python tools/build.py"""
import os, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

C = {
 "en": dict(
  lang="en", pre="", other="ko/", title="printdoctor · Free STL repair for 3D printing",
  desc="Check an STL, OBJ, GLB or 3MF in your browser for holes, non-manifold edges and loose shells, then repair it into a watertight, printable solid. Free, no sign-up.",
  nav=["Tool", "How it works", "FAQ"], langs=("EN", "한국어"),
  h1="Repair STL files for 3D printing", sub="Drop a model for a free check in your browser, then fix it in one click. "
     "The outside stays, the errors go: holes, non-manifold edges, flipped faces, loose pieces and parts too thin to print.",
  pills=["Free beta", "No sign-up", "Files deleted after 24 h"],
  req="Request (optional), e.g. remove the thin railings, keep the sign lettering", scale="Scale",
  consent='I agree to the <a href="{pre}privacy.html">privacy policy</a> and <a href="{pre}terms.html">terms</a>. Upload only models you may share.',
  send="Repair", defects="Defects", geometry="Geometry", checknote="Checked in your browser. The file is uploaded only when you press Repair.",
  ex_h="Example: a broken model, before and after", ex_p="Drag the handle. Same camera, frame by frame. Red: open and non-manifold edges; orange: parts too thin to print.",
  steps_h="How it works", steps=[("Drop your file", "STL, OBJ, PLY, GLB, 3MF or OFF. The check runs in your browser first: holes, non-manifold edges, flipped faces, shells, size."),
                                 ("Repair", "The server rebuilds the model as one closed solid that keeps the outside, removes parts thinner than a nozzle and verifies the result. Write a request to have the agent follow it."),
                                 ("Check and download", "Turn the before and after side by side in 3D, then download the printable STL.")],
  err_h="What breaks a print, and what we do about it", err_sub="Each of these makes a slicer drop walls, fill the wrong side or skip layers.",
  errs=[("Open edges (holes)", "An edge used by only one face: the surface is not closed.", "The slicer cannot tell inside from outside, so walls and floors go missing.", "The model is rebuilt as a closed solid; the holes are filled from the surrounding surface."),
        ("Non-manifold edges", "An edge shared by three or more faces, typical of unwelded CAD and architectural exports.", "Cross-sections become ambiguous and layers come out partly empty.", "Overlapping and touching pieces are merged into one solid with a single clean surface."),
        ("Flipped faces", "Neighbouring faces wound in opposite directions.", "Parts of the model are treated as inside-out.", "The rebuilt surface is oriented consistently, outward."),
        ("Zero-area faces", "Triangles collapsed to a line or point.", "Slicer warnings, tiny gaps, failed booleans.", "Removed in the rebuild."),
        ("Loose shells", "Hundreds of separate pieces: window frames, panels, labels.", "Floating specks print as strings or fall off; overlaps double the walls.", "Pieces are joined into one body; specks smaller than a nozzle are dropped."),
        ("Parts thinner than the nozzle", "Free-standing rails, rods and antennas under about 0.45 mm.", "They print as broken strands or not at all.", "They are detected and removed, while relief lying on a surface (lettering, patterns) is kept.")],
  why_h="Why printdoctor", why=[("Keeps the outside", "Every result is measured against your original: median and 95th-percentile deviation are in the log."),
      ("Built for messy exports", "SketchUp, Revit and game or AI-generated meshes with thousands of loose, unwelded pieces."),
      ("Knows what is too thin", "Separates rails that cannot print from lettering and relief that can."),
      ("Checked like a slicer would", "Open and non-manifold edges must be 0 before a result is called printable.")],
  cmp_h="Compared with the usual routes", cmp_cols=["", "Manual fix (Blender, Meshmixer)", "One-click hole fillers", "printdoctor"],
  cmp=[("Time", "30 min to hours", "Seconds", "About a minute"), ("Skill needed", "Mesh modelling", "None", "None"),
       ("Thousands of loose pieces", "Tedious", "Often keeps only the largest piece", "Merged into one solid"),
       ("Thin parts", "By eye", "Ignored", "Detected and removed"), ("Deviation from original", "Unmeasured", "Unmeasured", "Reported"),
       ("Cost", "Your time", "Free to paid", "Free (beta)")],
  use_h="Good for", uses=[("Architectural models", "SketchUp and Revit exports for scale models."), ("AI-generated and game meshes", "Open, self-intersecting, many-shell meshes."),
                          ("3D scans", "Holes and noise from photogrammetry and scanners."), ("Downloaded files", "Models that slice with errors or missing layers.")],
  faq_h="FAQ", faq=[("How do I repair an STL online?", "Drop the file into the tool above. The free check shows what is wrong; press Repair and download the result a minute later."),
     ("Which formats can I upload?", "STL, OBJ, PLY, GLB/GLTF, 3MF and OFF, up to 50 MB. The result is an STL."),
     ("Does it change the shape?", "It rebuilds the surface at about 0.2 mm resolution for models up to 25 cm, so detail finer than that softens. The deviation from your original is measured and shown."),
     ("What does the request box do?", "With a request, an agent decides the repair steps, for example removing railings but keeping lettering. Agent jobs have a daily limit; without a request the automatic pipeline runs."),
     ("Is it free? Can I use the result commercially?", "Yes, the beta is free (supported by ads), and you keep all rights to your models and the results."),
     ("Who can see my file?", "Only the server that processes it. Files and results are deleted automatically after 24 hours; see the privacy policy."),
     ("My model is in centimetres or inches", "Set the scale: 10 for centimetres to millimetres, 25.4 for inches.")],
  cta_h="Ready to print?", cta_b="Repair a model", footer=["Privacy", "Terms", "Contact"]),
 "ko": dict(
  lang="ko", pre="../", other="../", title="printdoctor · 무료 STL 수리, 3D 프린팅 오류 고치기",
  desc="STL·OBJ·GLB·3MF 모델의 구멍, 논매니폴드 엣지, 흩어진 조각을 브라우저에서 무료로 점검하고, 출력 가능한 닫힌 솔리드로 고칩니다. 가입 없이 무료.",
  nav=["도구", "작동 방식", "FAQ"], langs=("EN", "한국어"),
  h1="3D 프린팅용 STL 수리", sub="모델을 놓으면 브라우저에서 바로 무료로 점검하고, 한 번 눌러 고칩니다. "
     "겉모양은 그대로 두고 오류만 없앱니다. 구멍, 논매니폴드 엣지, 뒤집힌 면, 흩어진 조각, 노즐보다 얇은 부재까지 처리합니다.",
  pills=["무료 베타", "가입 없음", "24시간 뒤 파일 삭제"],
  req="요청 (선택): 예) 얇은 난간은 지우고 간판 글자는 남겨줘", scale="배율",
  consent='<a href="{pre}privacy.html#ko">개인정보처리방침</a>과 <a href="{pre}terms.html#ko">이용약관</a>에 동의합니다. 공유 권한이 있는 모델만 올려 주세요.',
  send="고치기", defects="결함", geometry="형상", checknote="점검은 브라우저 안에서 합니다. 파일은 고치기를 누를 때만 올라갑니다.",
  ex_h="예시: 깨진 모델 수정 전과 후", ex_p="가운데 손잡이를 끌어 보세요. 같은 카메라, 같은 프레임입니다. 빨강은 열린·논매니폴드 엣지, 주황은 너무 얇아 출력되지 않는 부재입니다.",
  steps_h="작동 방식", steps=[("파일 놓기", "STL, OBJ, PLY, GLB, 3MF, OFF. 먼저 브라우저에서 구멍, 논매니폴드 엣지, 뒤집힌 면, 조각 수, 크기를 점검합니다."),
                             ("고치기", "서버가 겉모양을 유지한 닫힌 솔리드로 다시 만들고, 노즐보다 얇은 부재를 정리한 뒤 결과를 검증합니다. 요청 문장을 쓰면 에이전트가 그대로 따릅니다."),
                             ("확인하고 내려받기", "수정 전과 후를 나란히 3D로 돌려 보고, 출력 가능한 STL을 내려받습니다.")],
  err_h="출력을 망치는 오류와 처리 방법", err_sub="아래 오류가 있으면 슬라이서가 벽을 빠뜨리거나, 안팎을 바꿔 채우거나, 층을 건너뜁니다.",
  errs=[("열린 엣지(구멍)", "면 하나에만 붙은 엣지, 표면이 닫히지 않은 상태입니다.", "안과 밖을 구분하지 못해 벽과 바닥이 빠집니다.", "닫힌 솔리드로 다시 만들고 주변 면을 따라 구멍을 메웁니다."),
        ("논매니폴드 엣지", "면 셋 이상이 함께 쓰는 엣지. 용접되지 않은 CAD·건축 모델에서 흔합니다.", "단면이 모호해져 층의 일부가 비어 나옵니다.", "겹치거나 맞닿은 조각을 하나의 솔리드, 하나의 깨끗한 표면으로 합칩니다."),
        ("뒤집힌 면", "이웃한 면의 감김 방향이 서로 반대인 상태입니다.", "모델 일부가 뒤집힌 것으로 처리됩니다.", "다시 만든 표면은 모두 바깥쪽으로 일관되게 향합니다."),
        ("넓이 0인 면", "선이나 점으로 찌그러진 삼각형입니다.", "슬라이서 경고, 미세한 틈, 불리언 실패의 원인이 됩니다.", "재구성 과정에서 없어집니다."),
        ("흩어진 조각", "창틀, 패널, 글자처럼 따로 노는 수백 개의 조각입니다.", "떠 있는 조각은 실처럼 나오거나 떨어지고, 겹친 곳은 벽이 두 겹이 됩니다.", "조각을 한 몸으로 합치고, 노즐보다 작은 부스러기는 버립니다."),
        ("노즐보다 얇은 부재", "약 0.45 mm보다 가는 난간, 봉, 안테나입니다.", "끊어진 실처럼 나오거나 아예 나오지 않습니다.", "찾아서 지우되, 표면에 붙은 글자·무늬 같은 양각은 남깁니다.")],
  why_h="printdoctor가 다른 점", why=[("겉모양 유지", "결과를 원본과 비교해 편차(중앙값·95%)를 로그에 남깁니다."),
      ("지저분한 내보내기에 강함", "용접 안 된 조각 수천 개짜리 SketchUp·Revit 모델, 게임·AI 생성 메시를 처리합니다."),
      ("얇은 것을 구분", "출력이 안 되는 난간과 출력되는 글자·양각을 구분합니다."),
      ("슬라이서 기준으로 검증", "열린·논매니폴드 엣지가 0이어야 출력 가능이라고 표시합니다.")],
  cmp_h="다른 방법과 비교", cmp_cols=["", "직접 수리 (Blender, Meshmixer)", "원클릭 구멍 메우기", "printdoctor"],
  cmp=[("시간", "30분~몇 시간", "몇 초", "1분 안팎"), ("필요한 기술", "메시 모델링", "없음", "없음"),
       ("조각 수천 개", "손이 많이 감", "가장 큰 조각만 남기기 쉬움", "하나의 솔리드로 합침"),
       ("얇은 부재", "눈으로 판단", "무시", "찾아서 정리"), ("원본과의 편차", "측정 안 함", "측정 안 함", "수치로 보고"),
       ("비용", "작업 시간", "무료~유료", "무료 (베타)")],
  use_h="이럴 때 쓰세요", uses=[("건축 모형", "축소 모형용 SketchUp·Revit 내보내기"), ("AI 생성·게임 메시", "열리고, 서로 파고들고, 조각이 많은 메시"),
                             ("3D 스캔", "사진측량·스캐너에서 생긴 구멍과 잡음"), ("내려받은 모델", "슬라이스하면 오류가 나거나 층이 빠지는 파일")],
  faq_h="자주 묻는 질문", faq=[("STL을 온라인에서 어떻게 고치나요?", "위 도구에 파일을 놓으세요. 무료 점검으로 문제를 보여 주고, 고치기를 누르면 1분 안팎에 결과를 내려받을 수 있습니다."),
     ("어떤 형식을 올릴 수 있나요?", "STL, OBJ, PLY, GLB/GLTF, 3MF, OFF를 50 MB까지 받습니다. 결과는 STL입니다."),
     ("모양이 바뀌나요?", "25 cm 이하 모델은 약 0.2 mm 해상도로 표면을 다시 만들기 때문에 그보다 작은 디테일은 부드러워집니다. 원본과의 편차를 재서 보여 드립니다."),
     ("요청 칸은 무엇인가요?", "요청을 쓰면 에이전트가 수리 단계를 정합니다. 예를 들어 난간은 지우고 글자는 남깁니다. 에이전트 처리는 하루 한도가 있고, 요청이 없으면 자동 수리가 돌아갑니다."),
     ("무료인가요? 결과를 상업적으로 써도 되나요?", "베타는 광고로 운영되는 무료 서비스이고, 모델과 결과의 권리는 모두 이용자에게 있습니다."),
     ("내 파일은 누가 보나요?", "처리하는 서버만 봅니다. 파일과 결과는 24시간 뒤 자동 삭제됩니다. 자세한 내용은 개인정보처리방침을 보세요."),
     ("모델 단위가 cm나 인치예요", "배율을 넣으세요. cm는 10, 인치는 25.4를 넣으면 mm가 됩니다.")],
  cta_h="출력할 준비 되셨나요?", cta_b="모델 고치기", footer=["개인정보처리방침", "이용약관", "문의"]),
}

TPL = """<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="alternate" hreflang="en" href="https://jaekune2.github.io/"><link rel="alternate" hreflang="ko" href="https://jaekune2.github.io/ko/">
<link rel="stylesheet" href="{pre}assets/site.css">
</head>
<body>
<div class="topbar"><nav class="wrap">
  <a class="brand" href="./"><span class="logo"></span>printdoctor</a>
  <span class="links"><a href="#tool">{nav0}</a><a href="#how">{nav1}</a><a href="#faq">{nav2}</a></span>
  <span class="lang"><a href="{en_href}" {en_cur}>EN</a><a href="{ko_href}" {ko_cur}>한국어</a></span>
</nav></div>
<main class="wrap">
  <header class="hero">
    <h1>{h1}</h1>
    <p>{sub}</p>
    <div class="pills">{pills}</div>
  </header>

  <section id="tool" class="tool">
    <label id="pd-drop" class="drop"><input id="pd-file" type="file" hidden accept=".stl,.obj,.ply,.off,.glb,.gltf,.3mf">
      <span class="ico"></span><b></b><small></small></label>
    <div class="toolgrid">
      <div id="pd-view" class="view single" hidden><div class="pane"></div><div class="pane" hidden></div></div>
      <div id="pd-check" class="check" hidden>
        <span id="pd-badge" class="badge-state" hidden></span>
        <h3>{defects}</h3><ul class="def"></ul>
        <h3>{geometry}</h3><ul class="geo"></ul>
        <p class="note">{checknote}</p>
      </div>
    </div>
    <div class="row">
      <input id="pd-req" maxlength="500" placeholder="{req}">
      <label class="scale">{scale} <input id="pd-scale" type="number" value="1" step="any" min="0.001"></label>
    </div>
    <label class="consent"><input id="pd-consent" type="checkbox"> <span>{consent}</span></label>
    <div class="row act"><button id="pd-send" class="primary" type="button">{send}</button><span id="pd-status" class="status"></span></div>
    <pre id="pd-log" class="log"></pre>
    <div id="pd-files" class="files"></div>
    <p id="pd-info" class="note"></p>
  </section>
  <div class="ad" data-slot="top"></div>

  <section>
    <h2>{ex_h}</h2>
    <p class="note">{ex_p}</p>
    <div class="ba">
      <video class="before" src="{pre}media/before.mp4" muted loop playsinline preload="auto"></video>
      <video class="after" src="{pre}media/after.mp4" muted loop playsinline preload="auto"></video>
      <span class="tag" style="left:10px">BEFORE</span><span class="tag" style="right:10px">AFTER</span>
      <div class="bar"></div>
    </div>
  </section>

  <section id="how">
    <h2>{steps_h}</h2>
    <div class="cards three">{steps}</div>
  </section>

  <section>
    <h2>{err_h}</h2>
    <p class="note">{err_sub}</p>
    <div class="cards errs">{errs}</div>
  </section>

  <div class="ad" data-slot="middle"></div>

  <section>
    <h2>{why_h}</h2>
    <div class="cards four">{why}</div>
  </section>

  <section>
    <h2>{cmp_h}</h2>
    <div class="tbl"><table>{cmp}</table></div>
  </section>

  <section>
    <h2>{use_h}</h2>
    <div class="cards four">{uses}</div>
  </section>

  <section id="faq">
    <h2>{faq_h}</h2>
    {faq}
  </section>

  <section class="cta"><h2>{cta_h}</h2><a class="btn primary-btn" href="#tool">{cta_b}</a></section>
  <div class="ad" data-slot="bottom"></div>
  <footer>printdoctor · <a href="{pre}privacy.html{hash}">{f0}</a> · <a href="{pre}terms.html{hash}">{f1}</a> ·
    <a href="https://github.com/JaekunE2/JaekunE2.github.io/issues">{f2}</a></footer>
</main>
<script src="{pre}assets/site.js"></script>
<script src="{pre}assets/config.js"></script>
<script type="importmap">{{"imports": {{"three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}}}</script>
<script type="module" src="{pre}assets/app.js"></script>
<script src="{pre}assets/ads.js"></script>
</body>
</html>
"""

e = html.escape
for k, c in C.items():
    ko = k == "ko"
    steps = "".join(f'<div class="card"><span class="num">{i + 1}</span><h3>{e(t)}</h3><p>{e(d)}</p></div>' for i, (t, d) in enumerate(c["steps"]))
    lab = ("무엇", "슬라이서에서", "printdoctor는") if ko else ("What", "In the slicer", "printdoctor")
    errs = "".join(f'<div class="card"><span class="num">{i + 1:02d}</span><h3>{e(t)}</h3><dl><dt>{lab[0]}</dt><dd>{e(a)}</dd>'
                   f'<dt>{lab[1]}</dt><dd>{e(b)}</dd><dt>{lab[2]}</dt><dd>{e(x)}</dd></dl></div>' for i, (t, a, b, x) in enumerate(c["errs"]))
    why = "".join(f'<div class="card"><h3>{e(t)}</h3><p>{e(d)}</p></div>' for t, d in c["why"])
    uses = "".join(f'<div class="card"><h3>{e(t)}</h3><p>{e(d)}</p></div>' for t, d in c["uses"])
    cmp = "<tr>" + "".join(f"<th>{e(x)}</th>" for x in c["cmp_cols"]) + "</tr>" + "".join(
        "<tr>" + "".join(f'<td class="{"good" if j == 3 else ""}">{e(x)}</td>' for j, x in enumerate(r)) + "</tr>" for r in c["cmp"])
    faq = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in c["faq"])
    out = TPL.format(lang=c["lang"], pre=c["pre"], title=e(c["title"]), desc=e(c["desc"]), nav0=c["nav"][0], nav1=c["nav"][1], nav2=c["nav"][2],
                     en_href="../" if ko else "./", ko_href="./" if ko else "ko/", en_cur="" if ko else 'aria-current="page"',
                     ko_cur='aria-current="page"' if ko else "", h1=e(c["h1"]), sub=e(c["sub"]),
                     pills="".join(f'<span class="pill">{e(p)}</span>' for p in c["pills"]), defects=c["defects"], geometry=c["geometry"],
                     checknote=e(c["checknote"]), req=e(c["req"]), scale=c["scale"], consent=c["consent"].format(pre=c["pre"]), send=c["send"],
                     ex_h=e(c["ex_h"]), ex_p=e(c["ex_p"]), steps_h=c["steps_h"], steps=steps, err_h=e(c["err_h"]), err_sub=e(c["err_sub"]),
                     errs=errs, why_h=e(c["why_h"]), why=why, cmp_h=e(c["cmp_h"]), cmp=cmp, use_h=e(c["use_h"]), uses=uses,
                     faq_h=e(c["faq_h"]), faq=faq, cta_h=e(c["cta_h"]), cta_b=e(c["cta_b"]), hash="#ko" if ko else "",
                     f0=c["footer"][0], f1=c["footer"][1], f2=c["footer"][2])
    p = os.path.join(ROOT, "ko", "index.html") if ko else os.path.join(ROOT, "index.html")
    open(p, "w", encoding="utf-8").write(out)
    print("wrote", p)
