using UnityEngine;

[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(PlayerStats))]
public class PlayerController : MonoBehaviour
{
    private Rigidbody2D rb;
    private PlayerStats stats;
    private Vector2 movementInput;

    private void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
        stats = GetComponent<PlayerStats>();
    }

    private void Update()
    {
        if (GameManager.Instance.CurrentState != GameState.Gameplay)
        {
            movementInput = Vector2.zero;
            return;
        }

        movementInput = InputManager.Instance.GetMovementInput();
        
        // Flip sprite based on movement direction
        if (movementInput.x != 0)
        {
            transform.localScale = new Vector3(movementInput.x > 0 ? 1 : -1, 1, 1);
        }
    }

    private void FixedUpdate()
    {
        if (GameManager.Instance.CurrentState != GameState.Gameplay)
        {
            rb.velocity = Vector2.zero;
            return;
        }

        rb.velocity = movementInput * stats.MoveSpeed;
    }

    private void OnTriggerEnter2D(Collider2D collision)
    {
        // Handle collisions with pickups, etc.
        if (collision.CompareTag("Pickup"))
        {
            // Pickup logic
        }
    }
}
