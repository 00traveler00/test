using UnityEngine;
using System;

[RequireComponent(typeof(Rigidbody2D))]
public abstract class EnemyBase : MonoBehaviour
{
    [Header("Stats")]
    [SerializeField] protected float maxHealth = 10f;
    [SerializeField] protected float moveSpeed = 3f;
    [SerializeField] protected float damage = 10f;
    [SerializeField] protected GameObject pickupPrefab; // Assign Energy Gem prefab

    protected float currentHealth;
    protected Transform target;
    protected Rigidbody2D rb;

    public event Action<EnemyBase> OnDeath;

    protected virtual void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
    }

    protected virtual void OnEnable()
    {
        currentHealth = maxHealth;
        FindTarget();
    }

    protected virtual void Update()
    {
        if (target == null)
        {
            FindTarget();
            return;
        }

        Move();
    }

    protected virtual void FindTarget()
    {
        // Find player (assuming Player tag or singleton)
        // For now, finding by tag "Player"
        GameObject player = GameObject.FindGameObjectWithTag("Player");
        if (player != null)
        {
            target = player.transform;
        }
    }

    protected abstract void Move();

    public virtual void TakeDamage(float amount)
    {
        currentHealth -= amount;
        
        // Spawn damage number
        if (DamageNumberSpawner.Instance != null)
        {
            DamageNumberSpawner.Instance.SpawnDamageNumber(transform.position, amount);
        }
        
        if (currentHealth <= 0)
        {
            Die();
        }
    }

    protected virtual void Die()
    {
        if (pickupPrefab != null)
        {
            Instantiate(pickupPrefab, transform.position, Quaternion.identity);
        }
        
        OnDeath?.Invoke(this);
        Destroy(gameObject); // Or return to pool
    }

    protected virtual void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.gameObject.CompareTag("Player"))
        {
            PlayerStats playerStats = collision.gameObject.GetComponent<PlayerStats>();
            if (playerStats != null)
            {
                playerStats.TakeDamage(damage);
            }
        }
    }
}
