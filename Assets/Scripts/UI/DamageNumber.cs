using UnityEngine;
using TMPro;

public class DamageNumber : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 1f;
    [SerializeField] private float fadeSpeed = 1f;
    [SerializeField] private float lifeTime = 1f;
    
    private TextMeshPro textMesh;
    private Color textColor;
    private float timer;

    private void Awake()
    {
        textMesh = GetComponent<TextMeshPro>();
        if (textMesh == null)
        {
            // Try TMProUGUI if it's on Canvas, but usually World Space uses TextMeshPro
            textMesh = GetComponentInChildren<TextMeshPro>();
        }
        
        if (textMesh != null)
        {
            textColor = textMesh.color;
        }
    }

    public void Setup(float damageAmount)
    {
        if (textMesh != null)
        {
            textMesh.text = Mathf.RoundToInt(damageAmount).ToString();
        }
        Destroy(gameObject, lifeTime);
    }

    private void Update()
    {
        transform.position += Vector3.up * moveSpeed * Time.deltaTime;

        if (textMesh != null)
        {
            timer += Time.deltaTime;
            float alpha = Mathf.Lerp(1f, 0f, timer / lifeTime);
            textMesh.color = new Color(textColor.r, textColor.g, textColor.b, alpha);
        }
    }
}
