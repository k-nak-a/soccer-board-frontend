import { useState, useRef, useEffect, type ReactNode } from 'react';
import DraggablePlayer from '@/Component/Molcules/Piece/Player';
import ImageSoccerHalfCourt from '@/Component/Atoms/Images/ImageSoccerHalfCourt';
import { Box } from '@mui/material';
import DialogWithInputField from '@/Component/Molcules/Dialog/WithInputField';
import DialogSimple from '@/Component/Molcules/Dialog/Simple';
import html2canvas from 'html2canvas';
import TeamAndScore from '@/Component/Molcules/TeamAndScore';
import './index.scss';

type Player = {
  id: number
  x: number
  y: number
  name: string
  color?: string
  bgColor?: string
  goals?: number
}

type DragState = {
  id: number
  offsetX: number
  offsetY: number
}

type MatchLog = {
  timestamp: string
  type: 'goal' | 'substitution' | 'lost-point' | 'formation-change'
  description: string
}

type Props = {
  initialPlayers?: Player[];
  width?: string;
  height?: string;
}

const SoccerBoard = ({
  initialPlayers = []
}: Props) => {
  const playerId = useRef<number>(0)
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const benchRef = useRef<HTMLDivElement>(null);
  const courtRef = useRef<HTMLDivElement>(null);
  const captureAreaRef = useRef<HTMLDivElement>(null);

  // start: 初期処理

  // start: 試合ログの初期化
  // 試合ログ
  const [matchLogElements, setMatchLogElements] = useState<ReactNode[]>([]);

  // ログを追加する関数
  const addMatchLog = (type: MatchLog['type'], description: string) => {
    const logIcon = type === 'goal' ? '⚽' : type === 'lost-point' ? '🔴' : '🔄';
    setMatchLogElements(prev => [
      ...prev,
      <div key={prev.length + 1} className="logs-section">
        {logIcon} {description}
      </div>
    ])
  };
  // end: 試合ログの初期化

  // URLからプレイヤー情報を取得
  const getPlayersFromURL = (): string[] => {
    const params = new URLSearchParams(window.location.search);
    const playersParam = params.get('players');
    
    if (playersParam) {
      try {
        return JSON.parse(decodeURIComponent(playersParam));
      } catch (e) {
        console.error('URLパラメータの解析エラー:', e);
      }
    }
    return [];
  };

  // ベンチエリアの位置計算関数（実際のDOM参照）
  const calculateBenchPosition = (index: number): { x: number, y: number } => {
    if (!benchRef.current || !boardAreaRef.current) {
      // フォールバック値
      return { x: 50, y: 450 };
    }

    const boardRect = boardAreaRef.current.getBoundingClientRect();
    const benchRect = benchRef.current.getBoundingClientRect();
    
    // ベンチエリアの実際のサイズ
    const benchWidth = benchRect.width;
    
    // ベンチエリアのboard-area内での相対位置
    const benchStartY = benchRect.top - boardRect.top;
    
    // 駒のサイズ（実際のサイズを取得）
    const pieceSize = 60; // または実際の駒のサイズ
    const padding = 10;
    
    // 1行に配置できる駒の数を計算
    const availableWidth = benchWidth - (padding * 2);
    const itemsPerRow = Math.max(1, Math.floor(availableWidth / (pieceSize + padding)));
    
    // 行と列を計算
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    
    // 中央揃えのためのオフセット計算
    const totalRowWidth = Math.min(index + 1, itemsPerRow) * (pieceSize + padding) - padding;
    const centerOffset = (benchWidth - totalRowWidth) / 2;
    
    // 位置を計算（board-area基準の絶対座標）
    const x = centerOffset + col * (pieceSize + padding) + pieceSize / 2;
    const y = benchStartY + padding + row * (pieceSize + padding) + pieceSize / 2;
    
    return { x, y };
  };

  // コンポーネントマウント後にDOMサイズを取得してプレイヤーを配置
  useEffect(() => {
    // DOMが完全にレンダリングされるまで待つ
    const timer = setTimeout(() => {
      const playerNames = getPlayersFromURL();
      
      if (playerNames.length > 0) {
        const initializedPlayers = playerNames.map((name: string, index: number) => {
          const position = calculateBenchPosition(index);
          return {
            id: index,
            x: position.x,
            y: position.y,
            name: name,
            color: '#fff',
            bgColor: 'darkblue'
          };
        });
        
        setPlayers(initializedPlayers);
        playerId.current = playerNames.length - 1;
      }
      
    }, 100); // 100ms待機してDOMを確実に取得

    return () => clearTimeout(timer);
  }, []);

  // ウィンドウリサイズ時にベンチの位置を再計算
  useEffect(() => {
    const handleResize = () => {
      if (players.length > 0 && benchRef.current) {
        setPlayers(prev => 
          prev.map((player) => {
            // フィールド上にいるプレイヤー（ベンチより上）はそのまま
            if (!isPlayerInBench(player)) {
              return player;
            }
            
            // ベンチにいるプレイヤーのみ再配置
            const benchIndex = getBenchPlayerIndex(prev, player.id);
            const newPosition = calculateBenchPosition(benchIndex);
            return {
              ...player,
              x: newPosition.x,
              y: newPosition.y
            };
          })
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [players]);

  // capture共通処理定義
  // コートエリアをキャプチャしてcapture-areaに追加
  const captureAndAddToArea = async (label?: string) => {
    if (!courtRef.current || !captureAreaRef.current) {
      throw new Error('フィールドが見つかりません');
    }

    try {
      const canvas = await html2canvas(courtRef.current, {
        backgroundColor: '#16a34a',
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imageData = canvas.toDataURL('image/png');
      
      // capture-areaに画像を追加
      setMatchLogElements(prev => [
        ...prev,
        <div key={prev.length + 1} className="capture-section">
          {label && <h3>{label}</h3>}
          <img src={imageData} />
        </div>
      ])
    } catch (error) {
      console.error('画像キャプチャエラー:', error);
      throw error;
    }
  };

  // プレイヤーがベンチエリアにいるか判定
  const isPlayerInBench = (player: Player): boolean => {
    if (!benchRef.current || !boardAreaRef.current) return false;
    
    const boardRect = boardAreaRef.current.getBoundingClientRect();
    const benchRect = benchRef.current.getBoundingClientRect();
    const benchStartY = benchRect.top - boardRect.top;
    
    return player.y >= benchStartY;
  };

  // ベンチ内でのプレイヤーのインデックスを取得
  const getBenchPlayerIndex = (allPlayers: Player[], playerId: number): number => {
    const benchPlayers = allPlayers.filter(p => isPlayerInBench(p));
    return benchPlayers.findIndex(p => p.id === playerId);
  };

  // URLパラメータを更新
  const updateURLParams = (updatedPlayers: Player[]) => {
    const playerNames = updatedPlayers.map(p => p.name);
    const params = new URLSearchParams(window.location.search);
    params.set('players', encodeURIComponent(JSON.stringify(playerNames)));
    
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newURL);
  };
  // end: 初期処理

  // プレイヤー追加ボタン クリック
  // start:名前入力モーダル関連
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempPlayerName, setTempPlayerName] = useState('');

  // 試合フェーズ管理
  const [matchPhase, setMatchPhase] = useState<'before' | 'first-half' | 'half-time' | 'second-half' | 'ended'>('before');
  // フォーメーション変更モード
  const [isFormationChanging, setIsFormationChanging] = useState(false);

  const openAddPlayerDialog = () => {
    setTempPlayerName('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setTempPlayerName('');
  };

  const confirmAddPlayer = () => {
    if (!tempPlayerName || tempPlayerName.trim() === '') {
      return;
    }

    setPlayers((prev) => {
      playerId.current = playerId.current + 1;
      
      // 新しいプレイヤーのインデックス（全プレイヤー数）
      const newPlayerIndex = prev.length;
      
      // ベンチエリアの位置を計算
      const position = calculateBenchPosition(newPlayerIndex);
      
      const newPlayer: Player = {
        id: playerId.current,
        x: position.x,
        y: position.y,
        name: tempPlayerName.trim(),
        color: '#fff',
        bgColor: 'darkblue'
      };
      
      const updatedPlayers = [...prev, newPlayer];
      
      // URLパラメータを更新
      updateURLParams(updatedPlayers);
      
      return updatedPlayers;
    });

    closeDialog();
  };
  // end: 名前入力モーダル関連 

  // start: プレイヤー削除処理
  // 削除確認ダイアログ
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<number | null>(null);

  // ダブルタップ検出用
  const lastTapTime = useRef<number>(0);
  const lastTapId = useRef<number | null>(null);

    // プレイヤーのダブルタップ処理
  const handlePlayerDoubleTap = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    setPlayerToDelete(playerId);
    setDeleteDialogOpen(true);
  };

  // 削除確認ダイアログを閉じる
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPlayerToDelete(null);
  };

  // プレイヤーを削除
  const confirmDeletePlayer = () => {
    if (playerToDelete === null) return;
    
    setPlayers(prev => {
      const updatedPlayers = prev.filter(p => p.id !== playerToDelete);
      
      // 削除後、ベンチにいるプレイヤーを再配置
      const reorderedPlayers = updatedPlayers.map((player) => {
        if (isPlayerInBench(player)) {
          const benchPlayers = updatedPlayers.filter(p => isPlayerInBench(p));
          const benchIndex = benchPlayers.findIndex(p => p.id === player.id);
          const newPosition = calculateBenchPosition(benchIndex);
          return {
            ...player,
            x: newPosition.x,
            y: newPosition.y
          };
        }
        return player;
      });
      
      // URLパラメータを更新
      updateURLParams(reorderedPlayers);
      
      return reorderedPlayers;
    });
    
    closeDeleteDialog();
  };

  // タップイベント処理（ダブルタップ検出）
  const handlePlayerTap = (playerId: number) => {

    // 交代モード中の場合
    if (isSubstituting) {
      handleSelectSubstitutionPlayer(playerId);
      return;
    }

    // 試合開始後はダブルタップで削除できない
    if (isMatchStarted) {
      return;
    }
    
    const currentTime = new Date().getTime();
    const tapInterval = currentTime - lastTapTime.current;

    // 300ms以内の2回目のタップでダブルタップと判定
    if (tapInterval < 300 && lastTapId.current === playerId) {
      handlePlayerDoubleTap(playerId);
      lastTapTime.current = 0; // リセット
      lastTapId.current = null;
    } else {
      lastTapTime.current = currentTime;
      lastTapId.current = playerId;
    }
  };
  // end: プレイヤー削除処理

  // start: 試合開始処理
  const [isMatchStarted, setIsMatchStarted] = useState(false);

  // チーム名管理
  const [allyTeamName, setAllyTeamName] = useState<string>('味方チーム');
  const [opponentTeamName, setOpponentTeamName] = useState<string>('相手チーム');

  // チーム名入力ダイアログ
  const [teamNameDialogOpen, setTeamNameDialogOpen] = useState(false);
  const [tempAllyTeamName, setTempAllyTeamName] = useState('');
  const [tempOpponentTeamName, setTempOpponentTeamName] = useState('');
  const [teamNameInputStep, setTeamNameInputStep] = useState<'ally' | 'opponent'>('ally');

  // 試合開始処理
  const handleStartMatch = async () => {
    if (isMatchStarted) {
      alert('試合は既に開始されています');
      return;
    }

    // チーム名入力ダイアログを表示
    setTempAllyTeamName(allyTeamName);
    setTempOpponentTeamName(opponentTeamName);
    setTeamNameInputStep('ally');
    setTeamNameDialogOpen(true);
  };

  // 味方チーム名の確定
  const confirmAllyTeamName = () => {
    if (!tempAllyTeamName.trim()) {
      alert('チーム名を入力してください');
      return;
    }
    
    setAllyTeamName(tempAllyTeamName.trim());
    setTeamNameInputStep('opponent');
  };

  // 相手チーム名の確定と試合開始（修正）
  const confirmOpponentTeamName = async () => {
    if (!tempOpponentTeamName.trim()) {
      alert('チーム名を入力してください');
      return;
    }
    
    setOpponentTeamName(tempOpponentTeamName.trim());
    setTeamNameDialogOpen(false);

    try {
      await captureAndAddToArea('試合開始');
      setIsMatchStarted(true);
      setMatchPhase('first-half');
      alert('試合を開始しました！📸');
    } catch (error) {
      console.error('試合開始エラー:', error);
      alert('画像のキャプチャに失敗しました');
    }
  };

  // ダイアログを閉じる
  const closeTeamNameDialog = () => {
    setTeamNameDialogOpen(false);
    setTeamNameInputStep('ally');
  };
  // end: 試合開始処理

  // start: フォーメーション変更処理
  // フォーメーション変更開始
  const handleFormationChange = () => {
    setIsFormationChanging(true);
    alert('フォーメーションを変更してください。完了したら「確定」ボタンを押してください。');
  };

  // フォーメーション変更確定
  const confirmFormationChange = async () => {
    try {
      addMatchLog('formation-change', `フォーメーションチェンジ`)
      await captureAndAddToArea();
      setIsFormationChanging(false);

      alert('フォーメーションを確定しました！📸');
    } catch (error) {
      console.error('画像キャプチャエラー:', error);
      alert('画像のキャプチャに失敗しました');
    }
  };

  // フォーメーション変更キャンセル
  const cancelFormationChange = () => {
    setIsFormationChanging(false);
    alert('フォーメーション変更をキャンセルしました');
  };
  // end: フォーメーション変更処理

  // start: 前半終了処理
  // 前半終了
  const handleFirstHalfEnd = async () => {
    if (matchPhase !== 'first-half') {
      alert('前半が進行中ではありません');
      return;
    }

    try {
      await captureAndAddToArea('前半終了');
      setMatchPhase('half-time');
      alert('前半が終了しました！ハーフタイムです。フォーメーションの変更が可能です。');
    } catch (error) {
      console.error('画像キャプチャエラー:', error);
      alert('画像のキャプチャに失敗しました');
    }

    // 後半に向けてフォーメーション変更を受け付ける
    setIsFormationChanging(true);
  };
  // end: 前半終了処理



  // start: 後半開始処理
  const confirmSecondHalfStart = async () => {

    try {
      await captureAndAddToArea('後半開始');
      // 後半開始時の画像として保存
      
      setIsFormationChanging(false);
      setMatchPhase('second-half');
      alert('後半を開始しました！📸');
    } catch (error) {
      console.error('画像キャプチャエラー:', error);
      alert('画像のキャプチャに失敗しました');
    }
  };
  // end: 後半開始処理

  // start: 試合終了処理
  const handleEndMatch = async () => {
    if (!isMatchStarted) {
      alert('先に試合を開始してください');
      return;
    }

    if (matchPhase === 'first-half') {
      const confirmEnd = window.confirm('前半が終了していませんが、試合を終了しますか？');
      if (!confirmEnd) return;
    }

    try {
      // 最後のキャプチャを追加
      await captureAndAddToArea('試合終了');
      // stateの更新がされない状態で画像を作成すると、後半終了時点のキャプチャが消えるので、3秒まつ
      await sleep(3000)

      // capture-area全体をキャプチャ
      if (captureAreaRef.current) {
        const canvas = await html2canvas(captureAreaRef.current, {
          backgroundColor: '#CCC',
          scale: 2,
          logging: false,
          useCORS: true
        });

        const imageData = canvas.toDataURL('image/png');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        downloadImage(imageData, `試合記録_${timestamp}.png`);
      }

      // クリーンアップ
      if (captureAreaRef.current) {
        captureAreaRef.current.innerHTML = '';
      }
      setMatchLogElements([]);
      setIsMatchStarted(false);
      setMatchPhase('ended');

      alert('試合記録を保存しました！🎉');

    } catch (error) {
      console.error('試合終了エラー:', error);
      alert('画像の保存に失敗しました');
    }
  };

  const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

  // ダウンロード関数
  const downloadImage = (imageData: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // end: 試合終了処理

  // start: 得失点関係処理
  const [gettingPoint, setGettingPoint] = useState<number>(0)
  const [lostPoint, setLostPoint] = useState<number>(0)

  // 得点時の処理
  const [goalScorerDialogOpen, setGoalScorerDialogOpen] = useState(false);

  // 得点ボタンクリック
  const handleGetPoint = () => {
    if (players.length === 0) {
      alert('プレイヤーを追加してください');
      return;
    }
    setGoalScorerDialogOpen(true);
  };

  // 得点者を選択
  const handleSelectGoalScorer = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // プレイヤーのゴール数を増やす
    setPlayers(prev =>
      prev.map(p =>
        p.id === playerId
          ? { ...p, goals: (p.goals || 0) + 1 }
          : p
      )
    );

    // スコアを更新
    setGettingPoint(prev => prev + 1);
    addMatchLog('goal', `${player.name} がゴール！`);

    setGoalScorerDialogOpen(false);
  };

  // 得点者選択ダイアログを閉じる
  const closeGoalScorerDialog = () => {
    setGoalScorerDialogOpen(false);
  };

  // 失点処理
  const handleLostPoint = () => {
        setLostPoint((prev) => prev + 1)
        addMatchLog('lost-point', '相手チームが得点');
  }
  // end: 得失点関連処理

  // start: 交代処理
  const [isSubstituting, setIsSubstituting] = useState(false);
  const [selectedPlayerForSubstitution, setSelectedPlayerForSubstitution] = useState<number | null>(null);
  const [substitutionDialogOpen, setSubstitutionDialogOpen] = useState(false);
  const [substitutionStep, setSubstitutionStep] = useState<'select-out' | 'select-in'>('select-out');

  // 交代ボタンクリック
  const handleSubstitution = () => {
    console.log(players)

    if (players.length < 2) {
      alert('交代するには2人以上のプレイヤーが必要です');
      return;
    }

    console.log("aaa")
    setSubstitutionStep('select-out');
    setSubstitutionDialogOpen(true);
  };

  // 交代選手選択（ダイアログ）
  const handleSelectSubstitutionPlayer = (playerId: number, step?: 'select-out' | 'select-in') => {
    if (step === 'select-out') {
      // OUT選手を選択
      setSelectedPlayerForSubstitution(playerId);
      setSubstitutionStep('select-in');
    } else {
      // IN選手を選択して交代実行
      if (selectedPlayerForSubstitution === null) return;
      
      executeSubstitution(selectedPlayerForSubstitution, playerId);
      closeSubstitutionDialog();
    }
  };

  // 交代実行（位置を入れ替え）
  const executeSubstitution = (outPlayerId: number, inPlayerId: number) => {
    const outPlayer = players.find(p => p.id === outPlayerId);
    const inPlayer = players.find(p => p.id === inPlayerId);
    
    if (!outPlayer || !inPlayer) return;

    setPlayers(prev => {
      return prev.map(p => {
        if (p.id === outPlayerId) {
          return { ...p, x: inPlayer.x, y: inPlayer.y };
        }
        if (p.id === inPlayerId) {
          return { ...p, x: outPlayer.x, y: outPlayer.y };
        }
        return p;
      });
    });

    addMatchLog('substitution', `交代: OUT ${outPlayer.name}  → IN ${inPlayer.name} `);
    alert('交代が完了しました！');
  };

  // 交代ダイアログを閉じる
  const closeSubstitutionDialog = () => {
    setSubstitutionDialogOpen(false);
    setSelectedPlayerForSubstitution(null);
    setSubstitutionStep('select-out');
    setIsSubstituting(false);
  };
  // end: 交代処理

  // ドラッグ開始時の処理
  const handleDragStart = (id: number, clientX: number, clientY: number) => {
    if (!boardAreaRef.current) return;

    // フォーメーション変更モード中はドラッグ可能
    if (isFormationChanging) {
      const rect = boardAreaRef.current.getBoundingClientRect();
      const player = players.find(p => p.id === id);
      if (!player) return;

      setDragging({
        id,
        offsetX: clientX - rect.left - player.x,
        offsetY: clientY - rect.top - player.y
      });
      return;
    }

    // 試合開始後は通常ドラッグ不可
    if (isMatchStarted) {
      return;
    }

    // 試合開始前は自由にドラッグ可能
    const rect = boardAreaRef.current.getBoundingClientRect();
    const player = players.find(p => p.id === id);
    if (!player) return;

    setDragging({
      id,
      offsetX: clientX - rect.left - player.x,
      offsetY: clientY - rect.top - player.y
    });
  };

  // ドラッグ中の処理
  const handleDrag = (clientX: number, clientY: number) => {
    if (!dragging || !boardAreaRef.current) return;

    const rect = boardAreaRef.current.getBoundingClientRect();
    const newX = clientX - rect.left - dragging.offsetX;
    const newY = clientY - rect.top - dragging.offsetY;

    // プレイヤーの位置を更新
    setPlayers(prev =>
      prev.map(p =>
        p.id === dragging.id
          ? {
              ...p,
              x: newX,
              y: newY
            }
          : p
      )
    );
  };

  // ドラッグ終了時の処理
  const handleDragEnd = () => {
    setDragging(null);
  };

  // マウス移動時のハンドラー（PC用）
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      handleDrag(e.clientX, e.clientY);
    }
  };

  // タッチ移動時のハンドラー（スマホ用）
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragging) {
      const touch = e.touches[0];
      handleDrag(touch.clientX, touch.clientY);
    }
  };

  // URL共有機能
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyURL = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('URLのコピーに失敗しました:', err);
      alert('URLのコピーに失敗しました');
    });
  };

  return (
    <>
      <main
        ref={fieldRef}
        className="soccer-board"
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
      >
        {/* 得失点エリア */}
        <TeamAndScore 
          ally={{name: allyTeamName, score: gettingPoint}} 
          opponent={{name: opponentTeamName, score: lostPoint}} 
        />

        {/* サッカーボードエリア */}
        <Box ref={boardAreaRef} className={"board-area"}>
          <div ref={courtRef} className="soccer-court">
            {/* サッカーコートの画像 */}
            <ImageSoccerHalfCourt />

            {/* プレイヤー駒 */}
            <Box className="player-area">
              {players.map(player => (
                <DraggablePlayer
                  key={player.id}
                  id={player.id}
                  position={{ x: player.x, y: player.y }}
                  onDragStart={handleDragStart}
                  onTap={handlePlayerTap}
                  color={player.color || "#fff"}
                  bgColor={player.bgColor || "darkblue"}
                  children={player.name}
                  goals={player.goals}
                  className={isPlayerInBench(player) ? 'in-bench' : ''}
                />
              ))}
            </Box>
          </div>
          <div ref={benchRef} className={'bench'} />
        </Box>

        {/* URL共有ボタン（オプション） */}
        {matchPhase === 'before' && players.length > 0 && (
          <Box className="share-button-area">
            <button 
              className={`share-button ${copySuccess ? 'copied' : ''}`}
              onClick={handleCopyURL}
            >
              {copySuccess ? '✓ コピーしました！' : '🔗 URLをコピーして共有'}
            </button>
          </Box>
        )}

        {/* ボタンエリア */}
        <Box className={"button-area"}>
          {/* 試合開始前のボタン群 */}
          {matchPhase === 'before' && 
            <>
              <button className={`button add`} onClick={openAddPlayerDialog}>
                プレイヤー追加
              </button>
              <button 
                className={`button start`} 
                onClick={handleStartMatch}
                disabled={players.length === 0}
              >
                試合開始
              </button>
            </>
          }

          {/* 前半中のボタン群 */}
          {matchPhase === 'first-half' && !isFormationChanging && 
            <>
              <button className={`button get-point`} onClick={handleGetPoint}>
                得点
              </button>
              <button className={`button lost-point`} onClick={handleLostPoint}>
                失点
              </button>
              <button className={`button substitution`} onClick={handleSubstitution}>
                交代
              </button>
              <button className={`button formation`} onClick={handleFormationChange}>
                フォーメーション変更
              </button>
              <button className={`button type-red end`} onClick={handleFirstHalfEnd}>
                前半終了
              </button>
              <button className={`button type-red end`} onClick={handleEndMatch}>
                試合終了
              </button>
            </>
          }

          {/* フォーメーション変更中のボタン群 */}
          {isFormationChanging && matchPhase === 'first-half' && 
            <>
              <button className={`button type-green confirm`} onClick={confirmFormationChange}>
                確定
              </button>
              <button className={`button cancel`} onClick={cancelFormationChange}>
                キャンセル
              </button>
            </>
          }

          {/* ハーフタイム中のボタン群 */}
          {matchPhase === 'half-time' &&
            <>
              <button className={`button substitution`} onClick={handleSubstitution}>
                交代
              </button>
              <button className={`button type-green start`} onClick={confirmSecondHalfStart}>
                後半開始
              </button>
              <button className={`button cancel`} onClick={cancelFormationChange}>
                キャンセル
              </button>
            </>
          }

          {/* 後半中のボタン群 */}
          {matchPhase === 'second-half' && !isFormationChanging && 
            <>
              <button className={`button get-point`} onClick={handleGetPoint}>
                得点
              </button>
              <button className={`button lost-point`} onClick={handleLostPoint}>
                失点
              </button>
              <button className={`button substitution`} onClick={handleSubstitution}>
                交代
              </button>
              <button className={`button formation`} onClick={handleFormationChange}>
                フォーメーション変更
              </button>
              <button className={`button type-red end`} onClick={handleEndMatch}>
                試合終了
              </button>
            </>
          }

          {/* フォーメーション変更中（後半） */}
          {isFormationChanging && matchPhase === 'second-half' && 
            <>
              <button className={`button type-green confirm`} onClick={confirmFormationChange}>
                確定
              </button>
              <button className={`button cancel`} onClick={cancelFormationChange}>
                キャンセル
              </button>
            </>
          }
        </Box>
      </main>

      {/* スマホ最適化ダイアログ */}
      <DialogWithInputField 
        isOpenDialog={dialogOpen} 
        onClose={closeDialog} 
        currentInput={tempPlayerName} 
        setCurrentInput={setTempPlayerName} 
        firstButton={{text: "キャンセル", onClick: closeDialog}} 
        secondButton={{text: "決定", onClick: confirmAddPlayer}}
        inputFieldLabel='プレイヤー名'
      />

      {/* プレイヤー削除確認ダイアログ */}
      <DialogSimple
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        title="プレイヤーを削除"
        message={`${players.find(p => p.id === playerToDelete)?.name || 'このプレイヤー'}を削除しますか？`}
        firstButton={{text: "キャンセル", onClick: closeDeleteDialog}}
        secondButton={{text: "削除", onClick: confirmDeletePlayer}}
      />

      {/* チーム名入力ダイアログ（味方） */}
      {teamNameInputStep === 'ally' && (
        <DialogWithInputField 
          isOpenDialog={teamNameDialogOpen} 
          onClose={closeTeamNameDialog} 
          currentInput={tempAllyTeamName} 
          setCurrentInput={setTempAllyTeamName} 
          firstButton={{text: "キャンセル", onClick: closeTeamNameDialog}} 
          secondButton={{text: "次へ", onClick: confirmAllyTeamName}}
          inputFieldLabel='味方チーム名'
        />
      )}

      {/* チーム名入力ダイアログ（相手） */}
      {teamNameInputStep === 'opponent' && (
        <DialogWithInputField 
          isOpenDialog={teamNameDialogOpen} 
          onClose={closeTeamNameDialog} 
          currentInput={tempOpponentTeamName} 
          setCurrentInput={setTempOpponentTeamName} 
          firstButton={{text: "戻る", onClick: () => setTeamNameInputStep('ally')}} 
          secondButton={{text: "試合開始", onClick: confirmOpponentTeamName}}
          inputFieldLabel='相手チーム名'
        />
      )}

      {/* 得点者選択ダイアログ */}
      <DialogSimple
        isOpen={goalScorerDialogOpen}
        onClose={closeGoalScorerDialog}
        title={"得点者を選択"}
        message="得点したプレイヤーを選択してください"
        firstButton={{text: "キャンセル", onClick: closeGoalScorerDialog}}
        secondButton={{text: "", onClick: () => {}}} // 使わないので空
        customContent={
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1, 
            maxHeight: '400px', 
            overflowY: 'auto',
            mt: 2 
          }}>
            {players.map(player => (
              <button
                key={player.id}
                onClick={() => handleSelectGoalScorer(player.id)}
                style={{
                  padding: '15px',
                  fontSize: '16px',
                  backgroundColor: player.bgColor || 'darkblue',
                  color: player.color || '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{player.name}</span>
                {player.goals && player.goals > 0 && (
                  <span>⚽ × {player.goals}</span>
                )}
              </button>
            ))}
          </Box>
        }
      />

      {/* 交代選手選択ダイアログ */}
      <DialogSimple
        className="substitute"
        isOpen={substitutionDialogOpen}
        onClose={closeSubstitutionDialog}
        title={substitutionStep === 'select-out' ? "OUT選手を選択" : "IN選手を選択"}
        message={
          substitutionStep === 'select-out' 
            ? "フィールドから外す選手を選択してください" 
            : `${players.find(p => p.id === selectedPlayerForSubstitution)?.name} と交代する選手を選択してください`
        }
        firstButton={{text: "キャンセル", onClick: closeSubstitutionDialog}}
        secondButton={{
          text: substitutionStep === 'select-in' ? "戻る" : "", 
          onClick: () => setSubstitutionStep('select-out')
        }}
        customContent={
          <Box 
            className="player-button-area"
          >
            {players
              .filter(p => substitutionStep === 'select-in' ? p.id !== selectedPlayerForSubstitution : true)
              .map(player => (
                <button
                  key={player.id}
                  onClick={() => handleSelectSubstitutionPlayer(player.id, substitutionStep)}
                  style={{
                    backgroundColor: player.bgColor || 'darkblue',
                    color: player.color || '#fff',
                  }}
                >
                  <span>{player.name}</span>
                  {player.goals && player.goals > 0 && (
                    <span>⚽×{player.goals}</span>
                  )}
                </button>
              ))
            }
          </Box>
        }
      />
      {/* 撮ったキャプチャや交代情報などを保持するhiddenな要素 */}
      <Box ref={captureAreaRef} className="capture-area">
        {matchLogElements}
      </Box>
    </>
  );
};

export default SoccerBoard;