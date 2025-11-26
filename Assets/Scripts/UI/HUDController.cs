using UnityEngine;
using UnityEngine.UI;
using TMPro; // Assuming TextMeshPro is used, if not, standard Text

public class HUDController : MonoBehaviour
{
    [Header("UI Elements")]
    [SerializeField] private Slider healthBar;
    [SerializeField] private Slider energyBar;
    [SerializeField] private TextMeshProUGUI levelText;
    [SerializeField] private TextMeshProUGUI energyText;

    private PlayerStats playerStats;

    private void Start()
    {
        // Find player stats
        GameObject player = GameObject.FindGameObjectWithTag("Player");
        if (player != null)
        {
            playerStats = player.GetComponent<PlayerStats>();
            if (playerStats != null)
            {
                playerStats.OnHealthChanged += UpdateHealth;
                playerStats.OnLevelUp += UpdateLevel;
                
                // Init values
                healthBar.maxValue = playerStats.MaxHealth;
                healthBar.value = playerStats.CurrentHealth;
                UpdateLevel(playerStats.Level);
            }
        }

        if (ResourceManager.Instance != null)
        {
            ResourceManager.Instance.OnEnergyChanged += UpdateEnergy;
            UpdateEnergy(ResourceManager.Instance.CurrentEnergy);
        }
    }

    private void OnDestroy()
    {
        if (playerStats != null)
        {
            playerStats.OnHealthChanged -= UpdateHealth;
            playerStats.OnLevelUp -= UpdateLevel;
        }

        if (ResourceManager.Instance != null)
        {
            ResourceManager.Instance.OnEnergyChanged -= UpdateEnergy;
        }
    }

    private void UpdateHealth(float currentHealth)
    {
        if (healthBar != null)
        {
            healthBar.value = currentHealth;
        }
    }

    private void UpdateEnergy(int currentEnergy)
    {
        if (energyText != null)
        {
            energyText.text = $"Energy: {currentEnergy}";
        }
        
        // If we had an XP bar logic, we'd update energyBar here too
        // For now, let's assume energyBar is XP to next level
        if (playerStats != null && energyBar != null)
        {
            energyBar.maxValue = playerStats.ExperienceToNextLevel;
            energyBar.value = playerStats.CurrentExperience;
        }
    }

    private void UpdateLevel(int level)
    {
        if (levelText != null)
        {
            levelText.text = $"Lv. {level}";
        }
    }
}
