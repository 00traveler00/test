using UnityEngine;
using UnityEngine.UI; // For Health Bar if we add it later

public class BossEnemy : EnemyBase
{
    [Header("Boss Specifics")]
    [SerializeField] private string bossName = "Deca Boss";
    
    protected override void Awake()
    {
        base.Awake();
        // Scale up stats for Boss
        maxHealth *= 10;
        damage *= 2;
        transform.localScale *= 2f; // Make it big!
    }

    protected override void Start()
    {
        base.Start();
        // Notify UI that boss appeared?
        Debug.Log($"Boss {bossName} Appeared!");
    }

    protected override void Move()
    {
        // Basic chase for now, can be overridden by specific boss types
        if (target == null) return;

        Vector2 direction = (target.position - transform.position).normalized;
        rb.velocity = direction * moveSpeed;
        
        if (direction.x != 0)
        {
            transform.localScale = new Vector3(Mathf.Abs(transform.localScale.x) * (direction.x > 0 ? 1 : -1), transform.localScale.y, transform.localScale.z);
        }
    }

    protected override void Die()
    {
        Debug.Log($"Boss {bossName} Defeated!");
        
        // Drop huge energy?
        base.Die();

        // Trigger Level Complete
        GameManager.Instance.OnBossDefeated();
    }
}
