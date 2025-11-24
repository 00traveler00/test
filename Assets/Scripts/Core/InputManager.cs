using UnityEngine;

public class InputManager : MonoBehaviour
{
    public static InputManager Instance { get; private set; }

    [SerializeField] private VirtualJoystick virtualJoystick;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public Vector2 GetMovementInput()
    {
        Vector2 input = Vector2.zero;

        // Keyboard Input
        input.x = Input.GetAxisRaw("Horizontal");
        input.y = Input.GetAxisRaw("Vertical");

        // Virtual Joystick Input (Override if active)
        if (virtualJoystick != null && virtualJoystick.InputVector != Vector2.zero)
        {
            input = virtualJoystick.InputVector;
        }

        return input.normalized;
    }

    public void SetVirtualJoystick(VirtualJoystick joystick)
    {
        this.virtualJoystick = joystick;
    }
}
