using UnityEngine;
using TMPro;

public class ResultScreen : MonoBehaviour
{
    [Header("UI Elements")]
    [SerializeField] private TextMeshProUGUI titleText;
    [SerializeField] private TextMeshProUGUI relicsCollectedText;
    [SerializeField] private TextMeshProUGUI moneyEarnedText;

    private void OnEnable()
    {
        UpdateResults();
    }

    private void UpdateResults()
    {
        // Check if player won or lost
        bool isVictory = GameManager.Instance.CurrentState == GameState.Result;
        
        if (titleText != null)
        {
            titleText.text = isVictory ? "ステージクリア！" : "ゲームオーバー";
        }

        // Calculate money from relics
        int relicsCollected = 0;
        int moneyEarned = 0;

        if (ResourceManager.Instance != null)
        {
            relicsCollected = ResourceManager.Instance.CollectedRelics.Count;
            // Simple formula: Each relic = 100 money
            moneyEarned = relicsCollected * 100;
            
            // Add to player's persistent money
            if (SaveManager.Instance != null)
            {
                SaveManager.Instance.AddMoney(moneyEarned);
            }
        }

        if (relicsCollectedText != null)
        {
            relicsCollectedText.text = $"遺物収集: {relicsCollected}";
        }

        if (moneyEarnedText != null)
        {
            moneyEarnedText.text = $"獲得金額: {moneyEarned}";
        }
    }
}
