using UnityEngine;
using UnityEngine.SceneManagement;

public class MapManager : MonoBehaviour
{
    public static MapManager Instance { get; private set; }

    public int CurrentMapIndex { get; private set; } = 1;
    public int MaxMaps = 3;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void CompleteMap()
    {
        if (CurrentMapIndex < MaxMaps)
        {
            CurrentMapIndex++;
            LoadMap(CurrentMapIndex);
        }
        else
        {
            // Map 3 Completed
            ShowLoopOrReturnChoice();
        }
    }

    private void LoadMap(int index)
    {
        string sceneName = $"Map{index}";
        SceneManager.LoadScene(sceneName);
    }

    private void ShowLoopOrReturnChoice()
    {
        Debug.Log("Map 3 Cleared! Loop or Return?");
        // Trigger UI for choice
        // If Loop: CurrentMapIndex = 1; LoadMap(1); Difficulty++;
        // If Return: GameManager.Instance.ChangeState(GameState.Result);
    }
}
