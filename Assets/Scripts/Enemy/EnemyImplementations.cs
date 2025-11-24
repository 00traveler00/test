using UnityEngine;

// 1. Slime (Low HP, Body Slam)
public class Enemy_Slime : EnemyBase
{
    protected override void Start()
    {
        base.Start();
        MaxHP = 20f;
        MoveSpeed = 3f;
        Damage = 5f;
        currentHP = MaxHP;
    }
}

// 2. Golem (High HP, Punch)
public class Enemy_Golem : EnemyBase
{
    protected override void Start()
    {
        base.Start();
        MaxHP = 100f;
        MoveSpeed = 1.5f;
        Damage = 15f;
        currentHP = MaxHP;
    }
}

// 3. Lizard (Fireball)
public class Enemy_Lizard : EnemyBase
{
    public GameObject FireballPrefab;
    public float AttackRange = 5f;
    public float AttackCooldown = 3f;
    private float attackTimer;

    protected override void Update()
    {
        base.Update();
        
        if (playerTransform == null) return;

        float dist = Vector2.Distance(transform.position, playerTransform.position);
        if (dist <= AttackRange)
        {
            attackTimer += Time.deltaTime;
            if (attackTimer >= AttackCooldown)
            {
                ShootFireball();
                attackTimer = 0f;
            }
        }
    }

    private void ShootFireball()
    {
        if (FireballPrefab != null)
        {
            GameObject fireball = Instantiate(FireballPrefab, transform.position, Quaternion.identity);
            Vector2 dir = (playerTransform.position - transform.position).normalized;
            fireball.GetComponent<Rigidbody2D>().velocity = dir * 5f;
        }
    }
}

// 4. Totem (Laser Beam)
public class Enemy_Totem : EnemyBase
{
    // Totem might be stationary or very slow
    protected override void Start()
    {
        base.Start();
        MoveSpeed = 0f; // Stationary
    }
    
    // Laser logic would go here (Raycast)
}
