import { description, digest, json, skill, skillZip } from '../../../edge/skill';

export const onRequestGet = async (ctx: Parameters<typeof skill>[0]) => {
  const [text, bytes] = await Promise.all([skill(ctx), skillZip(ctx)]);
  return json({
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'agentee',
        description: description(text),
        type: 'archive',
        url: '/.well-known/agent-skills/agentee.zip',
        digest: await digest(bytes),
      },
    ],
  });
};
