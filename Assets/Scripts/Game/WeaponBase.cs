using UnityEngine;

public abstract class WeaponBase : MonoBehaviour
{
    [Header("Weapon Stats")]
    [SerializeField] protected float damage = 10f;
    [SerializeField] protected float cooldown = 1f;
    [SerializeField] protected float range = 10f;

    protected float nextAttackTime;
    protected Transform playerTransform;

    protected virtual void Start()
    {
        playerTransform = transform.parent; // Assuming weapon is child of player
    }

    protected virtual void Update()
    {
        if (GameManager.Instance.CurrentState != GameState.Gameplay) return;

        if (Time.time >= nextAttackTime)
        {
            if (TryAttack())
            {
                nextAttackTime = Time.time + cooldown;
            }
        }
    }

    protected abstract bool TryAttack();

    protected Transform FindNearestEnemy()
    {
        GameObject[] enemies = GameObject.FindGameObjectsWithTag("Enemy");
        Transform nearest = null;
        float minDistance = Mathf.Infinity;

        foreach (GameObject enemy in enemies)
        {
            float distance = Vector2.Distance(playerTransform.position, enemy.transform.position);
            if (distance < minDistance && distance <= range)
            {
                minDistance = distance;
                nearest = enemy.transform;
            }
        }

        return nearest;
    }
}
