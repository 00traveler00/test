using UnityEngine;

public class BossAltar : MonoBehaviour
{
    [SerializeField] private GameObject bossPrefab;
    [SerializeField] private float interactionRange = 2f;

    private bool isActivated = false;
    private Transform playerTransform;

    private void Start()
    {
        playerTransform = GameObject.FindGameObjectWithTag("Player")?.transform;
    }

    private void Update()
    {
        if (isActivated || playerTransform == null) return;

        if (Vector2.Distance(transform.position, playerTransform.position) <= interactionRange)
        {
            // Check for interaction input (e.g., Button press or just proximity for now)
            // For simplicity, let's say "Space" or UI button. 
            // Since we have mobile, maybe a UI button appears? 
            // Or just proximity with a delay?
            // Let's use a simple "Click" on the object for now if it has a collider, 
            // or just KeyCode.E for testing.
            
            if (Input.GetKeyDown(KeyCode.E)) 
            {
                ActivateAltar();
            }
        }
    }

    // Call this from a UI Button for mobile support
    public void ActivateAltar()
    {
        if (isActivated) return;
        isActivated = true;

        Debug.Log("Boss Altar Activated!");

        // Stop Spawning regular enemies
        EnemySpawner spawner = FindObjectOfType<EnemySpawner>();
        if (spawner != null)
        {
            spawner.StopSpawning();
        }

        // Spawn Boss
        if (bossPrefab != null)
        {
            Instantiate(bossPrefab, transform.position + Vector3.up * 2, Quaternion.identity);
        }

        // Disable Altar visual or destroy
        // Destroy(gameObject); 
        GetComponent<SpriteRenderer>().color = Color.gray; // Visual feedback
    }
    
    // Draw range in editor
    private void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(transform.position, interactionRange);
    }
}
