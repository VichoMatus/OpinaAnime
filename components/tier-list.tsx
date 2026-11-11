"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Tier, TIER_CONFIGS } from "@/lib/tier-styles";

export type { Tier };

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

export default function TierList({
  recommendations,
  currentUser,
  onReorder,
}: TierListProps) {
  const [items, setItems] = useState<TierRecommendation[]>(recommendations);
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

    setErrorMessage("");
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
        setErrorMessage(errorData.error || "No se pudo guardar el nuevo orden de la Tier List.");
        setItems(prevItems);
        if (onReorder) onReorder(prevItems);
      }
    } catch {
      setErrorMessage("Error de conexión al guardar el orden de la Tier List.");
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-sm text-fg-muted">
            Toca cualquier portada para leer la reseña y sumarte a las opiniones. Dentro de cada fila están ordenados del favorito al menos favorito.
          </p>
          <span className="shrink-0 rounded-full bg-surface-subtle px-3 py-1 text-xs font-semibold text-fg-muted border border-border">
            {items.filter((i) => i.tier !== null).length} animes clasificados
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated divide-y divide-border">
          {TIER_CONFIGS.map((tier) => {
            const tierItems = getTierItems(tier.name);

            return (
              <div
                key={tier.name}
                className="flex min-h-[112px] bg-surface"
              >
                {/* Etiqueta del Tier */}
                <div
                  style={tier.badgeStyle}
                  className="w-20 sm:w-28 flex flex-col items-center justify-center shrink-0 select-none border-r border-border p-2 text-center"
                >
                  <span className="font-display font-extrabold text-2xl sm:text-3xl leading-none">
                    {tier.name}
                  </span>
                  <span className="mt-1 text-[10px] font-semibold opacity-90 hidden sm:block">
                    {tier.subtitle}
                  </span>
                </div>

                {/* Contenedor de portadas */}
                <div className="flex-1 p-3 flex flex-wrap gap-3 items-center bg-surface-subtle/40">
                  {tierItems.length === 0 ? (
                    <span className="text-fg-subtle text-sm italic pl-2 select-none">
                      Aún no hay animes clasificados en el Tier {tier.name}
                    </span>
                  ) : (
                    tierItems.map((item) => (
                      <Link
                        key={item.id}
                        href={`/anime/${item.id}`}
                        title={`${item.title} — Ver opiniones`}
                        className="relative group w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden border border-border-strong bg-surface shrink-0 hover:scale-105 hover:border-primary focus-visible:outline-2 focus-visible:outline-ring transition-all shadow-card"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-overlay-strong via-overlay to-transparent p-2 pt-5 opacity-95 group-hover:opacity-100 transition-opacity">
                          <span className="block text-[11px] text-tier-fg font-semibold line-clamp-2 leading-tight">
                            {item.title}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border bg-surface p-4 shadow-card">
        <p className="text-sm text-fg-muted">
          <strong className="font-semibold text-primary">Modo Administrador:</strong> Arrastra las portadas para ordenarlas dentro de cada tier (de mejor a peor, de izquierda a derecha) o muévelas entre filas.
        </p>
        <span className="shrink-0 rounded-full bg-surface-subtle px-3 py-1 text-xs font-semibold text-fg-muted border border-border">
          {items.filter((i) => i.tier !== null).length} en tiers • {bankItems.length} por clasificar
        </span>
      </div>

      {errorMessage && (
        <div role="alert" className="form-error justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-xs font-semibold underline"
          >
            Cerrar
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Cuadrícula de Tier List */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated divide-y divide-border">
          {TIER_CONFIGS.map((tier) => {
            const tierItems = getTierItems(tier.name);

            return (
              <div
                key={tier.name}
                className="flex min-h-[116px] bg-surface"
              >
                {/* Etiqueta del Tier */}
                <div
                  style={tier.badgeStyle}
                  className="w-20 sm:w-28 flex flex-col items-center justify-center shrink-0 select-none border-r border-border p-2 text-center"
                >
                  <span className="font-display font-extrabold text-2xl sm:text-3xl leading-none">
                    {tier.name}
                  </span>
                  <span className="mt-1 text-[10px] font-semibold opacity-90 hidden sm:block">
                    {tier.subtitle}
                  </span>
                </div>

                {/* Zona Droppable para portadas */}
                <Droppable droppableId={tier.name} direction="horizontal">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 flex flex-wrap gap-3 items-center transition-colors min-h-[116px] ${
                        snapshot.isDraggingOver
                          ? "bg-primary-soft/50 ring-2 ring-inset ring-primary"
                          : "bg-surface-subtle/40"
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
                              className={`relative group w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden border bg-surface shrink-0 cursor-grab active:cursor-grabbing transition-transform ${
                                dragSnapshot.isDragging
                                  ? "shadow-modal scale-105 z-50 ring-2 ring-primary border-primary"
                                  : "border-border-strong hover:border-primary shadow-card"
                              }`}
                              title={`${item.title} (Posición #${index + 1} en Tier ${tier.name})`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover pointer-events-none select-none"
                              />
                              <Link
                                href={`/anime/${item.id}`}
                                className="absolute inset-0 bg-overlay-strong opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-center"
                                onClick={(e) => {
                                  if (dragSnapshot.isDragging) e.preventDefault();
                                }}
                              >
                                <span className="text-[11px] text-tier-fg font-semibold line-clamp-2 leading-tight">
                                  {item.title}
                                </span>
                                <span className="text-[10px] text-warning-border underline font-semibold">
                                  Ver debate →
                                </span>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {tierItems.length === 0 && !snapshot.isDraggingOver && (
                        <span className="text-fg-subtle text-sm italic pl-2 select-none">
                          Arrastra series aquí para clasificarlas en el Tier {tier.name}
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
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-border gap-2">
            <div>
              <h3 className="text-base font-bold text-fg flex items-center gap-2">
                <span>Banco de animes terminados sin clasificar</span>
                <span className="text-xs font-semibold text-fg-muted bg-surface-subtle px-2.5 py-0.5 rounded-full border border-border">
                  {bankItems.length}
                </span>
              </h3>
              <p className="text-sm text-fg-muted mt-1">
                Animes marcados como <strong className="text-success">Terminado</strong> que aún no tienen un tier asignado. Arrástralos hacia la fila que prefieras.
              </p>
            </div>
          </div>

          <Droppable droppableId="BANK" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`rounded-xl border border-dashed border-border-strong p-4 min-h-[132px] flex flex-wrap gap-3 items-center transition-colors ${
                  snapshot.isDraggingOver
                    ? "bg-primary-soft/40 ring-2 ring-inset ring-primary"
                    : "bg-surface-subtle/50"
                }`}
              >
                {bankItems.length === 0 && !snapshot.isDraggingOver ? (
                  <div className="w-full text-center py-6 text-fg-subtle text-sm">
                    ¡Todo al día! No hay animes terminados pendientes de clasificar en el banco.
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
                          className={`relative group w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden border bg-surface shrink-0 cursor-grab active:cursor-grabbing transition-transform ${
                            dragSnapshot.isDragging
                              ? "shadow-modal scale-105 z-50 ring-2 ring-primary border-primary"
                              : "border-border-strong hover:border-primary shadow-card"
                          }`}
                          title={`${item.title} (Arrastrar a la Tier List)`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover pointer-events-none select-none"
                          />
                          <Link
                            href={`/anime/${item.id}`}
                            className="absolute inset-0 bg-overlay-strong opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-center"
                            onClick={(e) => {
                              if (dragSnapshot.isDragging) e.preventDefault();
                            }}
                          >
                            <span className="text-[11px] text-tier-fg font-semibold line-clamp-2 leading-tight">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-warning-border underline font-semibold">
                              Ver debate →
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
