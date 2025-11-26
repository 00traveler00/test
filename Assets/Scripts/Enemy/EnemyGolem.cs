using UnityEngine;

public class EnemyGolem : EnemyBase
{
    protected override void Awake()
    {
        base.Awake();
        // Golem stats override
        maxHealth = 50f;
        moveSpeed = 1.5f;
        damage = 20f;
    }

    protected override void Move()
    {
        if (target == null) return;

        Vector2 direction = (target.position - transform.position).normalized;
        rb.velocity = direction * moveSpeed;
        
        // Flip sprite
        if (direction.x != 0)
        {
            transform.localScale = new Vector3(direction.x > 0 ? 1 : -1, 1, 1);
        }
    }
}
