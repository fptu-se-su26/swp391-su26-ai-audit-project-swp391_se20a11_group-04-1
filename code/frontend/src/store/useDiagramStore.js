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
      actor.id === id ? { ...actor, ...updatedData } : actor
    )
  })),

  removeActor: (id) => set((state) => ({
    actors: state.actors.filter((actor) => actor.id !== id),
    relations: state.relations.filter(
      (rel) => rel.sourceId !== id && rel.targetId !== id
    )
  })),

  addUseCase: (useCase) => set((state) => ({
    useCases: [...state.useCases, useCase]
  })),

  updateUseCase: (id, updatedData) => set((state) => ({
    useCases: state.useCases.map((uc) => 
      uc.id === id ? { ...uc, ...updatedData } : uc
    )
  })),

  removeUseCase: (id) => set((state) => ({
    useCases: state.useCases.filter((uc) => uc.id !== id),
    relations: state.relations.filter(
      (rel) => rel.sourceId !== id && rel.targetId !== id
    )
  })),

  addRelation: (relation) => set((state) => ({
    relations: [...state.relations, relation]
  })),

  removeRelation: (id) => set((state) => ({
    relations: state.relations.filter((rel) => rel.id !== id)
  }))
}));

export default useDiagramStore;
