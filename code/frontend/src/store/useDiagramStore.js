import { create } from 'zustand';

const useDiagramStore = create((set) => ({
  actors: [],
  useCases: [],
  relations: [],
  drawingMode: 'auto', // 'auto', 'actor-uc', 'include', 'extends', 'actor-generalization'

  setDrawingMode: (mode) => set({ drawingMode: mode }),

  loadData: (data) => set({
    actors: data.actors || [],
    useCases: data.useCases || [],
    relations: data.relations || [],
    drawingMode: 'auto'
  }),

  reset: () => set({
    actors: [],
    useCases: [],
    relations: [],
    drawingMode: 'auto'
  }),

  addActor: (actor) => set((state) => ({
    actors: [...state.actors, actor]
  })),

  updateActor: (id, updatedData) => set((state) => ({
    actors: state.actors.map((actor) => 
      actor.id.toString() === id.toString() ? { ...actor, ...updatedData } : actor
    )
  })),

  removeActor: (id) => {
    const rawId = id.toString().replace('actor_', '');
    const fullId = `actor_${rawId}`;
    return set((state) => ({
      actors: state.actors.filter((actor) => actor.id.toString() !== rawId && actor.id.toString() !== fullId),
      relations: state.relations.filter(
        (rel) => rel.sourceId.toString() !== rawId && rel.targetId.toString() !== rawId && rel.sourceId.toString() !== fullId && rel.targetId.toString() !== fullId
      )
    }));
  },

  addUseCase: (useCase) => set((state) => ({
    useCases: [...state.useCases, useCase]
  })),

  updateUseCase: (id, updatedData) => set((state) => ({
    useCases: state.useCases.map((uc) => 
      uc.id.toString() === id.toString() ? { ...uc, ...updatedData } : uc
    )
  })),

  removeUseCase: (id) => set((state) => ({
    useCases: state.useCases.filter((uc) => uc.id.toString() !== id.toString()),
    relations: state.relations.filter(
      (rel) => rel.sourceId.toString() !== id.toString() && rel.targetId.toString() !== id.toString()
    )
  })),

  addRelation: (relation) => set((state) => ({
    relations: [...state.relations, {
      ...relation,
      sourceHandle: relation.sourceHandle || null,
      targetHandle: relation.targetHandle || null
    }]
  })),

  removeRelation: (id) => set((state) => ({
    relations: state.relations.filter((rel) => rel.id.toString() !== id.toString())
  })),

  updateRelation: (id, updatedData) => set((state) => ({
    relations: state.relations.map((rel) => 
      rel.id.toString() === id.toString() ? { ...rel, ...updatedData } : rel
    )
  })),

  updateIds: (idMappings) => set((state) => {
    if (!idMappings || Object.keys(idMappings).length === 0) return state;

    return {
      idMappings,
      actors: state.actors.map(actor => ({
        ...actor,
        id: idMappings[actor.id] ? idMappings[actor.id].replace('actor_', '') : actor.id
      })),
      useCases: state.useCases.map(uc => ({
        ...uc,
        id: idMappings[uc.id] || uc.id
      })),
      relations: state.relations.map(rel => ({
        ...rel,
        sourceId: idMappings[rel.sourceId] ? idMappings[rel.sourceId].replace('actor_', '') : rel.sourceId,
        targetId: idMappings[rel.targetId] || rel.targetId
      }))
    };
  })
}));

export default useDiagramStore;
