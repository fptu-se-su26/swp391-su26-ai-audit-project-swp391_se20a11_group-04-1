import plantumlEncoder from 'plantuml-encoder';

export const generatePlantUMLUrl = (useCases, systemName = "System") => {
  if (!useCases || useCases.length === 0) return null;

  let puml = '@startuml\n';
  puml += 'left to right direction\n';
  
  // Custom styling requested
  puml += 'skinparam ActorBorderColor #185FA5\n';
  puml += 'skinparam ActorFontColor #111827\n';
  puml += 'skinparam UsecaseBorderColor #185FA5\n';
  puml += 'skinparam UsecaseFontColor #111827\n';
  puml += 'skinparam UsecaseBackgroundColor #F8FAFC\n'; // slate-50
  puml += 'skinparam ArrowColor #64748B\n'; // slate-500
  puml += 'skinparam BackgroundColor transparent\n';
  puml += 'skinparam RectangleBorderColor #CBD5E1\n'; // slate-300
  puml += 'skinparam RectangleFontColor #334155\n'; // slate-700
  puml += 'skinparam packageStyle rectangle\n';
  
  // Track all actors
  const allActors = new Set();
  useCases.forEach(uc => {
    if (uc.actors && Array.isArray(uc.actors)) {
      uc.actors.forEach(actor => {
        if (typeof actor === 'string' && actor.trim() !== '') {
          allActors.add(actor.trim());
        }
      });
    }
  });

  // Divide Actors Left and Right
  const actorArray = Array.from(allActors);
  const leftActors = new Set();
  const rightActors = new Set();
  
  actorArray.forEach((actor, index) => {
    const safeActorId = actor.replace(/[^a-zA-Z0-9]/g, '') || 'Actor' + Math.floor(Math.random()*1000);
    puml += `actor "${actor}" as ${safeActorId}\n`;
    if (index % 2 === 0) {
      leftActors.add(actor.trim());
    } else {
      rightActors.add(actor.trim());
    }
  });

  // System Boundary
  const safeSystemName = systemName.replace(/"/g, '');
  puml += `package "${safeSystemName}" {\n`;

  // Group UCs by Actor
  const ucGroups = { shared: [] };
  allActors.forEach(a => ucGroups[a] = []);

  useCases.forEach(uc => {
    const uActors = (uc.actors || []).map(a => typeof a === 'string' ? a.trim() : '');
    if (uActors.length === 1 && allActors.has(uActors[0])) {
      ucGroups[uActors[0]].push(uc);
    } else {
      ucGroups.shared.push(uc);
    }
  });

  // Render left actor zones
  leftActors.forEach(actor => {
    if (ucGroups[actor].length > 0) {
      const zoneId = actor.replace(/[^a-zA-Z0-9]/g, '') + 'Zone';
      puml += `  rectangle "${actor} Use Cases" as ${zoneId} {\n`;
      ucGroups[actor].forEach(uc => {
        puml += `    usecase "${(uc.name || 'Untitled').replace(/"/g, "'")}" as UC_${uc.id}\n`;
      });
      puml += `  }\n`;
    }
  });

  // Render shared zone
  if (ucGroups.shared.length > 0) {
    puml += `  rectangle "Shared Use Cases" as SharedZone {\n`;
    ucGroups.shared.forEach(uc => {
      puml += `    usecase "${(uc.name || 'Untitled').replace(/"/g, "'")}" as UC_${uc.id}\n`;
    });
    puml += `  }\n`;
  }

  // Render right actor zones
  rightActors.forEach(actor => {
    if (ucGroups[actor].length > 0) {
      const zoneId = actor.replace(/[^a-zA-Z0-9]/g, '') + 'Zone';
      puml += `  rectangle "${actor} Use Cases" as ${zoneId} {\n`;
      ucGroups[actor].forEach(uc => {
        puml += `    usecase "${(uc.name || 'Untitled').replace(/"/g, "'")}" as UC_${uc.id}\n`;
      });
      puml += `  }\n`;
    }
  });

  puml += `}\n`; // end system package

  // Force Layout with hidden links between the USE CASES to guarantee L -> C -> R
  // Linking packages directly often gets ignored by Graphviz. Linking the nodes inside forces the rank.
  const getFirstUc = (actor) => ucGroups[actor].length > 0 ? `UC_${ucGroups[actor][0].id}` : null;
  const sharedFirst = ucGroups.shared.length > 0 ? `UC_${ucGroups.shared[0].id}` : null;

  leftActors.forEach(la => {
    const leftUc = getFirstUc(la);
    if (!leftUc) return;

    if (sharedFirst) {
      puml += `${leftUc} -[hidden]-> ${sharedFirst}\n`;
    }

    rightActors.forEach(ra => {
      const rightUc = getFirstUc(ra);
      if (!rightUc) return;

      if (sharedFirst) {
        puml += `${sharedFirst} -[hidden]-> ${rightUc}\n`;
      } else {
        puml += `${leftUc} -[hidden]-> ${rightUc}\n`;
      }
    });
  });

  // Draw Relationships
  useCases.forEach(uc => {
    if (uc.actors && Array.isArray(uc.actors)) {
      uc.actors.forEach(actor => {
        if (typeof actor === 'string' && actor.trim() !== '') {
          const safeActorId = actor.trim().replace(/[^a-zA-Z0-9]/g, '') || 'Actor' + Math.floor(Math.random()*1000);
          
          if (leftActors.has(actor.trim())) {
            puml += `${safeActorId} -- UC_${uc.id}\n`;
          } else {
            // Placing UC first forces the actor to the right side
            puml += `UC_${uc.id} -- ${safeActorId}\n`;
          }
        }
      });
    }

    if (uc.includes && uc.includes.length > 0) {
      uc.includes.forEach(incCode => {
        const targetUc = useCases.find(u => u.code === incCode || u.name === incCode);
        if (targetUc) {
          puml += `UC_${uc.id} .> UC_${targetUc.id} : <<include>>\n`;
        }
      });
    }
    if (uc.extendsList && uc.extendsList.length > 0) {
      uc.extendsList.forEach(extCode => {
        const targetUc = useCases.find(u => u.code === extCode || u.name === extCode);
        if (targetUc) {
          puml += `UC_${uc.id} .> UC_${targetUc.id} : <<extend>>\n`;
        }
      });
    }
  });

  puml += '@enduml';

  const encoded = plantumlEncoder.encode(puml);
  return `http://www.plantuml.com/plantuml/svg/${encoded}`;
};

