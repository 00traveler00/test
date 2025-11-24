# Unityセットアップガイド（プレースホルダー版）

このガイドでは、プレースホルダースプライトを使用してゲームをテストする方法を説明します。

## 1. 基本シーン構成

### シーン構造
以下の3つのシーンを作成してください：
1. `TitleScene` - タイトル画面（後で実装）
2. `HomeScene` - ホーム画面（後で実装）
3. `GameScene` - メインゲームプレイシーン

## 2. GameSceneのセットアップ

### A. マネージャーオブジェクト
空のGameObjectを作成し、以下のスクリプトをアタッチ：

#### GameManager (DontDestroyOnLoad)
- `GameManager.cs`をアタッチ

#### InputManager (DontDestroyOnLoad)
- `InputManager.cs`をアタッチ
- Virtual Joystickは後で設定

#### ResourceManager (DontDestroyOnLoad)
- `ResourceManager.cs`をアタッチ

#### SaveManager (DontDestroyOnLoad)
- `SaveManager.cs`をアタッチ

### B. プレイヤーオブジェクト

1. **空のGameObjectを作成** → 名前: "Player"
2. **Tag設定**: "Player"タグを作成して設定
3. **コンポーネント追加**:
   - `Rigidbody2D`
     - Body Type: Dynamic
     - Gravity Scale: 0
     - Constraints: Freeze Rotation Z
   - `CircleCollider2D`
     - Radius: 0.5
   - `PlayerController.cs`
   - `PlayerStats.cs`
   - `SpriteRenderer`
     - Color: ピンク (#FF69B4)
     - Sprite: Unity標準の "Knob" または "Circle"

4. **武器の追加**（Playerの子オブジェクト）:
   - 空のGameObject → 名前: "Weapon"
   - `ProjectileWeapon.cs`をアタッチ
   - Inspector設定:
     - Damage: 10
     - Cooldown: 1
     - Range: 10
     - Projectile Prefab: 後で作成

### C. 弾丸プレハブ (Projectile)

1. **空のGameObjectを作成** → 名前: "Projectile"
2. **コンポーネント追加**:
   - `SpriteRenderer`
     - Color: 黄色 (#FFFF00)
     - Sprite: Unity標準の "Circle"
     - Scale: (0.2, 0.2, 1)
   - `CircleCollider2D`
     - Is Trigger: ON
     - Radius: 0.1
   - `Rigidbody2D`
     - Body Type: Kinematic
     - Gravity Scale: 0
   - `Projectile.cs`
     - Speed: 10
     - Life Time: 5

3. **Prefab化**: ProjectフォルダにPrefabsフォルダを作成し、ドラッグ＆ドロップ
4. **PlayerのWeaponに設定**: Projectile Prefabフィールドに割り当て

### D. 敵プレハブ

各敵タイプごとにプレハブを作成：

#### Slime
1. 空のGameObject → 名前: "Slime"
2. Tag: "Enemy"タグを作成して設定
3. コンポーネント:
   - `SpriteRenderer` (Color: 緑 #00FF00, Sprite: Circle)
   - `CircleCollider2D` (Radius: 0.5)
   - `Rigidbody2D` (Dynamic, Gravity Scale: 0, Freeze Rotation Z)
   - `EnemySlime.cs`
   - Inspector設定:
     - Max Health: 10
     - Move Speed: 3
     - Damage: 10
     - Pickup Prefab: 後で作成

#### Golem
1. 空のGameObject → 名前: "Golem"
2. Tag: "Enemy"
3. コンポーネント:
   - `SpriteRenderer` (Color: 灰色 #808080, Sprite: Square, Scale: (1.5, 1.5, 1))
   - `BoxCollider2D`
   - `Rigidbody2D` (Dynamic, Gravity Scale: 0, Freeze Rotation Z)
   - `EnemyGolem.cs`
   - Pickup Prefab: 後で作成

#### Lizard
1. 空のGameObject → 名前: "Lizard"
2. Tag: "Enemy"
3. コンポーネント:
   - `SpriteRenderer` (Color: オレンジ #FF8800, Sprite: Circle)
   - `CircleCollider2D`
   - `Rigidbody2D` (Dynamic, Gravity Scale: 0, Freeze Rotation Z)
   - `EnemyLizard.cs`
   - Inspector設定:
     - Attack Range: 5
     - Fire Rate: 2
     - Projectile Prefab: 敵用の弾丸プレハブ（後で作成）
     - Pickup Prefab: 後で作成

#### Totem
1. 空のGameObject → 名前: "Totem"
2. Tag: "Enemy"
3. コンポーネント:
   - `SpriteRenderer` (Color: 紫 #8800FF, Sprite: Square)
   - `BoxCollider2D`
   - `Rigidbody2D` (Static)
   - `LineRenderer` (子オブジェクトとして追加)
     - Width: 0.1
     - Color: 赤
     - Enabled: OFF（初期状態）
   - `EnemyTotem.cs`
   - Inspector設定:
     - Line Renderer: 子のLineRendererを割り当て
     - Attack Interval: 3
     - Beam Duration: 1
     - Pickup Prefab: 後で作成

すべてPrefab化してください。

### E. ピックアップ（エネルギージェム）

1. 空のGameObject → 名前: "EnergyGem"
2. Tag: "Pickup"タグを作成して設定
3. コンポーネント:
   - `SpriteRenderer` (Color: シアン #00FFFF, Sprite: Circle, Scale: (0.3, 0.3, 1))
   - `CircleCollider2D` (Is Trigger: ON, Radius: 0.15)
   - `Pickup.cs`
   - Inspector設定:
     - Energy Amount: 1
     - Magnet Range: 3
     - Move Speed: 8

4. Prefab化
5. **各敵プレハブに設定**: Pickup Prefabフィールドに割り当て

### F. 敵スポナー

1. 空のGameObject → 名前: "EnemySpawner"
2. `EnemySpawner.cs`をアタッチ
3. Inspector設定:
   - Spawn Radius: 10
   - Waves: サイズ 1
     - Wave 0:
       - Wave Name: "Wave 1"
       - Duration: 60
       - Spawn Data: サイズ 2
         - Element 0:
           - Enemy Prefab: Slime
           - Spawn Interval: 2
         - Element 1:
           - Enemy Prefab: Golem
           - Spawn Interval: 5

### G. ボス召喚台座

1. 空のGameObject → 名前: "BossAltar"
2. Position: (10, 0, 0) など、プレイヤーから少し離れた場所
3. コンポーネント:
   - `SpriteRenderer` (Color: 金 #FFD700, Sprite: Square, Scale: (2, 2, 1))
   - `BossAltar.cs`
   - Inspector設定:
     - Boss Prefab: ボスプレハブ（後で作成）
     - Interaction Range: 2

### H. ボスプレハブ

1. 空のGameObject → 名前: "BossSlime"
2. Tag: "Enemy"
3. コンポーネント:
   - `SpriteRenderer` (Color: 緑 #00FF00, Sprite: Circle, Scale: (3, 3, 1))
   - `CircleCollider2D` (Radius: 1.5)
   - `Rigidbody2D` (Dynamic, Gravity Scale: 0, Freeze Rotation Z)
   - `BossEnemy.cs`
   - Inspector設定:
     - Boss Name: "デカスライム"
     - Pickup Prefab: EnergyGem

4. Prefab化してBossAltarに設定

### I. UI設定

#### Canvas作成
1. UI → Canvas
2. Canvas Scaler:
   - UI Scale Mode: Scale With Screen Size
   - Reference Resolution: 1920x1080

#### HUD (Canvasの子)
1. 空のGameObject → 名前: "HUD"
2. 子要素を追加:

**HealthBar**:
- UI → Slider
- Position: 左上 (Anchor: Top Left)
- `Slider`コンポーネント:
  - Min Value: 0
  - Max Value: 100
  - Value: 100
- Fill Area → Fill: Color 赤 (#FF0000)

**EnergyText**:
- UI → Text (TextMeshPro)
- Position: 右上
- Text: "Energy: 0"

**LevelText**:
- UI → Text (TextMeshPro)
- Position: 左上（HealthBarの下）
- Text: "Lv. 1"

**HUDController**:
- HUDオブジェクトに`HUDController.cs`をアタッチ
- Inspector設定:
  - Health Bar: HealthBar Sliderを割り当て
  - Energy Text: EnergyTextを割り当て
  - Level Text: LevelTextを割り当て

#### PauseScreen (Canvasの子)
1. UI → Panel → 名前: "PauseScreen"
2. Image: Color 半透明黒 (#00000080)
3. 子要素:
   - UI → Text: "PAUSE"
   - UI → Button: "Resume" → OnClick: UIManager.OnResumeButton
   - UI → Button: "Home" → OnClick: UIManager.OnHomeButton
4. 初期状態: Inactive

#### ResultScreen (Canvasの子)
1. UI → Panel → 名前: "ResultScreen"
2. Image: Color 半透明黒 (#00000080)
3. 子要素:
   - UI → Text (TMP): 名前 "TitleText"
   - UI → Text (TMP): 名前 "RelicsCollectedText"
   - UI → Text (TMP): 名前 "MoneyEarnedText"
   - UI → Button: "Retry" → OnClick: UIManager.OnRestartButton
   - UI → Button: "Home" → OnClick: UIManager.OnHomeButton
4. `ResultScreen.cs`をアタッチ
   - Title Text: TitleTextを割り当て
   - Relics Collected Text: RelicsCollectedTextを割り当て
   - Money Earned Text: MoneyEarnedTextを割り当て
5. 初期状態: Inactive

#### UIManager
1. 空のGameObject → 名前: "UIManager"
2. `UIManager.cs`をアタッチ
3. Inspector設定:
   - HUD Screen: HUDを割り当て
   - Pause Screen: PauseScreenを割り当て
   - Result Screen: ResultScreenを割り当て

#### DamageNumberSpawner
1. 空のGameObject → 名前: "DamageNumberSpawner"
2. `DamageNumberSpawner.cs`をアタッチ
3. Damage Number Prefab: 後で作成

#### DamageNumber Prefab
1. 3D Object → 3D Text (TextMeshPro) → 名前: "DamageNumber"
2. `TextMeshPro`設定:
   - Font Size: 2
   - Color: 白
   - Alignment: Center
3. `DamageNumber.cs`をアタッチ
   - Move Speed: 1
   - Fade Speed: 1
   - Life Time: 1
4. Prefab化してDamageNumberSpawnerに設定

### J. カメラ設定

Main Camera:
- Position: (0, 0, -10)
- Size: 10（Orthographic）
- カメラフォロースクリプト（簡易版）を追加:

```csharp
// CameraFollow.cs
using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    private Transform target;
    public float smoothSpeed = 0.125f;

    void Start()
    {
        GameObject player = GameObject.FindGameObjectWithTag("Player");
        if (player != null) target = player.transform;
    }

    void LateUpdate()
    {
        if (target == null) return;
        Vector3 desiredPosition = new Vector3(target.position.x, target.position.y, -10);
        Vector3 smoothedPosition = Vector3.Lerp(transform.position, desiredPosition, smoothSpeed);
        transform.position = smoothedPosition;
    }
}
```

## 3. テスト手順

1. **GameSceneを開く**
2. **Playボタンを押す**
3. **操作確認**:
   - WASD/矢印キーでプレイヤーが移動
   - プレイヤーが自動的に敵を攻撃（黄色い弾丸）
   - 敵がプレイヤーを追尾
   - 敵を倒すとエネルギージェムがドロップ
   - ジェムに近づくと吸い寄せられる
4. **ボス召喚台座に近づいてEキーを押す**
   - ボスが出現
   - 雑魚敵の出現が停止
5. **ボスを倒す**
   - リザルト画面が表示される

## 4. トラブルシューティング

### プレイヤーが動かない
- InputManagerが存在するか確認
- PlayerControllerがアタッチされているか確認

### 敵が出現しない
- EnemySpawnerの設定を確認
- 敵プレハブが正しく設定されているか確認

### 攻撃が当たらない
- ProjectileとEnemyのColliderがIs Trigger設定されているか確認
- Enemyに"Enemy"タグが設定されているか確認

### UIが表示されない
- Canvasが存在するか確認
- UIManagerの設定を確認

## 5. 次のステップ

プレースホルダーでの動作確認が完了したら：
1. タイトル・ホーム画面の実装
2. 遺物ショップの実装
3. 画像生成クォータリセット後、正式なスプライトに差し替え
