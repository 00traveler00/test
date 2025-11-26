using UnityEngine;
using System;

public class PlayerStats : MonoBehaviour
{
    [Header("Base Stats")]
    public float MaxHealth = 100f;
    public float MoveSpeed = 5f;
    public float PickupRange = 2f;
    public float DamageMultiplier = 1f;

    [Header("Current State")]
    public float CurrentHealth;
    public int Level = 1;
    public float CurrentExperience = 0f;
    public float ExperienceToNextLevel = 100f;

    public event Action<float> OnHealthChanged;
    public event Action<int> OnLevelUp;

    private void Start()
    {
        CurrentHealth = MaxHealth;
        OnHealthChanged?.Invoke(CurrentHealth);
    }

    public void TakeDamage(float amount)
    {
        CurrentHealth -= amount;
        OnHealthChanged?.Invoke(CurrentHealth);

        if (CurrentHealth <= 0)
        {
            Die();
        }
    }

    public void Heal(float amount)
    {
        CurrentHealth = Mathf.Min(CurrentHealth + amount, MaxHealth);
        OnHealthChanged?.Invoke(CurrentHealth);
    }

    public void AddExperience(float amount)
    {
        CurrentExperience += amount;
        if (CurrentExperience >= ExperienceToNextLevel)
        {
            LevelUp();
        }
    }

    private void LevelUp()
    {
        Level++;
        CurrentExperience -= ExperienceToNextLevel;
        ExperienceToNextLevel *= 1.2f; // Increase requirement by 20%
        OnLevelUp?.Invoke(Level);
        
        // Restore some health on level up?
        Heal(MaxHealth * 0.1f);
    }

    private void Die()
    {
        Debug.Log("Player Died");
        GameManager.Instance.ChangeState(GameState.Result);
    }
}
