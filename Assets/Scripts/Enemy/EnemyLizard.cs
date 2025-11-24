using UnityEngine;

public class EnemyLizard : EnemyBase
{
    [SerializeField] private float attackRange = 5f;
    [SerializeField] private float fireRate = 2f;
    [SerializeField] private GameObject projectilePrefab; // Assign in inspector

    private float nextFireTime;

    protected override void Move()
    {
        if (target == null) return;

        float distance = Vector2.Distance(transform.position, target.position);

        if (distance > attackRange)
        {
            Vector2 direction = (target.position - transform.position).normalized;
            rb.velocity = direction * moveSpeed;
             // Flip sprite
            if (direction.x != 0)
            {
                transform.localScale = new Vector3(direction.x > 0 ? 1 : -1, 1, 1);
            }
        }
        else
        {
            rb.velocity = Vector2.zero;
            Attack();
        }
    }

    private void Attack()
    {
        if (Time.time >= nextFireTime)
        {
            // Fire projectile logic here
            Debug.Log("Lizard fires fireball!");
            // Instantiate(projectilePrefab, transform.position, Quaternion.identity);
            nextFireTime = Time.time + fireRate;
        }
    }
}
