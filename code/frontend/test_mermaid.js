const useCases = [
  { id: 1, code: 'UC1', name: 'Test', actors: ['Admin'] }
];
let mermaidCode = 'flowchart LR\n';
const allActors = new Set();
useCases.forEach(uc => {
  if (uc.actors) uc.actors.forEach(a => allActors.add(a));
});
allActors.forEach(actor => {
  const safeActorId = actor.replace(/[^a-zA-Z0-9]/g, '');
  mermaidCode += '  ' + safeActorId + '((( \"' + actor + '\" )))\n';
  mermaidCode += '  class ' + safeActorId + ' actorStyle\n';
});
mermaidCode += '  subgraph System\n';
useCases.forEach(uc => {
  mermaidCode += '    UC_' + uc.id + '([\"' + uc.code + ': ' + uc.name + '\"])\n';
});
mermaidCode += '  end\n';
useCases.forEach(uc => {
  if (uc.actors) {
    uc.actors.forEach(actor => {
      const safeActorId = actor.replace(/[^a-zA-Z0-9]/g, '');
      mermaidCode += '  ' + safeActorId + ' --- UC_' + uc.id + '\n';
    });
  }
});
mermaidCode += '\n  classDef actorStyle fill:#2c3e50,stroke:#34495e,color:#ecf0f1,stroke-width:2px\n';
console.log(mermaidCode);
