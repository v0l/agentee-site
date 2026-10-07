import { description, digest, json, skill } from '../../../edge/skill';

export const onRequestGet = async (ctx: Parameters<typeof skill>[0]) => {
  const text = await skill(ctx);
  return json({
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'agentee',
        description: description(text),
        type: 'skill-md',
        url: '/.well-known/agent-skills/agentee/SKILL.md',
        digest: await digest(text),
      },
    ],
  });
};
