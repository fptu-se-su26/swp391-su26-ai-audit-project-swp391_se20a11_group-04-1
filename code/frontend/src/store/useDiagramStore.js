import { create } from 'zustand';

const useDiagramStore = create((set) => ({
  actors: [],
  useCases: [],
  relations: [],

  loadData: (data) => set({
    actors: data.actors || [],
    useCases: data.useCases || [],
    relations: data.relations || []
  }),

  addActor: (actor) => set((state) => ({
    actors: [...state.actors, actor]
  })),

  updateActor: (id, updatedData) => set((state) => ({
    actors: state.actors.map((actor) => 
      actor.id.toString() === id.toString() ? { ...actor, ...updatedData } : actor
    )
  })),

  removeActor: (id) => set((state) => ({
    actors: state.actors.filter((actor) => actor.id.toString() !== id.toString()),
    relations: state.relations.filter(
      (rel) => rel.sourceId.toString() !== id.toString() && rel.targetId.toString() !== id.toString()
    )
  })),

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
    relations: [...state.relations, relation]
  })),

  removeRelation: (id) => set((state) => ({
    relations: state.relations.filter((rel) => rel.id.toString() !== id.toString())
  }))
}));

export default useDiagramStore;
