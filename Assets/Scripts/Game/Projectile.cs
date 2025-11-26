using UnityEngine;

public class Projectile : MonoBehaviour
{
    [SerializeField] private float speed = 10f;
    [SerializeField] private float lifeTime = 5f;
    
    private float damage;
    private Vector2 direction;

    public void Initialize(Vector2 dir, float dmg)
    {
        direction = dir.normalized;
        damage = dmg;
        Destroy(gameObject, lifeTime);
        
        // Rotate towards direction
        float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg;
        transform.rotation = Quaternion.AngleAxis(angle, Vector3.forward);
    }

    private void Update()
    {
        transform.Translate(Vector3.right * speed * Time.deltaTime);
    }

    private void OnTriggerEnter2D(Collider2D collision)
    {
        if (collision.CompareTag("Enemy"))
        {
            EnemyBase enemy = collision.GetComponent<EnemyBase>();
            if (enemy != null)
            {
                enemy.TakeDamage(damage);
                Destroy(gameObject); // Destroy projectile on hit
            }
        }
    }
}
