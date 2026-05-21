# 시험기간 중앙도서관 야간버스 웹앱

이 저장소는 중앙도서관 야간버스의 **운행일, 운행시간, 노선, 정류장, 탑승 위치**를 안내하는 웹앱입니다.

이용자는 별도 설치 없이 GitHub Pages 주소로 접속할 수 있습니다.

```text
https://깃허브아이디.github.io/저장소이름/
```

예:

```text
https://libjeju.github.io/libNbus/
```

---

## 1. 파일 구조

```text
.
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
├── .github/
│   └── workflows/
│       └── deploy.yml
└── src/
    ├── main.jsx
    ├── App.jsx
    └── data/
        ├── busInfo.json
        ├── routes.json
        └── schedule.json
```

---

## 2. 가장 중요한 원칙

운영 담당자는 대부분 `src/data` 폴더의 JSON 파일만 수정하면 됩니다.

| 바꾸고 싶은 것 | 수정할 파일 |
|---|---|
| 제목, 운영 연도, 운영 월, 기본 날짜, 탑승 위치, 검색창 문구 | `src/data/busInfo.json` |
| 노선 번호, 방면, 종점, 정류장 이름, 정류장 순서 | `src/data/routes.json` |
| 운행 날짜, 운행 시간, 운행 노선, 날짜별 메모 | `src/data/schedule.json` |
| 화면 디자인, 버튼, 색상, 기능 | `src/App.jsx` |

---

## 3. JSON 수정 시 꼭 지킬 규칙

JSON은 JavaScript보다 실수를 줄이기 좋지만, 아래 규칙은 꼭 지켜야 합니다.

### 3-1. 문자열은 큰따옴표로 감싸기

좋은 예:

```json
"boardingPlace": "중앙도서관 정문 앞"
```

나쁜 예:

```json
"boardingPlace": 중앙도서관 정문 앞
```

### 3-2. 항목 사이에는 쉼표 넣기

좋은 예:

```json
{
  "serviceYear": 2026,
  "serviceMonth": 6
}
```

나쁜 예:

```json
{
  "serviceYear": 2026
  "serviceMonth": 6
}
```

### 3-3. 마지막 항목 뒤에는 쉼표를 넣지 않기

좋은 예:

```json
{
  "serviceMonth": 6
}
```

나쁜 예:

```json
{
  "serviceMonth": 6,
}
```

---

## 4. 기본 안내 정보 수정: `src/data/busInfo.json`

예시:

```json
{
  "title": "제주대학교 중앙도서관 야간버스",
  "eventLabel": "시험기간 한정 운행",
  "serviceYear": 2026,
  "serviceMonth": 6,
  "defaultDate": "2026-06-15",
  "boardingPlace": "중앙도서관 정문 앞",
  "heroTitleLine1": "공부를 마친 밤,",
  "heroTitleLine2": "귀가길은 더 편하게.",
  "heroDescription": "오늘 운행하는 시간과 노선을 빠르게 확인하세요.",
  "searchPlaceholder": "정류장 검색  예: 노형, 터미널",
  "dayLabels": ["일", "월", "화", "수", "목", "금", "토"]
}
```

`defaultDate`는 반드시 실제 운행일이어야 합니다. 날짜 형식은 반드시 `YYYY-MM-DD`입니다.

---

## 5. 노선 수정: `src/data/routes.json`

각 노선은 아래 구조를 가집니다.

```json
{
  "id": 1,
  "terminal": "부영아파트사거리",
  "area": "시청 · 용담 · 신제주 · 노형",
  "short": "노형",
  "cta": "노형 방면",
  "stops": [
    "중앙도서관",
    "아라주공아파트",
    "법원"
  ]
}
```

| 항목 | 의미 |
|---|---|
| `id` | 노선 번호 |
| `terminal` | 종점 또는 대표 도착지 |
| `area` | 주요 경유 지역 |
| `short` | 짧은 방면명 |
| `cta` | 버튼 문구 |
| `stops` | 정류장 목록 |

---

## 6. 운행일과 시간 수정: `src/data/schedule.json`

예시:

```json
{
  "notesByDate": {},
  "scheduleRules": [
    {
      "name": "단축 운행",
      "days": [4, 5, 6, 7, 8, 9, 10, 11, 12, 23],
      "departures": [
        { "time": "00:05", "routes": [1, 3, 5] }
      ]
    },
    {
      "name": "전체 운행",
      "days": [13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
      "departures": [
        { "time": "00:05", "routes": [1, 2, 3, 4, 5] },
        { "time": "01:05", "routes": [2, 4] },
        { "time": "02:05", "routes": [1] }
      ]
    }
  ]
}
```

`days`는 운영 월 안의 날짜 숫자입니다.

예: 운영 월이 6월이면 `13`은 6월 13일입니다.

---

## 7. 운영자 전용 검증 화면

일반 주소에서는 데이터 검증 패널이 보이지 않습니다.

운영자는 주소 뒤에 `?admin=1`을 붙여 확인합니다.

```text
https://깃허브아이디.github.io/저장소이름/?admin=1
```

---

## 8. 배포 방식

이 프로젝트는 GitHub Actions로 자동 배포됩니다.

- `main` 브랜치에 파일을 올리면 자동으로 빌드됩니다.
- `.github/workflows/deploy.yml`이 배포를 담당합니다.
- 의존성 설치는 `npm ci`를 사용합니다.
- 빌드 결과물은 `dist` 폴더입니다.

---

## 9. 수정 후 확인 순서

1. GitHub에서 파일 수정
2. `Commit changes` 클릭
3. 저장소 상단 `Actions` 클릭
4. 최신 작업이 초록 체크인지 확인
5. 저장소 `Settings` → `Pages`에서 주소 확인
6. 웹사이트 새로고침

캐시 때문에 예전 화면이 보이면 주소 뒤에 `?v=숫자`를 붙입니다.

```text
https://깃허브아이디.github.io/저장소이름/?v=2
```

---

## 10. 자주 나는 오류

| 증상 | 원인 | 해결 |
|---|---|---|
| 화면이 하얗게 나옴 | JSON 쉼표, 따옴표 오류 | 최근 수정한 JSON 확인 |
| 특정 날짜가 안 보임 | `schedule.json`의 `days`에 날짜 없음 | `days` 배열에 날짜 추가 |
| 특정 노선이 안 보임 | `routes` 배열에 노선 번호 없음 | 해당 시간의 `routes`에 노선 번호 추가 |
| 배포 실패 | `npm ci`가 package-lock과 맞지 않음 | package.json과 package-lock을 함께 올렸는지 확인 |

---

## 11. 기술 정보

- React: 19.2.6
- React DOM: 19.2.6
- Vite: 8.0.10
- @vitejs/plugin-react: 6.0.2
- Node.js: 20

---

## 12. 한 줄 요약

운영자는 `src/data/busInfo.json`, `src/data/routes.json`, `src/data/schedule.json`만 수정하면 됩니다. 수정 후 GitHub Actions가 자동으로 웹사이트를 다시 배포합니다.
