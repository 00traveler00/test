using UnityEngine;
using UnityEngine.SceneManagement;
using System;

public enum GameState
{
    Title,
    Home,
    Gameplay,
    Pause,
    Result
}

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public GameState CurrentState { get; private set; }

    public event Action<GameState> OnStateChanged;

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

    private void Start()
    {
        // Initial state
        ChangeState(GameState.Title);
    }

    public void ChangeState(GameState newState)
    {
        CurrentState = newState;
        OnStateChanged?.Invoke(newState);

        switch (newState)
        {
            case GameState.Title:
                // Logic for Title
                break;
            case GameState.Home:
                // Logic for Home
                break;
            case GameState.Gameplay:
                Time.timeScale = 1f;
                break;
            case GameState.Pause:
                Time.timeScale = 0f;
                break;
            case GameState.Result:
                Time.timeScale = 1f; // Or 0 if we want to stop everything
                break;
        }
    }

    public void TogglePause()
    {
        if (CurrentState == GameState.Gameplay)
        {
            ChangeState(GameState.Pause);
        }
        else if (CurrentState == GameState.Pause)
        {
            ChangeState(GameState.Gameplay);
        }
    }

    public void StartGame()
    {
        ChangeState(GameState.Gameplay);
        SceneManager.LoadScene("GameScene"); // Assumes a scene named GameScene
    }

    public void ReturnToHome()
    {
        ChangeState(GameState.Home);
        SceneManager.LoadScene("HomeScene"); // Assumes a scene named HomeScene
    }
    
    public void GoToTitle()
    {
        ChangeState(GameState.Title);
        SceneManager.LoadScene("TitleScene");
    }

    public void OnBossDefeated()
    {
        Debug.Log("Level Complete!");
        // Logic to go to next map or return home
        // For now, let's just show Result screen
        ChangeState(GameState.Result);
        // SceneManager.LoadScene("ResultScene"); // If we have one
    }
}
