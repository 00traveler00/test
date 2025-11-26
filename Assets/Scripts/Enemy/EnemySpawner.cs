using UnityEngine;
using System.Collections.Generic;

public class EnemySpawner : MonoBehaviour
{
    [System.Serializable]
    public class Wave
    {
        public string waveName;
        public List<EnemySpawnData> spawnData;
        public float duration;
    }

    [System.Serializable]
    public class EnemySpawnData
    {
        public GameObject enemyPrefab;
        public float spawnInterval;
    }

    public List<Wave> waves;
    public float spawnRadius = 10f; // Outside camera

    private int currentWaveIndex = 0;
    private float waveTimer;
    private Dictionary<GameObject, float> spawnTimers = new Dictionary<GameObject, float>();

    private Transform playerTransform;

    private void Start()
    {
        playerTransform = GameObject.FindGameObjectWithTag("Player")?.transform;
        if (waves.Count > 0)
        {
            InitializeWave(0);
        }
    }

    private void InitializeWave(int index)
    {
        currentWaveIndex = index;
        waveTimer = 0f;
        spawnTimers.Clear();

        if (index < waves.Count)
        {
            foreach (var data in waves[index].spawnData)
            {
                spawnTimers[data.enemyPrefab] = 0f;
            }
        }
    }

    private void Update()
    {
        if (GameManager.Instance.CurrentState != GameState.Gameplay) return;
        if (playerTransform == null) return;
        if (currentWaveIndex >= waves.Count) return; // All waves done

        waveTimer += Time.deltaTime;
        Wave currentWave = waves[currentWaveIndex];

        // Spawn enemies
        foreach (var data in currentWave.spawnData)
        {
            spawnTimers[data.enemyPrefab] -= Time.deltaTime;
            if (spawnTimers[data.enemyPrefab] <= 0)
            {
                SpawnEnemy(data.enemyPrefab);
                spawnTimers[data.enemyPrefab] = data.spawnInterval;
            }
        }

        // Check wave completion
        if (waveTimer >= currentWave.duration)
        {
            InitializeWave(currentWaveIndex + 1);
        }
    }

    private void SpawnEnemy(GameObject prefab)
    {
        Vector2 randomDir = Random.insideUnitCircle.normalized;
        Vector3 spawnPos = playerTransform.position + (Vector3)randomDir * spawnRadius;

        Instantiate(prefab, spawnPos, Quaternion.identity);
    }

    public void StopSpawning()
    {
        enabled = false; // Simple way to stop Update loop
        // Or set a flag if we want to keep Update running for other things
        Debug.Log("Enemy Spawning Stopped.");
    }
}
