using UnityEngine;

public class MeleeWeapon : WeaponBase
{
    [SerializeField] private float attackDuration = 0.2f;
    [SerializeField] private Collider2D hitBox; // Assign child collider

    private void Awake()
    {
        if (hitBox != null) hitBox.enabled = false;
    }

    protected override bool TryAttack()
    {
        // For melee, we might just attack in facing direction or all around
        // Let's assume generic "Area Attack" for now
        StartCoroutine(PerformAttack());
        return true;
    }

    private System.Collections.IEnumerator PerformAttack()
    {
        if (hitBox != null) hitBox.enabled = true;
        
        // Visuals here

        yield return new WaitForSeconds(attackDuration);

        if (hitBox != null) hitBox.enabled = false;
    }

    private void OnTriggerEnter2D(Collider2D collision)
    {
        // This script should be on the object with the collider, or the collider calls back
        // If this script is on the parent, we need a way to detect trigger on child
        // Simplified: Assume this script is ON the weapon object which HAS the collider
        if (collision.CompareTag("Enemy"))
        {
            EnemyBase enemy = collision.GetComponent<EnemyBase>();
            if (enemy != null)
            {
                enemy.TakeDamage(damage);
            }
        }
    }
}
