"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

export type Tier = "S" | "A" | "B" | "C" | "D" | "E";

export interface TierRecommendation {
  id: string;
  title: string;
  imageUrl: string;
  status: string;
  tier: Tier | null;
  tierOrder?: number;
  adminReview?: string | null;
}

export interface UserSession {
  id: string;
  role: "ADMIN" | "USER";
  name?: string | null;
  email?: string | null;
}

interface TierListProps {
  recommendations: TierRecommendation[];
  currentUser: UserSession;
  onUpdateTier?: (id: string, newTier: Tier | null) => void;
  onReorder?: (updatedList: TierRecommendation[]) => void;
}

interface TierConfig {
  name: Tier;
  colorClass: string;
}

const TIER_CONFIGS: TierConfig[] = [
  { name: "S", colorClass: "bg-red-400 text-black" },
  { name: "A", colorClass: "bg-orange-300 text-black" },
  { name: "B", colorClass: "bg-amber-200 text-black" },
  { name: "C", colorClass: "bg-yellow-200 text-black" },
  { name: "D", colorClass: "bg-green-300 text-black" },
  { name: "E", colorClass: "bg-green-400 text-black" },
];

export default function TierList({
  recommendations,
  currentUser,
  onReorder,
}: TierListProps) {
  const [items, setItems] = useState<TierRecommendation[]>(recommendations);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setItems(recommendations);
  }, [recommendations]);

  const isAdmin = currentUser.role === "ADMIN";

  // Obtener items ordenados de un tier específico (de izquierda a derecha por tierOrder)
  function getTierItems(tierName: Tier): TierRecommendation[] {
    return items
      .filter((it) => it.tier === tierName)
      .sort((a, b) => (a.tierOrder ?? 0) - (b.tierOrder ?? 0));
  }

  // Manejador de Drag and Drop completo: mover entre tiers y ordenar dentro del mismo tier
  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceDroppable = source.droppableId;
    const destDroppable = destination.droppableId;

    const draggedItem = items.find((it) => it.id === draggableId);
    if (!draggedItem) return;

    const prevItems = [...items];
    let updatedItems = [...items];
    const itemsToPersist: { id: string; tier: Tier | null; tierOrder: number }[] = [];

    // CASO 1: Reordenar dentro del mismo TIER (jerarquía de izquierda a derecha)
    if (sourceDroppable === destDroppable && destDroppable !== "BANK") {
      const tierName = destDroppable as Tier;
      const tierList = getTierItems(tierName);

      const [moved] = tierList.splice(source.index, 1);
      tierList.splice(destination.index, 0, moved);

      const reindexed = tierList.map((item, index) => ({
        ...item,
        tier: tierName,
        tierOrder: index,
      }));

      updatedItems = updatedItems.map((item) => {
        const found = reindexed.find((r) => r.id === item.id);
        return found ? found : item;
      });

      reindexed.forEach((item) => {
        itemsToPersist.push({
          id: item.id,
          tier: item.tier,
          tierOrder: item.tierOrder,
        });
      });
    }

    // CASO 2: Mover entre diferentes TIERS en una posición específica
    else if (sourceDroppable !== "BANK" && destDroppable !== "BANK") {
      const sourceTier = sourceDroppable as Tier;
      const destTier = destDroppable as Tier;

      const sourceList = getTierItems(sourceTier);
      const destList = getTierItems(destTier);

      const [moved] = sourceList.splice(source.index, 1);
      const updatedMoved = { ...moved, tier: destTier };

      destList.splice(destination.index, 0, updatedMoved);

      const reindexedSource = sourceList.map((item, index) => ({
        ...item,
        tierOrder: index,
      }));

      const reindexedDest = destList.map((item, index) => ({
        ...item,
        tier: destTier,
        tierOrder: index,
      }));

      const allModified = [...reindexedSource, ...reindexedDest];

      updatedItems = updatedItems.map((item) => {
        const found = allModified.find((r) => r.id === item.id);
        return found ? found : item;
      });

      allModified.forEach((item) => {
        itemsToPersist.push({
          id: item.id,
          tier: item.tier,
          tierOrder: item.tierOrder,
        });
      });
    }

    // CASO 3: Arrastrar desde el BANK hacia un TIER en posición específica
    else if (sourceDroppable === "BANK" && destDroppable !== "BANK") {
      const destTier = destDroppable as Tier;
      const destList = getTierItems(destTier);

      const updatedMoved = { ...draggedItem, tier: destTier };
      destList.splice(destination.index, 0, updatedMoved);

      const reindexedDest = destList.map((item, index) => ({
        ...item,
        tier: destTier,
        tierOrder: index,
      }));

      updatedItems = updatedItems.map((item) => {
        const found = reindexedDest.find((r) => r.id === item.id);
        return found ? found : item;
      });

      reindexedDest.forEach((item) => {
        itemsToPersist.push({
          id: item.id,
          tier: item.tier,
          tierOrder: item.tierOrder,
        });
      });
    }

    // CASO 4: Regresar desde un TIER hacia el BANK
    else if (sourceDroppable !== "BANK" && destDroppable === "BANK") {
      const sourceTier = sourceDroppable as Tier;
      const sourceList = getTierItems(sourceTier);

      sourceList.splice(source.index, 1);

      const reindexedSource = sourceList.map((item, index) => ({
        ...item,
        tierOrder: index,
      }));

      const unassignedItem = { ...draggedItem, tier: null, tierOrder: 0 };
      const allModified = [...reindexedSource, unassignedItem];

      updatedItems = updatedItems.map((item) => {
        const found = allModified.find((r) => r.id === item.id);
        return found ? found : item;
      });

      allModified.forEach((item) => {
        itemsToPersist.push({
          id: item.id,
          tier: item.tier,
          tierOrder: item.tierOrder,
        });
      });
    }

    // 1. Actualización optimista instantánea
    setItems(updatedItems);
    if (onReorder) {
      onReorder(updatedItems);
    }

    // 2. Fetch en segundo plano para guardar el nuevo orden
    try {
      const res = await fetch("/api/recommendations/reorder-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToPersist }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error al guardar orden de tiers:", errorData);
        alert(errorData.error || "No se pudo sincronizar el nuevo orden.");
        setItems(prevItems);
        if (onReorder) onReorder(prevItems);
      }
    } catch (err) {
      console.error("Error de red al actualizar orden:", err);
      alert("Error de red al guardar el orden.");
      setItems(prevItems);
      if (onReorder) onReorder(prevItems);
    }
  }

  // Animes terminados que aún no tienen tier asignado
  const bankItems = items.filter(
    (item) => item.status === "COMPLETED" && item.tier === null
  );

  // Si no está montado (SSR en Next.js) o es usuario normal, se muestra la vista estática ordenada
  if (!mounted || !isAdmin) {
    return (
      <div className="w-full space-y-4 font-sans">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1f2128]">
          <p className="text-xs text-zinc-400">
            Haz clic en la portada de cualquier anime para ver la reseña y el debate. Los animes están ordenados de mejor a peor dentro de cada fila.
          </p>
          <span className="text-xs text-zinc-500 font-mono">
            {items.filter((i) => i.tier !== null).length} animes clasificados
          </span>
        </div>

        <div className="space-y-1.5 overflow-hidden rounded-md border border-black shadow-lg">
          {TIER_CONFIGS.map((tier) => {
            const tierItems = getTierItems(tier.name);

            return (
              <div
                key={tier.name}
                className="flex border-b border-black last:border-b-0 min-h-[96px] bg-zinc-900"
              >
                {/* Etiqueta del Tier */}
                <div
                  className={`w-20 sm:w-24 flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 uppercase select-none border-r border-black ${tier.colorClass}`}
                >
                  {tier.name}
                </div>

                {/* Contenedor de portadas */}
                <div className="bg-zinc-900 flex-1 p-2 flex flex-wrap gap-2 items-center">
                  {tierItems.length === 0 ? (
                    <span className="text-zinc-600 text-xs italic pl-3 select-none">
                      Sin animes en este tier
                    </span>
                  ) : (
                    tierItems.map((item) => (
                      <Link
                        key={item.id}
                        href={`/anime/${item.id}`}
                        title={`${item.title} - Ver opinión`}
                        className="relative group w-16 h-22 sm:w-20 sm:h-28 rounded overflow-hidden border border-black bg-zinc-950 shrink-0 hover:scale-105 hover:border-white transition-all shadow-sm"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 text-center">
                          <span className="text-[10px] text-white font-medium line-clamp-2 leading-tight">
                            {item.title}
                          </span>
                          <span className="text-[9px] text-blue-300 underline font-semibold">
                            Ver opinión →
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vista de ADMIN con Drag and Drop (@hello-pangea/dnd) con soporte de reordenamiento
  return (
    <div className="w-full space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#1f2128] gap-2">
        <p className="text-xs text-zinc-300">
          <span className="font-semibold text-blue-400">Modo Administrador:</span> Arrastra las carátulas para ordenarlas dentro del tier (la más a la izquierda es superior) o muévelas de fila.
        </p>
        <span className="text-xs text-zinc-400 font-mono">
          {items.filter((i) => i.tier !== null).length} en tiers • {bankItems.length} en banco
        </span>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Cuadrícula Clásica de Tier List */}
        <div className="space-y-1.5 overflow-hidden rounded-md border border-black shadow-xl">
          {TIER_CONFIGS.map((tier) => {
            const tierItems = getTierItems(tier.name);

            return (
              <div
                key={tier.name}
                className="flex border-b border-black last:border-b-0 min-h-[104px] bg-zinc-900"
              >
                {/* Etiqueta del Tier */}
                <div
                  className={`w-20 sm:w-24 flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 uppercase select-none border-r border-black ${tier.colorClass}`}
                >
                  {tier.name}
                </div>

                {/* Zona Droppable para portadas */}
                <Droppable droppableId={tier.name} direction="horizontal">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-zinc-900 flex-1 p-2 flex flex-wrap gap-2 items-center transition-colors min-h-[104px] ${
                        snapshot.isDraggingOver
                          ? "bg-zinc-800/90 ring-2 ring-inset ring-blue-500/50"
                          : ""
                      }`}
                    >
                      {tierItems.map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={item.id}
                          index={index}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`relative group w-16 h-22 sm:w-20 sm:h-28 rounded overflow-hidden border border-black bg-zinc-950 shrink-0 cursor-grab active:cursor-grabbing transition-transform ${
                                dragSnapshot.isDragging
                                  ? "shadow-2xl scale-105 z-50 ring-2 ring-white"
                                  : "hover:border-zinc-400"
                              }`}
                              title={`${item.title} (Posición #${index + 1} en Tier ${tier.name})`}
                            >
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover pointer-events-none select-none"
                              />
                              <Link
                                href={`/anime/${item.id}`}
                                className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 text-center"
                                onClick={(e) => {
                                  if (dragSnapshot.isDragging) e.preventDefault();
                                }}
                              >
                                <span className="text-[10px] text-white font-medium line-clamp-2 leading-tight">
                                  {item.title}
                                </span>
                                <span className="text-[9px] text-blue-300 underline font-semibold">
                                  Ver opinión →
                                </span>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {tierItems.length === 0 && !snapshot.isDraggingOver && (
                        <span className="text-zinc-600 text-xs italic pl-3 select-none">
                          Arrastra series aquí
                        </span>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>

        {/* Banco de Series Terminadas (Solo Admin) */}
        <div className="mt-8 bg-[#121318] border border-[#22242a] rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#1f2128] gap-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Banco de Series Terminadas</span>
                <span className="text-xs font-normal text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                  {bankItems.length}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Series con estado <strong className="text-emerald-400">Terminado</strong> que aún no tienen tier asignado. Arrástralas hacia la cuadrícula de arriba en la posición que desees.
              </p>
            </div>
          </div>

          <Droppable droppableId="BANK" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`bg-zinc-900 border border-black rounded-lg p-3 min-h-[124px] flex flex-wrap gap-2.5 items-center transition-colors ${
                  snapshot.isDraggingOver
                    ? "bg-zinc-800/90 ring-2 ring-inset ring-amber-500/50"
                    : ""
                }`}
              >
                {bankItems.length === 0 && !snapshot.isDraggingOver ? (
                  <div className="w-full text-center py-6 text-zinc-500 text-xs italic">
                    No hay series terminadas pendientes de clasificar en el banco.
                  </div>
                ) : (
                  bankItems.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                    >
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`relative group w-16 h-22 sm:w-20 sm:h-28 rounded overflow-hidden border border-black bg-zinc-950 shrink-0 cursor-grab active:cursor-grabbing transition-transform ${
                            dragSnapshot.isDragging
                              ? "shadow-2xl scale-105 z-50 ring-2 ring-white"
                              : "hover:border-zinc-400"
                          }`}
                          title={`${item.title} (Arrastrar a la Tier List)`}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover pointer-events-none select-none"
                          />
                          <Link
                            href={`/anime/${item.id}`}
                            className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 text-center"
                            onClick={(e) => {
                              if (dragSnapshot.isDragging) e.preventDefault();
                            }}
                          >
                            <span className="text-[10px] text-white font-medium line-clamp-2 leading-tight">
                              {item.title}
                            </span>
                            <span className="text-[9px] text-blue-300 underline font-semibold">
                              Ver opinión →
                            </span>
                          </Link>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}
