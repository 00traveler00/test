using UnityEngine;

public class UIManager : MonoBehaviour
{
    public static UIManager Instance { get; private set; }

    [Header("Screens")]
    [SerializeField] private GameObject hudScreen;
    [SerializeField] private GameObject pauseScreen;
    [SerializeField] private GameObject resultScreen;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void Start()
    {
        // Subscribe to state changes
        if (GameManager.Instance != null)
        {
            GameManager.Instance.OnStateChanged += OnGameStateChanged;
        }

        // Initial state
        ShowHUD();
    }

    private void OnDestroy()
    {
        if (GameManager.Instance != null)
        {
            GameManager.Instance.OnStateChanged -= OnGameStateChanged;
        }
    }

    private void OnGameStateChanged(GameState newState)
    {
        switch (newState)
        {
            case GameState.Gameplay:
                ShowHUD();
                break;
            case GameState.Pause:
                ShowPause();
                break;
            case GameState.Result:
                ShowResult();
                break;
            default:
                HideAll();
                break;
        }
    }

    private void ShowHUD()
    {
        HideAll();
        if (hudScreen != null) hudScreen.SetActive(true);
    }

    private void ShowPause()
    {
        if (pauseScreen != null) pauseScreen.SetActive(true);
    }

    private void ShowResult()
    {
        HideAll();
        if (resultScreen != null) resultScreen.SetActive(true);
    }

    private void HideAll()
    {
        if (hudScreen != null) hudScreen.SetActive(false);
        if (pauseScreen != null) pauseScreen.SetActive(false);
        if (resultScreen != null) resultScreen.SetActive(false);
    }

    // Button callbacks
    public void OnResumeButton()
    {
        GameManager.Instance.TogglePause();
    }

    public void OnRestartButton()
    {
        GameManager.Instance.StartGame();
    }

    public void OnHomeButton()
    {
        GameManager.Instance.ReturnToHome();
    }

    public void OnPauseButton()
    {
        GameManager.Instance.TogglePause();
    }
}
