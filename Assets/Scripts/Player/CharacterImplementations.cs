using UnityEngine;

// 1. Girl Character
public class Character_Girl : CharacterBase
{
    protected override void UseSkill()
    {
        Debug.Log("Girl Skill: Magic Burst!");
        // Implementation: Spawn an explosion prefab around player
    }
}

// 2. Cat Character
public class Character_Cat : CharacterBase
{
    protected override void UseSkill()
    {
        Debug.Log("Cat Skill: Zoomies! (Speed Boost)");
        // Implementation: Increase speed temporarily
        MoveSpeed *= 2f;
        Invoke("ResetSpeed", 3f);
    }

    private void ResetSpeed()
    {
        MoveSpeed /= 2f;
    }
}

// 3. Boy Character
public class Character_Boy : CharacterBase
{
    protected override void UseSkill()
    {
        Debug.Log("Boy Skill: Shield!");
        // Implementation: Invincibility for 3 seconds
    }
}

// 4. Dog Character
public class Character_Dog : CharacterBase
{
    protected override void UseSkill()
    {
        Debug.Log("Dog Skill: Bark! (Stun Enemies)");
        // Implementation: Find all enemies in range and stun them
    }
}
