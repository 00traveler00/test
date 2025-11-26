using UnityEngine;
using System.Collections.Generic;
using System.IO;

[System.Serializable]
public class PlayerData : ISerializationCallbackReceiver
{
    public int Money;
    public List<string> UnlockedCharacters = new List<string>();
    
    // Dictionary is not serializable by default, so we use a List of structs for serialization
    public Dictionary<string, int> CharacterLevels = new Dictionary<string, int>(); 

    [System.Serializable]
    public struct CharacterLevelData
    {
        public string CharacterId;
        public int Level;
    }

    public List<CharacterLevelData> _characterLevelsList = new List<CharacterLevelData>();

    public PlayerData()
    {
        Money = 0;
        UnlockedCharacters.Add("Girl"); // Default unlocked
    }

    public void OnBeforeSerialize()
    {
        _characterLevelsList.Clear();
        foreach (var kvp in CharacterLevels)
        {
            _characterLevelsList.Add(new CharacterLevelData { CharacterId = kvp.Key, Level = kvp.Value });
        }
    }

    public void OnAfterDeserialize()
    {
        CharacterLevels = new Dictionary<string, int>();
        foreach (var item in _characterLevelsList)
        {
            CharacterLevels[item.CharacterId] = item.Level;
        }
    }
}

public class SaveManager : MonoBehaviour
{
    public static SaveManager Instance { get; private set; }
    public PlayerData Data { get; private set; }

    private string saveFilePath;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            saveFilePath = Path.Combine(Application.persistentDataPath, "savegame.json");
            LoadGame();
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void SaveGame()
    {
        string json = JsonUtility.ToJson(Data, true);
        File.WriteAllText(saveFilePath, json);
        Debug.Log("Game Saved");
    }

    public void LoadGame()
    {
        if (File.Exists(saveFilePath))
        {
            string json = File.ReadAllText(saveFilePath);
            Data = JsonUtility.FromJson<PlayerData>(json);
        }
        else
        {
            Data = new PlayerData();
            SaveGame();
        }
        Debug.Log("Game Loaded: Money = " + Data.Money);
    }

    public void AddMoney(int amount)
    {
        Data.Money += amount;
        SaveGame();
    }

    public bool SpendMoney(int amount)
    {
        if (Data.Money >= amount)
        {
            Data.Money -= amount;
            SaveGame();
            return true;
        }
        return false;
    }
}
