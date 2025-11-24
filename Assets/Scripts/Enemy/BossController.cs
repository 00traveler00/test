using UnityEngine;

public class BossController : EnemyBase
{
    public string BossName;
    public bool IsDefeated { get; private set; }

    protected override void Die()
    {
        IsDefeated = true;
        Debug.Log($"Boss {BossName} Defeated!");
        
        // Show portal or UI to go to next map
        // For now, just log it
        
        base.Die();
    }
}
