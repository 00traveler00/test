using UnityEngine;

public abstract class CharacterBase : MonoBehaviour
{
    [Header("Stats")]
    public float MaxHP = 100f;
    public float CurrentHP { get; protected set; }
    public float MoveSpeed = 5f;
    public float PickupRange = 2f;

    [Header("Skill")]
    public float SkillCooldown = 5f;
    protected float currentCooldown = 0f;

    protected virtual void Start()
    {
        CurrentHP = MaxHP;
    }

    protected virtual void Update()
    {
        if (currentCooldown > 0)
        {
            currentCooldown -= Time.deltaTime;
        }
    }

    public virtual void TakeDamage(float amount)
    {
        CurrentHP -= amount;
        Debug.Log($"{gameObject.name} took {amount} damage. HP: {CurrentHP}");
        if (CurrentHP <= 0)
        {
            Die();
        }
    }

    protected virtual void Die()
    {
        Debug.Log($"{gameObject.name} Died!");
        // Notify GameManager to end run
        GameManager.Instance.ChangeState(GameState.Result);
    }

    public void TryUseSkill()
    {
        if (currentCooldown <= 0)
        {
            UseSkill();
            currentCooldown = SkillCooldown;
        }
    }

    protected abstract void UseSkill();
}
