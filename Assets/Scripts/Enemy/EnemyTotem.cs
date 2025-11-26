using UnityEngine;

public class EnemyTotem : EnemyBase
{
    [SerializeField] private float attackInterval = 3f;
    [SerializeField] private float beamDuration = 1f;
    [SerializeField] private LineRenderer lineRenderer; // Assign in inspector

    private float nextAttackTime;
    private bool isAttacking;

    protected override void Awake()
    {
        base.Awake();
        moveSpeed = 0f; // Stationary
        rb.bodyType = RigidbodyType2D.Static; // Or Kinematic if we want to push it
    }

    protected override void Move()
    {
        // Does not move
        if (target != null && !isAttacking)
        {
            if (Time.time >= nextAttackTime)
            {
                StartCoroutine(FireBeam());
            }
        }
    }

    private System.Collections.IEnumerator FireBeam()
    {
        isAttacking = true;
        Debug.Log("Totem firing beam!");
        
        // Visual warning or charge up could go here

        // Fire beam
        if (lineRenderer != null)
        {
            lineRenderer.enabled = true;
            lineRenderer.SetPosition(0, transform.position);
            lineRenderer.SetPosition(1, target.position); // Lock on at start of fire? or track?
        }

        // Deal damage logic (Raycast)
        RaycastHit2D hit = Physics2D.Raycast(transform.position, (target.position - transform.position).normalized, 20f);
        if (hit.collider != null && hit.collider.CompareTag("Player"))
        {
            hit.collider.GetComponent<PlayerStats>()?.TakeDamage(damage);
        }

        yield return new WaitForSeconds(beamDuration);

        if (lineRenderer != null)
        {
            lineRenderer.enabled = false;
        }

        isAttacking = false;
        nextAttackTime = Time.time + attackInterval;
    }
}
