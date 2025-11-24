using UnityEngine;

public class Pickup : MonoBehaviour
{
    [SerializeField] private int energyAmount = 1;
    [SerializeField] private float magnetRange = 3f;
    [SerializeField] private float moveSpeed = 8f;

    private Transform target;
    private bool isMagnetized = false;

    private void Update()
    {
        if (target == null)
        {
            CheckForPlayer();
        }
        else
        {
            MoveToTarget();
        }
    }

    private void CheckForPlayer()
    {
        // Simple optimization: only check every few frames or use Physics.Overlap
        Collider2D[] colliders = Physics2D.OverlapCircleAll(transform.position, magnetRange);
        foreach (var col in colliders)
        {
            if (col.CompareTag("Player"))
            {
                target = col.transform;
                isMagnetized = true;
                break;
            }
        }
    }

    private void MoveToTarget()
    {
        transform.position = Vector3.MoveTowards(transform.position, target.position, moveSpeed * Time.deltaTime);
        
        if (Vector3.Distance(transform.position, target.position) < 0.5f)
        {
            Collect();
        }
    }

    private void Collect()
    {
        ResourceManager.Instance.AddEnergy(energyAmount);
        Destroy(gameObject);
    }
}
