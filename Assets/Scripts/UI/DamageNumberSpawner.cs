using UnityEngine;

public class DamageNumberSpawner : MonoBehaviour
{
    public static DamageNumberSpawner Instance { get; private set; }

    [SerializeField] private DamageNumber damageNumberPrefab;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void SpawnDamageNumber(Vector3 position, float damageAmount)
    {
        if (damageNumberPrefab != null)
        {
            DamageNumber damageNumber = Instantiate(damageNumberPrefab, position, Quaternion.identity);
            damageNumber.Setup(damageAmount);
        }
    }
}
