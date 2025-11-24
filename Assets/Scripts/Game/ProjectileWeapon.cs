using UnityEngine;

public class ProjectileWeapon : WeaponBase
{
    [SerializeField] private Projectile projectilePrefab;

    protected override bool TryAttack()
    {
        Transform target = FindNearestEnemy();
        if (target != null)
        {
            Vector2 direction = target.position - playerTransform.position;
            Projectile proj = Instantiate(projectilePrefab, playerTransform.position, Quaternion.identity);
            proj.Initialize(direction, damage);
            return true;
        }
        return false;
    }
}
