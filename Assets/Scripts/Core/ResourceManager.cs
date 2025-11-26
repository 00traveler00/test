using UnityEngine;
using System;
using System.Collections.Generic;

public class ResourceManager : MonoBehaviour
{
    public static ResourceManager Instance { get; private set; }

    public int CurrentEnergy { get; private set; }
    public List<string> CollectedRelics { get; private set; } = new List<string>();

    public event Action<int> OnEnergyChanged;
    public event Action<string> OnRelicObtained;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            // Note: ResourceManager might be reset per run, so maybe not DontDestroyOnLoad if attached to a GameScene object.
            // But for simplicity, let's make it global and reset it manually.
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void StartRun()
    {
        CurrentEnergy = 0;
        CollectedRelics.Clear();
        OnEnergyChanged?.Invoke(CurrentEnergy);
    }

    public void AddEnergy(int amount)
    {
        CurrentEnergy += amount;
        OnEnergyChanged?.Invoke(CurrentEnergy);
    }

    public bool SpendEnergy(int amount)
    {
        if (CurrentEnergy >= amount)
        {
            CurrentEnergy -= amount;
            OnEnergyChanged?.Invoke(CurrentEnergy);
            return true;
        }
        return false;
    }

    public void AddRelic(string relicId)
    {
        CollectedRelics.Add(relicId);
        OnRelicObtained?.Invoke(relicId);
        Debug.Log($"Relic Obtained: {relicId}");
    }
}
