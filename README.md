# printdoctor: SketchUp to 3D print

**Use it here: https://jaekune2.github.io (한국어: https://jaekune2.github.io/ko/)**

printdoctor turns SketchUp architectural models into scale models you can print. Upload a `.skp` file (or STL, OBJ, PLY, GLB or 3MF) and choose the print scale. You get back one closed solid that keeps the facade and slices without errors. The beta is free and needs no sign-up.

[한국어 안내는 아래에 있습니다.](#한국어)

## What it fixes

| Problem in the SketchUp model | What a slicer does with it | What printdoctor does |
|---|---|---|
| Walls drawn as a single face | Sees a hole where the wall should be | Rebuilds the wall with thickness inside the facade |
| Groups and components that only touch | Non-manifold edges; parts of layers come out empty | Merges them into one body |
| Overlapping or intersecting geometry (slabs through walls) | Double walls and stray inner faces | Keeps only the outer skin |
| Parts too thin at the chosen 1:N (railings, mullions) | Broken strands, or nothing at all | Removes free-standing thin parts and lists them; leaves relief on walls alone |
| Reversed faces | Fills the wrong side | Points the rebuilt surface outward |
| Wrong units, leftover edges | The model comes out the wrong size | Offers scale presets, shows the print size before upload, drops specks |

## How to use it

1. Open https://jaekune2.github.io.
2. Drop a `.skp` file onto the page. You can also drop an STL, OBJ, PLY, GLB or 3MF; these are checked in your browser before anything is uploaded.
3. Choose the print scale, for example 1:100 or 1:200. The page shows the size the print will come out at.
4. Press **Convert & repair**. Most buildings take 1 to 4 minutes.
5. Turn the before and after models side by side in 3D, then download the STL.

Before uploading:
- In SketchUp, hide anything you do not want printed, such as people, trees or furniture. Hidden objects and objects on hidden tags are skipped.
- No file at hand? Press one of the open samples on the page.

## Open sample models

The [`samples/`](samples/) folder holds a few open-licensed SketchUp models with real defects, together with the results printdoctor produced for them. All of them are MIT-licensed test files from public SketchUp tool repositories; see [samples/LICENSES.md](samples/LICENSES.md).

| Sample | Scale | Edge errors before → after |
|---|---|---|
<!-- rows -->
| [Townhouse](samples/house/) | 1:200 | 818 → 0 |
| [High-rise tower (Hearst Tower model)](samples/tower/) | 1:1,000 | 590 → 0 |
| [Two houses on a site](samples/twin-houses/) | 1:400 | 1,024 → 0 |
| [Two housing blocks](samples/housing-blocks/) | 1:30 | 10,899 → 0 |
| [Long single-storey house](samples/long-house/) | 1:400 | 115 → 0 |
| [Walls-only massing](samples/walls/) | 1:250 | 57 → 0 |
<!-- /rows -->

## Privacy and safety

- Files and results are deleted 24 hours after upload.
- SketchUp files are opened with the official SketchUp SDK. This runs in an isolated, low-privilege process with no access to other files, and with memory and time limits.
- Limits: 50 MB per file, 5 uploads per hour.
- See the [privacy policy](https://jaekune2.github.io/privacy.html) and the [terms](https://jaekune2.github.io/terms.html).

## Source code

The processing code, and our own example models and case studies, are **not public yet. They will be released later.** For now, use printdoctor through the website. Bug reports and deletion requests go in [Issues](https://github.com/JaekunE2/JaekunE2.github.io/issues).

---

## 한국어

**사용하기: https://jaekune2.github.io/ko/**

printdoctor는 SketchUp 건축 모델을 바로 출력되는 축소 모형으로 바꿔 주는 무료 웹 서비스입니다(베타). `.skp`를 그대로 올리고 출력 축척(1:N)을 고르면, 입면은 유지한 채 하나의 닫힌 솔리드로 다시 만든 STL을 받습니다. 가입 없이 무료입니다.

### 사용 방법

1. https://jaekune2.github.io/ko/ 에 들어갑니다.
2. `.skp` 파일을 끌어 놓습니다. STL·OBJ·PLY·GLB·3MF도 됩니다.
   - 이 형식들은 올리기 전에 브라우저 안에서 먼저 점검합니다.
3. 출력 축척을 고릅니다(예: 1:100, 1:200). 출력 크기가 바로 표시됩니다.
4. **변환하고 고치기**를 누릅니다. 건물 하나에 보통 1~4분 걸립니다.
5. 수정 전·후를 나란히 3D로 돌려 보고 STL을 내려받습니다.

알아 둘 점:
- 사람·나무·가구처럼 출력하지 않을 것은 SketchUp에서 숨긴 뒤 올리세요. 숨긴 객체와 숨긴 태그의 객체는 빠집니다.
- 파일이 없으면 페이지에 있는 공개 샘플 버튼으로 바로 해 볼 수 있습니다.

### 공개 예시

[`samples/`](samples/) 폴더에 실제 결함이 있는 SketchUp 모델 몇 개와 처리 결과를 공개했습니다.
- 모두 SketchUp 도구 공개 저장소에 MIT 라이선스로 올라온 테스트 파일입니다([samples/LICENSES.md](samples/LICENSES.md)).

### 보안·개인정보

- 파일과 결과는 업로드 24시간 뒤 삭제됩니다.
- SketchUp 파일은 공식 SketchUp SDK로 엽니다. 다른 파일에 접근할 수 없는 저권한 격리 프로세스에서 실행되고, 메모리와 시간에 상한이 있습니다.

### 소스 코드

처리 코드와 자체 예시 모델·사례는 **추후 공개 예정**입니다. 지금은 웹사이트에서 서비스로 이용해 주세요. 문의·삭제 요청은 [Issues](https://github.com/JaekunE2/JaekunE2.github.io/issues)에 남겨 주세요.
