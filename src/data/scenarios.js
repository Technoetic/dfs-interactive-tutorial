/**
 * 7단계 학습 시나리오 데이터
 * 출처: step025 planning chunk3 + step016 조사결과 chunk2
 */
export const scenarios = [
	{
		id: 0,
		title: "데모: DFS 한눈에 보기",
		description:
			"DFS는 가능한 깊이까지 내려간 뒤 되돌아옵니다. 자동으로 실행해 봅니다.",
		autoPlay: true,
		speed: 0.7,
		startId: "A",
		nodes: [
			{ id: "A", label: "A", x: 250, y: 80 },
			{ id: "B", label: "B", x: 140, y: 200 },
			{ id: "C", label: "C", x: 360, y: 200 },
			{ id: "D", label: "D", x: 80, y: 330 },
			{ id: "E", label: "E", x: 200, y: 330 },
			{ id: "F", label: "F", x: 320, y: 330 },
		],
		edges: [
			{ from: "A", to: "B" },
			{ from: "A", to: "C" },
			{ from: "B", to: "D" },
			{ from: "B", to: "E" },
			{ from: "C", to: "F" },
		],
		realWorld: {
			app: "파일 탐색기",
			icon: "📁",
			description:
				"Windows/macOS 파일 탐색기가 폴더를 열 때 DFS로 하위 폴더를 먼저 탐색합니다.",
		},
	},
	{
		id: 1,
		title: "Step 1: 기본 DFS 탐색",
		description:
			"DFS는 스택(Stack)을 사용합니다. 시작 노드를 스택에 넣고, 꺼낸 노드의 이웃을 순서대로 스택에 추가합니다.",
		autoPlay: false,
		speed: 1,
		startId: "A",
		nodes: [
			{ id: "A", label: "A", x: 250, y: 80 },
			{ id: "B", label: "B", x: 140, y: 220 },
			{ id: "C", label: "C", x: 360, y: 220 },
			{ id: "D", label: "D", x: 250, y: 360 },
		],
		edges: [
			{ from: "A", to: "B" },
			{ from: "A", to: "C" },
			{ from: "C", to: "D" },
		],
		realWorld: {
			app: "소셜 네트워크",
			icon: "👥",
			description:
				'Facebook, LinkedIn에서 "친구의 친구" 관계를 찾을 때 DFS를 사용합니다.',
		},
	},
	{
		id: 2,
		title: "Step 2: 역추적(Backtracking)",
		description:
			"막힌 길을 만나면 DFS는 뒤로 돌아갑니다(역추적). 이것이 DFS의 핵심입니다.",
		autoPlay: false,
		speed: 1,
		startId: "A",
		nodes: [
			{ id: "A", label: "A", x: 250, y: 60 },
			{ id: "B", label: "B", x: 120, y: 180 },
			{ id: "C", label: "C", x: 380, y: 180 },
			{ id: "D", label: "D", x: 60, y: 320 },
			{ id: "E", label: "E", x: 180, y: 320 },
		],
		edges: [
			{ from: "A", to: "B" },
			{ from: "A", to: "C" },
			{ from: "B", to: "D" },
			{ from: "B", to: "E" },
		],
		realWorld: {
			app: "미로/게임 AI",
			icon: "🎮",
			description:
				"게임에서 캐릭터가 길을 찾을 때, 막힌 길이면 되돌아가는 역추적을 사용합니다.",
		},
	},
	{
		id: 3,
		title: "Step 3: 사이클 감지",
		description:
			'DFS는 이미 방문한 노드를 추적합니다. 방문한 노드로 돌아오면 "사이클(순환)"이 있다는 것입니다.',
		autoPlay: false,
		speed: 1,
		startId: "A",
		nodes: [
			{ id: "A", label: "A", x: 250, y: 60 },
			{ id: "B", label: "B", x: 120, y: 220 },
			{ id: "C", label: "C", x: 380, y: 220 },
			{ id: "D", label: "D", x: 250, y: 380 },
		],
		edges: [
			{ from: "A", to: "B" },
			{ from: "B", to: "D" },
			{ from: "D", to: "C" },
			{ from: "C", to: "A" },
		],
		realWorld: {
			app: "컴파일러",
			icon: "⚙️",
			description:
				"컴파일러는 DFS로 모듈 간 순환 의존성(A→B→C→A)을 감지합니다.",
		},
	},
	{
		id: 4,
		title: "Step 4: 인접 리스트 표현",
		description:
			"그래프는 인접 리스트로 표현합니다. 각 노드의 이웃 목록을 저장하는 방식입니다.",
		autoPlay: false,
		speed: 1,
		startId: "1",
		nodes: [
			{ id: "1", label: "1", x: 250, y: 60 },
			{ id: "2", label: "2", x: 100, y: 200 },
			{ id: "3", label: "3", x: 400, y: 200 },
			{ id: "4", label: "4", x: 100, y: 360 },
			{ id: "5", label: "5", x: 400, y: 360 },
		],
		edges: [
			{ from: "1", to: "2" },
			{ from: "1", to: "3" },
			{ from: "2", to: "4" },
			{ from: "3", to: "5" },
			{ from: "4", to: "5" },
		],
		realWorld: {
			app: "네비게이션",
			icon: "🗺️",
			description:
				"구글맵은 도로 네트워크를 인접 리스트로 저장하고, DFS로 경로를 탐색합니다.",
		},
	},
	{
		id: 5,
		title: "Step 5: 웹 크롤러",
		description:
			"웹 크롤러는 DFS로 페이지를 탐색합니다. 한 링크를 끝까지 따라가다가 돌아옵니다.",
		autoPlay: false,
		speed: 1,
		startId: "Home",
		nodes: [
			{ id: "Home", label: "Home", x: 250, y: 60 },
			{ id: "About", label: "About", x: 100, y: 200 },
			{ id: "Blog", label: "Blog", x: 400, y: 200 },
			{ id: "Post1", label: "Post1", x: 300, y: 340 },
			{ id: "Post2", label: "Post2", x: 500, y: 340 },
		],
		edges: [
			{ from: "Home", to: "About" },
			{ from: "Home", to: "Blog" },
			{ from: "Blog", to: "Post1" },
			{ from: "Blog", to: "Post2" },
		],
		realWorld: {
			app: "구글 검색",
			icon: "🔍",
			description: "구글 크롤러는 DFS로 웹 페이지를 타고 다니며 인덱싱합니다.",
		},
	},
	{
		id: 6,
		title: "Step 6: 도전! 직접 탐색",
		description:
			"이제 직접 탐색 순서를 예측해 보세요. 다음 버튼을 눌러 DFS가 어느 노드를 방문하는지 맞춰보세요.",
		autoPlay: false,
		speed: 1,
		startId: "S",
		nodes: [
			{ id: "S", label: "S", x: 250, y: 50 },
			{ id: "A", label: "A", x: 100, y: 170 },
			{ id: "B", label: "B", x: 400, y: 170 },
			{ id: "C", label: "C", x: 50, y: 310 },
			{ id: "D", label: "D", x: 200, y: 310 },
			{ id: "E", label: "E", x: 350, y: 310 },
			{ id: "F", label: "F", x: 450, y: 310 },
		],
		edges: [
			{ from: "S", to: "A" },
			{ from: "S", to: "B" },
			{ from: "A", to: "C" },
			{ from: "A", to: "D" },
			{ from: "B", to: "E" },
			{ from: "B", to: "F" },
		],
		realWorld: {
			app: "파일 시스템",
			icon: "🗂️",
			description:
				"OS의 파일 시스템 탐색, 소셜 네트워크 친구 찾기 등 모두 이 원리를 사용합니다.",
		},
	},
];
