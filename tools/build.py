"""Builds index.html (EN) and ko/index.html (KO) from one template + samples/samples.json.
python tools/build.py"""
import os, json, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAMPLES = json.load(open(os.path.join(ROOT, "samples", "samples.json"), encoding="utf-8"))
e = html.escape

C = {
 "en": dict(
  lang="en", pre="", title="printdoctor · SketchUp to 3D print for architectural models",
  desc="Upload a SketchUp .skp (or STL/OBJ/3MF) of a building and get a watertight, printable scale model: open faces, "
       "non-manifold edges, overlapping groups and parts too thin at your scale are fixed automatically. Free beta.",
  nav=[("#tool", "Convert"), ("#samples", "Samples"), ("#how", "How it works"), ("#scale", "Scale guide"), ("#faq", "FAQ")],
  eyebrow="SketchUp → 3D print", h1a="Turn SketchUp buildings into", h1b="print-ready scale models",
  sub="Drop a .skp straight from SketchUp. We convert it in a sandbox, find what will break the print at your scale "
      "and rebuild it as one closed solid that keeps the facade. Free, no sign-up.",
  flow=["SKP", "Sandboxed conversion", "Diagnosis at scale", "Solid rebuild", "STL"],
  pills=["Free beta", "No sign-up", ".skp · STL · OBJ · 3MF · GLB", "Files deleted after 24 h"],
  drop_b="Drop a .skp or STL here, or click to choose", drop_s="SketchUp 2017 or newer · STL · OBJ · PLY · GLB · 3MF · up to 50 MB",
  try_h="No file at hand? Try an open sample:",
  scale_l="Print scale", scale_custom="Custom 1:", scale_real="As is",
  req="Request for the agent (optional), e.g. remove the railings, keep the sign lettering",
  consent='I agree to the <a href="{pre}privacy.html">privacy policy</a> and <a href="{pre}terms.html">terms</a>. Upload only models you may share.',
  send="Convert & repair", defects="Defects", geometry="At print scale", checknote="Checked in your browser. The file is uploaded only when you press the button.",
  stats_h="Measured on open SketchUp models", stat_labels=("open SKP models", "edge errors before", "after", "median deviation"),
  samples_h="Real SketchUp models, before and after", samples_p="Open-licensed (MIT) .skp files from public SketchUp tool repositories, "
     "run through the same pipeline as your uploads. Red: open and non-manifold edges. Toggle or hover to compare.",
  s_before="Before", s_after="After", s_try="Try this sample", s_skp=".skp", s_src="Source", s_real="Real", s_print="Print",
  s_open="open edges", s_nonman="non-manifold", s_shells="pieces", s_thin="too-thin parts removed", s_dev="deviation median / 95%", s_time="processing",
  how_h="How it works", how_p="Everything a SketchUp file needs before a slicer can read it, in one pass.",
  steps=[("Upload the .skp", "Or export STL/OBJ yourself. The SketchUp file is opened by the official SketchUp SDK in an isolated, low-privilege process; hidden tags and hidden objects are skipped."),
         ("Diagnose at your print scale", "Open faces, edges shared by three or more faces, flipped faces, overlapping groups, loose pieces, and parts that become thinner than a nozzle at 1:N."),
         ("Rebuild one closed solid", "The model is rebuilt as a single watertight solid that keeps the outer surface. Free-standing parts too thin to print are removed; relief on walls is kept."),
         ("Verify and download", "The result must have 0 open and 0 non-manifold edges. Its deviation from your model is measured; you get an STL to slice.")],
  err_h="Why SketchUp models fail to print", err_p="SketchUp is a surface modeller: what looks solid on screen is often a set of separate faces. These are the usual reasons a slicer rejects a building.",
  errs=[("Single faces as walls", "A wall drawn as one face has no thickness. Slicers see a hole, not a wall.", "Walls are rebuilt with material on the inside of the facade."),
        ("Groups that only touch", "Each group or component is its own shell. Where they meet, edges are shared by 3+ faces: non-manifold.", "Touching and overlapping groups are merged into one body."),
        ("Overlapping and intersecting geometry", "Floors pushed through walls, roofs through gables. Double walls and inner faces confuse slicers.", "Inner faces disappear; only the outer skin is kept."),
        ("Too thin at the chosen scale", "A 50 mm railing is 0.25 mm at 1:200. It cannot print, but it keeps the model from being one solid.", "Free-standing thin parts are removed and listed; nothing on a wall surface is touched."),
        ("Reversed faces", "The grey back side facing out. Some slicers fill the wrong side.", "The rebuilt surface is oriented outward everywhere."),
        ("Wrong units or stray geometry", "Models drawn in the wrong unit, tiny leftover edges, 2D people and trees.", "Scale presets, size preview at print scale, specks smaller than a nozzle dropped.")],
  scale_h="Scale guide: what survives at 1:N", scale_p="An FDM nozzle prints walls of about 0.8 mm and free-standing details of about 0.45 mm. "
     "This table shows the real thickness that becomes that small at each scale.",
  scale_cols=["Scale", "Smallest wall (0.8 mm printed)", "Smallest free detail (0.45 mm)", "A 10 m façade becomes"],
  calc_h="Check one element", calc_real="Real thickness (mm)", calc_scale="Scale 1:", calc_out="Printed",
  calc_ok="prints", calc_thin="thinner than a nozzle: removed if free-standing", calc_wall="prints as a thin wall; 0.8 mm+ is safer",
  cmp_h="Compared with the usual routes", cmp_cols=["", "Fix by hand in SketchUp", "Generic STL repair sites", "printdoctor"],
  cmp=[("Opens .skp directly", "Yes", "No (export first)", "Yes"), ("Groups and components", "Explode, intersect, clean up by hand", "Often keeps only the largest piece", "Merged into one solid"),
       ("Thin parts at scale", "Judged by eye", "Ignored", "Detected for your 1:N and removed"), ("Deviation from original", "Unmeasured", "Unmeasured", "Measured and reported"),
       ("Time for a building", "Hours", "Minutes, often fails", "1 to 4 minutes"), ("Cost", "Your time", "Free to paid", "Free (beta)")],
  use_h="Made for", uses=[("Design offices", "Massing and presentation models straight from the working SketchUp file."),
       ("Competitions and studios", "Physical models for juries and crits without a cleanup day."),
       ("Students", "Thesis and studio models when the deadline does not leave time for mesh repair."),
       ("Developers and sales", "Site and block models for briefings, printed in-house.")],
  faq_h="FAQ", faq=[("Which SketchUp versions are supported?", "Files saved by SketchUp 2017 or newer open directly. If a file is rejected, save it again from a recent SketchUp, or export STL (File > Export > 3D Model)."),
     ("What happens to hidden tags, layers and objects?", "Hidden objects and objects on hidden tags are skipped, exactly as in the SketchUp view. Hide people, trees and furniture before uploading if you do not want them printed."),
     ("Which scale should I choose?", "Pick the 1:N you will print at. The model is shrunk first, then checked, so anything that is too thin at that scale is found. The tool shows the print size before you upload."),
     ("Is the .skp file safe on your side?", "SketchUp files are opened on our processing PC in an isolated low-integrity process with no access to other files, a memory cap and a time limit. All files are deleted after 24 hours."),
     ("Does the shape change?", "The surface is rebuilt at about 0.2 mm, so detail finer than that softens. The median and 95th-percentile deviation from your model are reported for every job."),
     ("What does the request box do?", "With a sentence, an agent plans the repair, for example removing railings but keeping lettering. Agent jobs have a daily limit; without a request the automatic pipeline runs."),
     ("Is it free? Can I use the results commercially?", "Yes. The beta is free and supported by ads, and you keep all rights to your models and to the results."),
     ("Is the source code available?", "Not yet. The processing code and our own example models will be published later; for now the service is used through this page.")],
  cta_h="Your building, on the print bed today", cta_b="Convert a SketchUp file",
  credits="Sample models: MIT-licensed test files from SketchUp/testup-2 (Trimble Inc.), thomthom/solid-inspector, Eneroth3/eneroth-solid-tools and iamahsanmehmood/openskp.",
  footer=["Privacy", "Terms", "GitHub", "Contact"]),
 "ko": dict(
  lang="ko", pre="../", title="printdoctor · SketchUp 건축 모델을 3D 프린트 파일로",
  desc="SketchUp .skp(또는 STL·OBJ·3MF) 건물 모델을 올리면 열린 면, 논매니폴드 엣지, 겹친 그룹, 축척에서 너무 얇아지는 부재를 자동으로 고쳐 바로 출력되는 축소 모형 STL로 만들어 드립니다. 무료 베타.",
  nav=[("#tool", "변환하기"), ("#samples", "샘플"), ("#how", "작동 방식"), ("#scale", "축척 가이드"), ("#faq", "FAQ")],
  eyebrow="SketchUp → 3D 프린트", h1a="SketchUp 건축 모델을", h1b="바로 출력되는 축소 모형으로",
  sub="SketchUp에서 저장한 .skp를 그대로 올리세요. 격리된 환경에서 변환하고, 고른 축척에서 출력을 망칠 문제를 찾아 "
      "입면은 그대로 둔 채 하나의 닫힌 솔리드로 다시 만듭니다. 가입 없이 무료.",
  flow=["SKP", "격리 변환", "축척 기준 진단", "솔리드 재구성", "STL"],
  pills=["무료 베타", "가입 없음", ".skp · STL · OBJ · 3MF · GLB", "24시간 뒤 파일 삭제"],
  drop_b=".skp나 STL을 여기로 끌어 놓거나 눌러서 고르세요", drop_s="SketchUp 2017 이후 · STL · OBJ · PLY · GLB · 3MF · 최대 50 MB",
  try_h="파일이 없다면 공개 샘플로 해 보세요:",
  scale_l="출력 축척", scale_custom="직접 1:", scale_real="그대로",
  req="에이전트에게 요청 (선택): 예) 난간은 지우고 간판 글자는 남겨줘",
  consent='<a href="{pre}privacy.html#ko">개인정보처리방침</a>과 <a href="{pre}terms.html#ko">이용약관</a>에 동의합니다. 공유 권한이 있는 모델만 올려 주세요.',
  send="변환하고 고치기", defects="결함", geometry="출력 크기 기준", checknote="점검은 브라우저 안에서 합니다. 파일은 버튼을 누를 때만 올라갑니다.",
  stats_h="공개 SketchUp 모델로 잰 결과", stat_labels=("공개 SKP 모델", "수정 전 엣지 오류", "수정 후", "원본과 편차(중앙값)"),
  samples_h="실제 SketchUp 모델, 수정 전과 후", samples_p="SketchUp 도구 공개 저장소에 MIT 라이선스로 올라온 .skp 파일을 업로드와 똑같은 과정으로 처리했습니다. "
     "빨간 선은 열린·논매니폴드 엣지입니다. 버튼을 누르거나 마우스를 올려 비교해 보세요.",
  s_before="수정 전", s_after="수정 후", s_try="이 샘플로 해보기", s_skp=".skp", s_src="출처", s_real="실제", s_print="출력",
  s_open="열린 엣지", s_nonman="논매니폴드", s_shells="조각", s_thin="얇은 부재 제거", s_dev="편차 중앙값 / 95%", s_time="처리 시간",
  how_h="작동 방식", how_p="SketchUp 파일이 슬라이서에 들어가기 전에 필요한 일을 한 번에 처리합니다.",
  steps=[(".skp 올리기", "직접 STL·OBJ로 내보내 올려도 됩니다. SketchUp 파일은 공식 SketchUp SDK로, 다른 파일에 접근할 수 없는 저권한 격리 프로세스에서 엽니다. 숨긴 태그와 숨긴 객체는 빠집니다."),
         ("출력 축척 기준으로 진단", "열린 면, 면 셋 이상이 공유하는 엣지, 뒤집힌 면, 겹친 그룹, 흩어진 조각, 그리고 1:N으로 줄였을 때 노즐보다 얇아지는 부재를 찾습니다."),
         ("하나의 닫힌 솔리드로 재구성", "바깥 표면을 유지한 채 물이 새지 않는 하나의 솔리드로 다시 만듭니다. 출력이 안 되는 독립된 얇은 부재는 지우고, 벽에 붙은 양각은 남깁니다."),
         ("검증하고 내려받기", "열린 엣지와 논매니폴드 엣지가 모두 0이어야 통과입니다. 원본과의 편차를 재서 보여 주고, 슬라이서에 바로 넣을 STL을 드립니다.")],
  err_h="SketchUp 모델이 출력에서 깨지는 이유", err_p="SketchUp은 면으로 그리는 프로그램이라, 화면에서는 꽉 차 보여도 실제로는 따로 노는 면들의 모음인 경우가 많습니다. 슬라이서가 건물을 거부하는 흔한 원인입니다.",
  errs=[("한 겹짜리 벽", "면 하나로 그린 벽은 두께가 없습니다. 슬라이서는 벽이 아니라 구멍으로 봅니다.", "입면 안쪽으로 살을 채워 벽을 다시 만듭니다."),
        ("맞닿기만 한 그룹", "그룹·컴포넌트는 각자 따로인 껍질입니다. 만나는 곳의 엣지를 면 셋 이상이 공유해 논매니폴드가 됩니다.", "맞닿거나 겹친 그룹을 한 몸으로 합칩니다."),
        ("겹치고 파고든 형상", "벽을 뚫고 나온 슬래브, 박공을 뚫은 지붕. 이중 벽과 내부 면이 슬라이서를 헷갈리게 합니다.", "내부 면은 사라지고 바깥 껍질만 남습니다."),
        ("축척에서 너무 얇아지는 부재", "50 mm 난간은 1:200에서 0.25 mm가 됩니다. 출력도 안 되면서 모델이 한 덩어리가 되는 것을 막습니다.", "떠 있는 얇은 부재는 지우고 목록으로 보여 줍니다. 벽면 위의 것은 건드리지 않습니다."),
        ("뒤집힌 면", "회색 뒷면이 바깥을 보고 있는 상태. 일부 슬라이서는 반대쪽을 채웁니다.", "다시 만든 표면은 모두 바깥을 향합니다."),
        ("단위 실수와 잔여 형상", "잘못된 단위로 그린 모델, 남은 짧은 선, 2D 사람·나무.", "축척 프리셋과 출력 크기 미리보기, 노즐보다 작은 부스러기 제거로 정리합니다.")],
  scale_h="축척 가이드: 1:N에서 무엇이 남나", scale_p="FDM 노즐은 벽 약 0.8 mm, 독립된 디테일 약 0.45 mm까지 출력합니다. "
     "축척마다 실제로 몇 mm 두께가 그만큼 작아지는지 보여 줍니다.",
  scale_cols=["축척", "최소 벽 두께 (출력 0.8 mm)", "최소 독립 디테일 (0.45 mm)", "10 m 입면의 출력 크기"],
  calc_h="부재 하나 확인하기", calc_real="실제 두께 (mm)", calc_scale="축척 1:", calc_out="출력 두께",
  calc_ok="출력됩니다", calc_thin="노즐보다 얇음: 독립 부재라면 제거됩니다", calc_wall="얇은 벽으로 나옵니다. 0.8 mm 이상이 안전합니다",
  cmp_h="다른 방법과 비교", cmp_cols=["", "SketchUp에서 직접 정리", "일반 STL 수리 사이트", "printdoctor"],
  cmp=[(".skp 바로 열기", "가능", "불가 (먼저 내보내기)", "가능"), ("그룹·컴포넌트", "분해·교차·정리를 손으로", "가장 큰 조각만 남기기 쉬움", "하나의 솔리드로 합침"),
       ("축척 기준 얇은 부재", "눈으로 판단", "무시", "고른 1:N 기준으로 찾아 정리"), ("원본과의 편차", "측정 안 함", "측정 안 함", "수치로 보고"),
       ("건물 하나 처리 시간", "몇 시간", "몇 분, 실패 잦음", "1~4분"), ("비용", "작업 시간", "무료~유료", "무료 (베타)")],
  use_h="이런 분들을 위해", uses=[("설계 사무소", "작업 중인 SketchUp 파일에서 바로 매스·프레젠테이션 모형을."),
       ("공모전·스튜디오", "정리하느라 하루를 쓰지 않고 심사·크리틱용 실물 모형을."),
       ("건축학과 학생", "마감 직전, 메시 수리할 시간이 없을 때 졸업·설계 모형을."),
       ("시행·분양", "설명회용 대지·블록 모형을 사내 프린터로.")],
  faq_h="자주 묻는 질문", faq=[("어떤 SketchUp 버전을 지원하나요?", "SketchUp 2017 이후에 저장한 파일은 그대로 열립니다. 거부되면 최신 SketchUp에서 다시 저장하거나 STL로 내보내 올려 주세요 (파일 > 내보내기 > 3D 모델)."),
     ("숨긴 태그·레이어·객체는 어떻게 되나요?", "숨긴 객체와 숨긴 태그의 객체는 SketchUp 화면과 똑같이 빠집니다. 사람·나무·가구를 출력하지 않으려면 숨긴 뒤 올리세요."),
     ("축척은 무엇을 고르나요?", "실제로 출력할 1:N을 고르세요. 먼저 줄인 뒤 점검하기 때문에 그 축척에서 너무 얇아지는 부재를 찾아냅니다. 올리기 전에 출력 크기를 보여 드립니다."),
     (".skp 파일은 안전하게 처리되나요?", "SketchUp 파일은 처리용 PC에서 다른 파일에 접근할 수 없는 저권한 격리 프로세스로 열고, 메모리와 시간에 상한을 둡니다. 모든 파일은 24시간 뒤 삭제됩니다."),
     ("모양이 바뀌나요?", "표면을 약 0.2 mm 해상도로 다시 만들기 때문에 그보다 작은 디테일은 부드러워집니다. 원본과의 편차(중앙값·95%)를 작업마다 보여 드립니다."),
     ("요청 칸은 무엇인가요?", "문장을 쓰면 에이전트가 수리 계획을 세웁니다. 예를 들어 난간은 지우고 글자는 남깁니다. 에이전트 처리는 하루 한도가 있고, 요청이 없으면 자동 수리가 돌아갑니다."),
     ("무료인가요? 결과를 상업적으로 써도 되나요?", "네. 베타는 광고로 운영되는 무료 서비스이고, 모델과 결과의 권리는 모두 이용자에게 있습니다."),
     ("소스 코드는 공개되나요?", "아직은 아닙니다. 처리 코드와 자체 예시 모델은 추후 공개할 예정이고, 지금은 이 페이지에서 서비스로 사용하실 수 있습니다.")],
  cta_h="오늘 그 건물을 출력 베드 위에", cta_b="SketchUp 파일 변환하기",
  credits="샘플 모델: SketchUp/testup-2 (Trimble Inc.), thomthom/solid-inspector, Eneroth3/eneroth-solid-tools, iamahsanmehmood/openskp의 MIT 라이선스 테스트 파일.",
  footer=["개인정보처리방침", "이용약관", "GitHub", "문의"]),
}

ICONS = {  # simple line icons (24x24, stroke=currentColor)
 "upload": '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
 "scan": '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10"/>',
 "cube": '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
 "check": '<path d="M20 6 9 17l-5-5"/>',
 "wall": '<path d="M4 20V6l8-3 8 3v14"/><path d="M4 20h16"/>',
 "groups": '<rect x="3" y="7" width="9" height="9" rx="1"/><rect x="12" y="10" width="9" height="9" rx="1"/>',
 "overlap": '<path d="M3 15h18M7 15V7h10v8"/><path d="M10 15v6M14 15v6" stroke-dasharray="2 2"/>',
 "thin": '<path d="M5 20V8M9 20V8M13 20V8M17 20V8M3 8h18"/>',
 "flip": '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
 "ruler": '<path d="m3 17 14-14 4 4L7 21l-4-4Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
}
def icon(n, cls="ic"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[n]}</svg>'

TPL = open(os.path.join(ROOT, "tools", "page.html"), encoding="utf-8").read()


def fmt(n, ko):
    return f"{n:,}"


def sample_cards(c, ko):
    pre, out = c["pre"], []
    for s in SAMPLES:
        nm = s["name_ko"] if ko else s["name_en"]
        note = s.get("note_ko" if ko else "note_en", "")
        b, a = s["before"], s["after"]
        real = " × ".join(f"{x / 1000:.0f}" if x >= 1000 else f"{x / 1000:.1f}" for x in s["real_mm"]) + " m"
        prt = " × ".join(f"{x:.0f}" for x in s["print_mm"]) + " mm"
        rows = [(c["s_open"], b["open_edges"], a["open_edges"]), (c["s_nonman"], b["nonmanifold_edges"], a["nonmanifold_edges"]),
                (c["s_shells"], b["bodies"], a["bodies"])]
        li = "".join(f'<li><span>{e(k)}</span><b><s class="{'z' if not x else ''}">{fmt(x, ko)}</s> → <em>{fmt(y, ko)}</em></b></li>' for k, x, y in rows)
        if s.get("thin"):
            li += f'<li><span>{e(c["s_thin"])}</span><b>{s["thin"]}</b></li>'
        li += f'<li><span>{e(c["s_dev"])}</span><b>{s["dev_median"]:.2f} / {s["dev_p95"]:.2f} mm</b></li>'
        out.append(f'''<article class="sample" data-id="{s["id"]}">
  <div class="smedia" data-state="before">
    <video class="sv-before" src="{pre}samples/{s["id"]}/before.mp4" poster="{pre}samples/{s["id"]}/before.jpg" muted loop playsinline preload="none"></video>
    <video class="sv-after" src="{pre}samples/{s["id"]}/after.mp4" poster="{pre}samples/{s["id"]}/after.jpg" muted loop playsinline preload="none"></video>
    <div class="seg" role="group"><button type="button" class="on" data-v="before">{e(c["s_before"])}</button><button type="button" data-v="after">{e(c["s_after"])}</button></div>
    <span class="scale-tag">1:{s["scale"]:,}</span>
  </div>
  <div class="sbody">
    <h3>{e(nm)}</h3>
    {f'<p class="snote">{e(note)}</p>' if note else ''}
    <p class="sdim"><span>{e(c["s_real"])} {real}</span><span>{e(c["s_print"])} {prt}</span></p>
    <ul class="sstats">{li}</ul>
    <div class="sact"><button type="button" class="btn-sm primary try" data-id="{s["id"]}">{e(c["s_try"])}</button>
      <a class="btn-sm" href="{pre}samples/{s["id"]}/model.skp" download>{e(c["s_skp"])}</a>
      <a class="btn-sm ghost" href="https://github.com/{s["repo"]}" rel="noopener" target="_blank">{e(c["s_src"])}: {e(s["repo"].split("/")[1])}</a></div>
  </div>
</article>''')
    return "".join(out)


def chips(c):
    pre = c["pre"]
    return "".join(f'<button type="button" class="chip-sample" data-id="{s["id"]}"><img src="{pre}samples/{s["id"]}/before.jpg" alt="" loading="lazy">'
                   f'<span>{e(s["name_ko"] if c["lang"] == "ko" else s["name_en"])}</span></button>' for s in SAMPLES)


def stats(c, ko):
    nb = sum(s["before"]["open_edges"] + s["before"]["nonmanifold_edges"] for s in SAMPLES)
    na = sum(s["after"]["open_edges"] + s["after"]["nonmanifold_edges"] for s in SAMPLES)
    devs = sorted(s["dev_median"] for s in SAMPLES)
    med = devs[len(devs) // 2] if len(devs) % 2 else (devs[len(devs) // 2 - 1] + devs[len(devs) // 2]) / 2
    vals = [str(len(SAMPLES)), f"{nb:,}", f"{na:,}", f"{med:.2f} mm"]
    return "".join(f'<div class="stat"><b>{v}</b><span>{e(l)}</span></div>' for v, l in zip(vals, c["stat_labels"]))


def scale_table(c):
    rows = []
    for n in (50, 100, 200, 300, 500, 1000):
        rows.append(f'<tr><td><b>1:{n:,}</b></td><td>{0.8 * n:,.0f} mm</td><td>{0.45 * n:,.0f} mm</td><td>{10000 / n:,.0f} mm</td></tr>')
    return "<tr>" + "".join(f"<th>{e(x)}</th>" for x in c["scale_cols"]) + "</tr>" + "".join(rows)


for k, c in C.items():
    ko = k == "ko"
    pre = c["pre"]
    nav = "".join(f'<a href="{h}">{e(t)}</a>' for h, t in c["nav"])
    flow = '<i class="arr"></i>'.join(f'<span>{e(x)}</span>' for x in c["flow"])
    steps = "".join(f'<div class="step"><div class="sico">{icon(ic)}</div><span class="num">{i + 1}</span><h3>{e(t)}</h3><p>{e(d)}</p></div>'
                    for i, ((t, d), ic) in enumerate(zip(c["steps"], ["upload", "scan", "cube", "check"])))
    lab = ("증상", "해결") if ko else ("Problem", "Fix")
    errs = "".join(f'<div class="ecard"><div class="eico">{icon(ic)}</div><h3>{e(t)}</h3><p>{e(a)}</p><p class="fix"><b>{lab[1]}</b> {e(x)}</p></div>'
                   for (t, a, x), ic in zip(c["errs"], ["wall", "groups", "overlap", "thin", "flip", "ruler"]))
    cmp = "<tr>" + "".join(f"<th>{e(x)}</th>" for x in c["cmp_cols"]) + "</tr>" + "".join(
        "<tr>" + "".join(f'<td class="{"good" if j == 3 else ""}">{e(x)}</td>' for j, x in enumerate(r)) + "</tr>" for r in c["cmp"])
    uses = "".join(f'<div class="use"><h3>{e(t)}</h3><p>{e(d)}</p></div>' for t, d in c["uses"])
    faq = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in c["faq"])
    presets = "".join(f'<button type="button" class="chip{" on" if n == 100 else ""}" data-n="{n}">1:{n}</button>' for n in (50, 100, 200, 300, 500, 1000))
    ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": "printdoctor", "url": "https://jaekune2.github.io/" + ("ko/" if ko else ""),
          "applicationCategory": "DesignApplication", "operatingSystem": "Web", "description": c["desc"],
          "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}}
    faqld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in c["faq"]]}
    out = TPL
    rep = dict(lang=c["lang"], pre=pre, title=e(c["title"]), desc=e(c["desc"]), nav=nav,
               en_href="../" if ko else "./", ko_href="./" if ko else "ko/", en_cur="" if ko else 'aria-current="page"',
               ko_cur='aria-current="page"' if ko else "", eyebrow=e(c["eyebrow"]), h1a=e(c["h1a"]), h1b=e(c["h1b"]), sub=e(c["sub"]),
               flow=flow, pills="".join(f'<span class="pill">{e(p)}</span>' for p in c["pills"]),
               drop_b=e(c["drop_b"]), drop_s=e(c["drop_s"]), try_h=e(c["try_h"]), chips=chips(c), scale_l=e(c["scale_l"]), presets=presets,
               scale_custom=e(c["scale_custom"]), scale_real=e(c["scale_real"]),
               defects=e(c["defects"]), geometry=e(c["geometry"]), checknote=e(c["checknote"]), req=e(c["req"]),
               consent=c["consent"].format(pre=pre), send=e(c["send"]), stats_h=e(c["stats_h"]), stats=stats(c, ko),
               samples_h=e(c["samples_h"]), samples_p=e(c["samples_p"]), samples=sample_cards(c, ko),
               how_h=e(c["how_h"]), how_p=e(c["how_p"]), steps=steps, err_h=e(c["err_h"]), err_p=e(c["err_p"]), errs=errs,
               scale_h=e(c["scale_h"]), scale_p=e(c["scale_p"]), scale_table=scale_table(c), calc_h=e(c["calc_h"]), calc_real=e(c["calc_real"]),
               calc_scale=e(c["calc_scale"]), calc_out=e(c["calc_out"]),
               calc_msgs=e(json.dumps([c["calc_ok"], c["calc_wall"], c["calc_thin"]], ensure_ascii=False)),
               cmp_h=e(c["cmp_h"]), cmp=cmp, use_h=e(c["use_h"]), uses=uses, faq_h=e(c["faq_h"]), faq=faq,
               cta_h=e(c["cta_h"]), cta_b=e(c["cta_b"]), credits=e(c["credits"]), hash="#ko" if ko else "",
               f0=c["footer"][0], f1=c["footer"][1], f2=c["footer"][2], f3=c["footer"][3],
               ld=json.dumps(ld, ensure_ascii=False), faqld=json.dumps(faqld, ensure_ascii=False))
    for key, val in rep.items():
        out = out.replace("{{" + key + "}}", str(val))
    assert "{{" not in out, out[out.index("{{"):out.index("{{") + 40]
    p = os.path.join(ROOT, "ko", "index.html") if ko else os.path.join(ROOT, "index.html")
    open(p, "w", encoding="utf-8").write(out)
    print("wrote", p)

# README sample table
import re
rp = os.path.join(ROOT, "README.md")
rd = open(rp, encoding="utf-8").read()
rows = "".join(f"| [{s['name_en']}](samples/{s['id']}/) | 1:{s['scale']:,} | "
               f"{s['before']['open_edges'] + s['before']['nonmanifold_edges']:,} → {s['after']['open_edges'] + s['after']['nonmanifold_edges']:,} |\n" for s in SAMPLES)
rd = re.sub(r"<!-- rows -->\n.*?<!-- /rows -->", lambda m: "<!-- rows -->\n" + rows + "<!-- /rows -->", rd, flags=re.S)
open(rp, "w", encoding="utf-8").write(rd)
print("wrote", rp)
